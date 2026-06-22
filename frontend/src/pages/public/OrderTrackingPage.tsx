import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, ChefHat, Truck, Package, MapPin, Phone, ArrowLeft, Star } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import DeliveryMap from '@/components/delivery/DeliveryMap';
import NavigationInstructions from '@/components/delivery/NavigationInstructions';
import type { GPSCoordinates, DeliveryLocation, RouteResponse, NavigationInstruction } from '@/types';
import { toast } from 'sonner';

interface Order {
  id: string;
  order_number: string;
  status: string;
  delivery_status: string;
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string;
  payment_status: string;
  delivery_notes: string | null;
  estimated_delivery_time: string | null;
  delivered_at: string | null;
  created_at: string;
  delivery_person_id: string | null;
  restaurant: {
    name: string;
    phone: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
  };
  delivery_address: {
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    postal_code: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  delivery_person: {
    full_name: string;
    phone: string;
    vehicle_type: string;
  } | null;
  order_items: Array<{
    quantity: number;
    unit_price: number;
    subtotal: number;
    notes: string | null;
    menu_item: {
      name: string;
    };
  }>;
}

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliveryLocation, setDeliveryLocation] = useState<GPSCoordinates | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null);
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrder();
      subscribeToOrderUpdates();
    }
  }, [id]);

  // Charger la position du livreur toutes les 30 secondes
  useEffect(() => {
    if (order?.delivery_person_id && order.delivery_status === 'delivering') {
      loadDeliveryLocation();
      const interval = setInterval(loadDeliveryLocation, 30000); // 30 secondes
      return () => clearInterval(interval);
    }
  }, [order?.delivery_person_id, order?.delivery_status]);

  // Calculer le trajet routier quand les coordonnées sont disponibles
  useEffect(() => {
    if (
      order?.restaurant?.latitude &&
      order?.restaurant?.longitude &&
      order?.delivery_address?.latitude &&
      order?.delivery_address?.longitude &&
      order?.delivery_status === 'delivering'
    ) {
      calculateRoute();
    }
  }, [order?.restaurant, order?.delivery_address, order?.delivery_status]);

  // Calculer la distance et le temps estimé à partir des données de route
  useEffect(() => {
    if (routeData) {
      const distanceMeters = routeData.distance;
      const durationSeconds = routeData.duration;
      setDistanceKm(Math.round((distanceMeters / 1000) * 100) / 100);
      setEstimatedMinutes(Math.ceil(durationSeconds / 60));
    }
  }, [routeData]);

  const calculateRoute = async () => {
    if (!order?.restaurant?.latitude || !order?.delivery_address?.latitude) return;
    if (loadingRoute) return;

    setLoadingRoute(true);

    try {
      const { data, error } = await supabase.functions.invoke('calculate-route', {
        body: {
          start: [order.restaurant.longitude, order.restaurant.latitude],
          end: [order.delivery_address.longitude, order.delivery_address.latitude],
          profile: 'driving-car',
        },
      });

      if (error) {
        console.error('Erreur lors du calcul du trajet:', error);
        toast.error('Impossible de calculer le trajet optimisé');
        return;
      }

      if (data.fallback) {
        toast.info('Trajet approximatif affiché (API indisponible)');
      }

      setRouteData(data);
    } catch (error: any) {
      console.error('Erreur lors du calcul du trajet:', error);
    } finally {
      setLoadingRoute(false);
    }
  };

  const loadOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant:restaurants(name, phone, address, latitude, longitude),
          delivery_address:delivery_addresses(*, latitude, longitude),
          delivery_person:delivery_personnel(full_name, phone, vehicle_type),
          order_items(
            *,
            menu_item:menu_items(name)
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setOrder(data);
    } catch (error: any) {
      console.error('Erreur lors du chargement de la commande:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveryLocation = async () => {
    if (!order?.delivery_person_id) return;

    try {
      const { data, error } = await supabase
        .from('delivery_locations')
        .select('*')
        .eq('delivery_person_id', order.delivery_person_id)
        .eq('order_id', order.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setDeliveryLocation({
          lat: Number(data.latitude),
          lng: Number(data.longitude),
        });
        setLastUpdated(data.recorded_at);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement de la position:', error);
    }
  };

  const subscribeToOrderUpdates = () => {
    const channel = supabase
      .channel(`order-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${id}`,
        },
        () => {
          loadOrder();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const getStatusSteps = () => {
    const steps = [
      { key: 'pending', label: 'Commande reçue', icon: Package },
      { key: 'confirmed', label: 'Confirmée', icon: CheckCircle },
      { key: 'preparing', label: 'En préparation', icon: ChefHat },
      { key: 'ready', label: 'Prête', icon: Clock },
      { key: 'delivering', label: 'En livraison', icon: Truck },
      { key: 'delivered', label: 'Livrée', icon: CheckCircle },
    ];

    const currentIndex = steps.findIndex((s) => s.key === order?.delivery_status);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmée', className: 'bg-blue-100 text-blue-800' },
      preparing: { label: 'En préparation', className: 'bg-orange-100 text-orange-800' },
      ready: { label: 'Prête', className: 'bg-purple-100 text-purple-800' },
      delivering: { label: 'En livraison', className: 'bg-indigo-100 text-indigo-800' },
      delivered: { label: 'Livrée', className: 'bg-green-100 text-green-800' },
    };

    const config = statusMap[status] || statusMap.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const canShowMap = () => {
    return (
      order?.delivery_status === 'delivering' &&
      order?.restaurant?.latitude &&
      order?.restaurant?.longitude &&
      order?.delivery_address?.latitude &&
      order?.delivery_address?.longitude
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Commande non trouvée</p>
            <Link to="/restaurants">
              <Button>Retour aux restaurants</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/restaurants">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-medium">Suivi de commande</h1>
              <p className="text-sm text-muted-foreground">N° {order.order_number}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Statut actuel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Statut de la commande</CardTitle>
                {getStatusBadge(order.delivery_status)}
              </div>
            </CardHeader>
            <CardContent>
              {/* Timeline */}
              <div className="space-y-4">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          step.completed
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            step.completed ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {step.label}
                        </p>
                        {step.current && order.estimated_delivery_time && (
                          <p className="text-sm text-muted-foreground">
                            Livraison estimée:{' '}
                            {format(new Date(order.estimated_delivery_time), 'HH:mm', { locale: fr })}
                          </p>
                        )}
                      </div>
                      {step.completed && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Adresse de livraison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Adresse de livraison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{order.delivery_address.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {order.delivery_address.address_line1}
              </p>
              {order.delivery_address.address_line2 && (
                <p className="text-sm text-muted-foreground">
                  {order.delivery_address.address_line2}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {order.delivery_address.postal_code} {order.delivery_address.city}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                <Phone className="w-4 h-4" />
                <span>{order.delivery_address.phone}</span>
              </div>
              {order.delivery_notes && (
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Instructions:</span> {order.delivery_notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Carte GPS de suivi en temps réel */}
          {canShowMap() && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Suivi en temps réel
                  </CardTitle>
                  {lastUpdated && (
                    <span className="text-xs text-muted-foreground">
                      Mis à jour: {format(new Date(lastUpdated), 'HH:mm:ss', { locale: fr })}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Informations du livreur */}
                {order.delivery_person && (
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Truck className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{order.delivery_person.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.delivery_person.vehicle_type === 'bike' && 'Vélo'}
                        {order.delivery_person.vehicle_type === 'motorcycle' && 'Moto'}
                        {order.delivery_person.vehicle_type === 'scooter' && 'Scooter'}
                        {order.delivery_person.vehicle_type === 'car' && 'Voiture'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{order.delivery_person.phone}</span>
                    </div>
                  </div>
                )}

                {/* Estimation de livraison */}
                {distanceKm !== null && estimatedMinutes !== null && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary">{distanceKm} km</p>
                      <p className="text-sm text-muted-foreground">Distance restante</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary">{estimatedMinutes} min</p>
                      <p className="text-sm text-muted-foreground">Temps estimé</p>
                    </div>
                  </div>
                )}

                {/* Carte interactive */}
                <DeliveryMap
                  restaurantLocation={{
                    lat: order.restaurant.latitude!,
                    lng: order.restaurant.longitude!,
                  }}
                  deliveryLocation={deliveryLocation}
                  destinationLocation={{
                    lat: order.delivery_address.latitude!,
                    lng: order.delivery_address.longitude!,
                  }}
                  restaurantName={order.restaurant.name}
                  deliveryPersonName={order.delivery_person?.full_name}
                  destinationAddress={order.delivery_address.address_line1}
                  showRoute={true}
                  autoCenter={true}
                  height="500px"
                  routeGeometry={routeData?.geometry || null}
                />

                {!deliveryLocation && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    En attente de la position du livreur...
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instructions de navigation */}
          {canShowMap() && routeData && routeData.segments && routeData.segments.length > 0 && (
            <NavigationInstructions
              instructions={routeData.segments[0].steps}
              showAll={true}
            />
          )}

          {/* Détail de la commande */}
          <Card>
            <CardHeader>
              <CardTitle>Détail de la commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {order.order_items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.menu_item.name}
                      {item.notes && (
                        <span className="text-muted-foreground block text-xs">
                          Note: {item.notes}
                        </span>
                      )}
                    </span>
                    <span>{item.subtotal.toFixed(2)} FCFA</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sous-total</span>
                  <span>{order.subtotal.toFixed(2)} FCFA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TVA</span>
                  <span>{order.tax.toFixed(2)} FCFA</span>
                </div>
                <div className="flex justify-between text-lg font-medium pt-2 border-t border-border">
                  <span>Total</span>
                  <span>{order.total.toFixed(2)} FCFA</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border text-sm text-muted-foreground">
                <p>Mode de paiement: {order.payment_method === 'card' ? 'Carte bancaire' : order.payment_method === 'wave' ? 'Wave' : 'Orange Money'}</p>
                <p>Commande passée le {format(new Date(order.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
              </div>

              {/* Bouton évaluation — visible si commande livrée */}
              {(order.delivery_status === 'delivered' ||
                order.status === 'served' ||
                order.status === 'paid' ||
                order.status === 'completed') && (
                <div className="pt-4 border-t border-border">
                  <Button variant="outline" className="w-full gap-2" asChild>
                    <Link to={`/review/${order.id}`}>
                      <Star className="h-4 w-4" />
                      Évaluer les plats
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Restaurant */}
          <Card>
            <CardHeader>
              <CardTitle>Restaurant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{order.restaurant.name}</p>
              <p className="text-sm text-muted-foreground">{order.restaurant.address}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{order.restaurant.phone}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

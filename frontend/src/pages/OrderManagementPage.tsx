import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Package, Clock, CheckCircle, XCircle, Truck, MapPin, Phone, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Order as BaseOrder, DeliveryPersonnel, DeliveryAddress } from '@/types';

interface Order extends BaseOrder {
  delivery_addresses?: DeliveryAddress | null;
  delivery_personnel?: DeliveryPersonnel | null;
}

export default function OrderManagementPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPersonnel, setDeliveryPersonnel] = useState<DeliveryPersonnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (profile?.restaurant_id) {
      loadOrders();
      loadDeliveryPersonnel();
    }
  }, [profile?.restaurant_id, filterStatus]);

  const loadOrders = async () => {
    if (!profile?.restaurant_id) return;

    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select(`
          *,
          delivery_addresses (
            address_line1,
            address_line2,
            city,
            phone
          ),
          delivery_personnel (
            full_name,
            phone,
            vehicle_type
          )
        `)
        .eq('restaurant_id', profile.restaurant_id)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveryPersonnel = async () => {
    if (!profile?.restaurant_id) return;

    try {
      const { data, error } = await supabase
        .from('delivery_personnel')
        .select('*')
        .eq('restaurant_id', profile.restaurant_id)
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setDeliveryPersonnel(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des livreurs:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Statut de la commande mis à jour');
      loadOrders();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const updateDeliveryStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          delivery_status: newStatus,
          delivered_at: newStatus === 'delivered' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Statut de livraison mis à jour');
      loadOrders();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de livraison:', error);
      toast.error('Erreur lors de la mise à jour du statut de livraison');
    }
  };

  const assignDeliveryPerson = async (orderId: string, deliveryPersonId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          delivery_person_id: deliveryPersonId,
          delivery_status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Mettre à jour le statut du livreur
      await supabase
        .from('delivery_personnel')
        .update({ status: 'busy' })
        .eq('id', deliveryPersonId);

      toast.success('Livreur assigné à la commande');
      loadOrders();
      loadDeliveryPersonnel();
    } catch (error) {
      console.error('Erreur lors de l\'assignation du livreur:', error);
      toast.error('Erreur lors de l\'assignation du livreur');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'En attente', variant: 'outline' },
      in_progress: { label: 'En préparation', variant: 'default' },
      ready: { label: 'Prêt', variant: 'secondary' },
      served: { label: 'Servi', variant: 'secondary' },
      paid: { label: 'Payé', variant: 'secondary' },
      completed: { label: 'Terminé', variant: 'secondary' },
      cancelled: { label: 'Annulé', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDeliveryStatusBadge = (status: string | null) => {
    if (!status) return null;

    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'En attente', variant: 'outline' },
      assigned: { label: 'Assigné', variant: 'default' },
      picked_up: { label: 'Récupéré', variant: 'default' },
      in_transit: { label: 'En route', variant: 'default' },
      delivered: { label: 'Livré', variant: 'secondary' },
      failed: { label: 'Échec', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Commandes</h1>
          <p className="text-muted-foreground">Gérez les commandes et les livraisons</p>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Statut de la commande</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les commandes</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="in_progress">En préparation</SelectItem>
                  <SelectItem value="ready">Prêt</SelectItem>
                  <SelectItem value="served">Servi</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des commandes */}
      <div className="grid gap-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Aucune commande trouvée</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Commande #{order.order_number}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(order.created_at), 'PPP à HH:mm', { locale: fr })}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(order.status)}
                    {order.order_type === 'delivery' && getDeliveryStatusBadge(order.delivery_status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Type de commande</p>
                    <p className="font-medium">
                      {order.order_type === 'delivery' ? 'Livraison' : 'Sur place'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Montant total</p>
                    <p className="font-medium">{order.total.toLocaleString()} FCFA</p>
                  </div>
                </div>

                {/* Adresse de livraison */}
                {order.order_type === 'delivery' && order.delivery_addresses && (
                  <div className="border-t pt-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Adresse de livraison</p>
                        <p className="text-sm text-muted-foreground">
                          {order.delivery_addresses.address_line1}
                          {order.delivery_addresses.address_line2 && `, ${order.delivery_addresses.address_line2}`}
                        </p>
                        <p className="text-sm text-muted-foreground">{order.delivery_addresses.city}</p>
                        {order.delivery_addresses.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {order.delivery_addresses.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Livreur assigné */}
                {order.order_type === 'delivery' && order.delivery_personnel && (
                  <div className="border-t pt-4">
                    <div className="flex items-start gap-2">
                      <Truck className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Livreur assigné</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {order.delivery_personnel.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {order.delivery_personnel.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t pt-4 flex flex-wrap gap-2">
                  {/* Changer le statut de la commande */}
                  <Select
                    value={order.status}
                    onValueChange={(value) => updateOrderStatus(order.id, value)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="in_progress">En préparation</SelectItem>
                      <SelectItem value="ready">Prêt</SelectItem>
                      <SelectItem value="served">Servi</SelectItem>
                      <SelectItem value="paid">Payé</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Gestion de la livraison */}
                  {order.order_type === 'delivery' && (
                    <>
                      {/* Assigner un livreur */}
                      {!order.delivery_person_id && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline">
                              <Truck className="w-4 h-4 mr-2" />
                              Assigner un livreur
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Assigner un livreur</DialogTitle>
                              <DialogDescription>
                                Sélectionnez un livreur disponible pour cette commande
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {deliveryPersonnel.filter(dp => dp.status === 'available').length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  Aucun livreur disponible pour le moment
                                </p>
                              ) : (
                                deliveryPersonnel
                                  .filter(dp => dp.status === 'available')
                                  .map((dp) => (
                                    <Button
                                      key={dp.id}
                                      variant="outline"
                                      className="w-full justify-start"
                                      onClick={() => {
                                        assignDeliveryPerson(order.id, dp.id);
                                      }}
                                    >
                                      <User className="w-4 h-4 mr-2" />
                                      {dp.full_name} - {dp.phone}
                                      {dp.vehicle_type && ` (${dp.vehicle_type})`}
                                    </Button>
                                  ))
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* Changer le statut de livraison */}
                      {order.delivery_person_id && (
                        <Select
                          value={order.delivery_status || 'pending'}
                          onValueChange={(value) => updateDeliveryStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="assigned">Assigné</SelectItem>
                            <SelectItem value="picked_up">Récupéré</SelectItem>
                            <SelectItem value="in_transit">En route</SelectItem>
                            <SelectItem value="delivered">Livré</SelectItem>
                            <SelectItem value="failed">Échec</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

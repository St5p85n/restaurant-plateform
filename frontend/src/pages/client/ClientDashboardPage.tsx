import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  Package, 
  MapPin, 
  Phone,
  Calendar,
  TrendingUp,
  UtensilsCrossed,
  XCircle,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Order {
  id: string;
  order_number: string;
  restaurant_id: string;
  status: string;
  delivery_status: string;
  total: number;
  created_at: string;
  restaurant: {
    name: string;
    phone: string;
  };
  order_items: Array<{
    quantity: number;
    menu_item: {
      name: string;
    };
  }>;
}

export default function ClientDashboardPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (profile?.id) {
      loadOrders();
    }
  }, [profile]);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant:restaurants(name, phone),
          order_items(
            quantity,
            menu_item:menu_items(name)
          )
        `)
        .eq('customer_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Erreur chargement commandes:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          delivery_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('customer_id', profile?.id)
        .eq('status', 'pending');

      if (error) throw error;

      toast.success('Commande annulée avec succès');
      loadOrders();
    } catch (error: any) {
      console.error('Erreur annulation commande:', error);
      toast.error('Erreur lors de l\'annulation de la commande');
    }
  };

  const canCancelOrder = (order: Order) => {
    return order.status === 'pending' && order.delivery_status === 'pending';
  };

  const canModifyOrder = (order: Order) => {
    return order.status === 'pending' && order.delivery_status === 'pending';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'En attente', variant: 'secondary' },
      confirmed: { label: 'Confirmée', variant: 'default' },
      preparing: { label: 'En préparation', variant: 'default' },
      ready: { label: 'Prête', variant: 'default' },
      delivering: { label: 'En livraison', variant: 'default' },
      delivered: { label: 'Livrée', variant: 'outline' },
      cancelled: { label: 'Annulée', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'in_progress') {
      return ['pending', 'confirmed', 'preparing', 'ready', 'delivering'].includes(order.delivery_status);
    }
    if (activeTab === 'completed') {
      return order.delivery_status === 'delivered';
    }
    return true;
  });

  const stats = {
    total: orders.length,
    in_progress: orders.filter((o) => ['pending', 'confirmed', 'preparing', 'ready', 'delivering'].includes(o.delivery_status)).length,
    completed: orders.filter((o) => o.delivery_status === 'delivered').length,
    total_spent: orders.filter((o) => o.delivery_status === 'delivered').reduce((sum, o) => sum + o.total, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Mon Espace Client</h1>
        <p className="text-muted-foreground">
          Bienvenue {profile?.full_name || 'Client'}! Gérez vos commandes et suivez vos livraisons.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.in_progress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Livrées</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Dépensé</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_spent.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
      </div>

      {/* Action rapide */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-none">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Envie de commander?</h3>
              <p className="text-sm text-muted-foreground">
                Découvrez nos restaurants partenaires et passez commande
              </p>
            </div>
          </div>
          <Button asChild size="lg">
            <Link to="/order/restaurants">
              Commander maintenant
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Liste des commandes */}
      <Card>
        <CardHeader>
          <CardTitle>Mes Commandes</CardTitle>
          <CardDescription>
            Historique et suivi de toutes vos commandes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all">Toutes ({stats.total})</TabsTrigger>
              <TabsTrigger value="in_progress">En cours ({stats.in_progress})</TabsTrigger>
              <TabsTrigger value="completed">Livrées ({stats.completed})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === 'all' && "Vous n'avez pas encore passé de commande"}
                    {activeTab === 'in_progress' && "Vous n'avez pas de commande en cours"}
                    {activeTab === 'completed' && "Vous n'avez pas encore de commande livrée"}
                  </p>
                  <Button asChild>
                    <Link to="/order/restaurants">
                      Commander maintenant
                    </Link>
                  </Button>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Info commande */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">
                              {order.restaurant.name}
                            </h3>
                            {getStatusBadge(order.delivery_status)}
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(order.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                            </div>
                            <div className="flex items-center gap-1">
                              <Package className="w-4 h-4" />
                              {order.order_items.length} article{order.order_items.length > 1 ? 's' : ''}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {order.restaurant.phone}
                            </div>
                          </div>

                          {/* Articles */}
                          <div className="text-sm">
                            <span className="font-medium">Articles: </span>
                            {order.order_items.map((item, index) => (
                              <span key={index}>
                                {item.quantity}x {item.menu_item.name}
                                {index < order.order_items.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Total et actions */}
                        <div className="flex flex-col items-end gap-3">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="text-2xl font-bold">{order.total.toLocaleString()} FCFA</p>
                          </div>
                          <div className="flex gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link to={`/order/${order.id}`}>
                                Voir le suivi
                              </Link>
                            </Button>
                            {canCancelOrder(order) && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Annuler
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Annuler la commande</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Non, garder</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => cancelOrder(order.id)}>
                                      Oui, annuler
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

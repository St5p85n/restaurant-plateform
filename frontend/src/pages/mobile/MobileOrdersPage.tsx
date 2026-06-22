import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import OrderCard from '@/components/mobile/OrderCard';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  delivery_status?: string;
  restaurant: {
    name: string;
  };
  order_items: Array<{ id: string }>;
}

export default function MobileOrdersPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');

  useEffect(() => {
    if (profile) {
      loadOrders();
    }
  }, [profile]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant:restaurants(name),
          order_items(id)
        `)
        .eq('customer_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const currentOrders = orders.filter(
    (order) => ['pending', 'in_progress', 'ready'].includes(order.status)
  );

  const pastOrders = orders.filter(
    (order) => ['served', 'paid', 'cancelled'].includes(order.status)
  );

  const isDelivered = (order: Order) =>
    order.delivery_status === 'delivered' ||
    order.status === 'served' ||
    order.status === 'paid' ||
    order.status === 'completed';

  const handleOrderClick = (order: Order) => {
    navigate(`/mobile/orders/${order.id}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* En-tête */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4">
          <h1 className="text-xl font-semibold">Mes Commandes</h1>
          <p className="text-sm text-muted-foreground">
            {orders.length} commande{orders.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">
              En cours ({currentOrders.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Historique ({pastOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4 mt-4">
            {currentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="font-semibold mb-2">Aucune commande en cours</h3>
                <p className="text-sm text-muted-foreground">
                  Vos commandes en cours apparaîtront ici
                </p>
              </div>
            ) : (
              currentOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  id={order.id}
                  order_number={order.order_number}
                  restaurant_name={order.restaurant?.name || 'Restaurant'}
                  status={order.status}
                  total={order.total}
                  created_at={order.created_at}
                  items_count={order.order_items?.length || 0}
                  delivery_status={order.delivery_status}
                  onClick={() => handleOrderClick(order)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4 mt-4">
            {pastOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="font-semibold mb-2">Aucun historique</h3>
                <p className="text-sm text-muted-foreground">
                  Vos commandes passées apparaîtront ici
                </p>
              </div>
            ) : (
              pastOrders.map((order) => (
                <div key={order.id} className="space-y-2">
                  <OrderCard
                    id={order.id}
                    order_number={order.order_number}
                    restaurant_name={order.restaurant?.name || 'Restaurant'}
                    status={order.status}
                    total={order.total}
                    created_at={order.created_at}
                    items_count={order.order_items?.length || 0}
                    delivery_status={order.delivery_status}
                    onClick={() => handleOrderClick(order)}
                  />
                  {isDelivered(order) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 text-xs"
                      asChild
                    >
                      <Link to={`/review/${order.id}`}>
                        <Star className="h-3.5 w-3.5" />
                        Évaluer les plats
                      </Link>
                    </Button>
                  )}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

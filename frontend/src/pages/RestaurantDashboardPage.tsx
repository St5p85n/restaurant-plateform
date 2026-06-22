import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  Package,
  Clock,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Order, Reservation, StockItem } from '@/types';
import { toast } from 'sonner';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardStats {
  todayRevenue: number;
  todayCovers: number;
  tableOccupancy: number;
  weekRevenue: number[];
  weekCovers: number[];
  weekDates: string[];
}

export default function RestaurantDashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    todayCovers: 0,
    tableOccupancy: 0,
    weekRevenue: [],
    weekCovers: [],
    weekDates: [],
  });
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([]);
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    loadRestaurantId();
  }, [profile]);

  useEffect(() => {
    if (restaurantId) {
      loadDashboardData();
      
      // Configurer Realtime pour les mises à jour en temps réel
      const ordersChannel = supabase
        .channel('dashboard-orders')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `restaurant_id=eq.${restaurantId}`,
          },
          () => {
            loadDashboardData();
          }
        )
        .subscribe();

      const reservationsChannel = supabase
        .channel('dashboard-reservations')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reservations',
            filter: `restaurant_id=eq.${restaurantId}`,
          },
          () => {
            loadDashboardData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(ordersChannel);
        supabase.removeChannel(reservationsChannel);
      };
    }
  }, [restaurantId]);

  const loadRestaurantId = async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    try {
      // Récupérer le restaurant_id de l'utilisateur
      const { data, error } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', profile.id)
        .maybeSingle();

      if (error) throw error;
      if (data?.restaurant_id) {
        setRestaurantId(data.restaurant_id);
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      toast.error(`Erreur de chargement: ${error.message}`);
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);

      // Charger les statistiques du jour
      await loadTodayStats();

      // Charger les statistiques de la semaine
      await loadWeekStats();

      // Charger les réservations en attente
      await loadPendingReservations();

      // Charger les stocks faibles
      await loadLowStockItems();

      // Charger les commandes récentes
      await loadRecentOrders();
    } catch (error: any) {
      toast.error(`Erreur de chargement: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayStats = async () => {
    if (!restaurantId) return;

    const today = new Date();
    const startOfToday = startOfDay(today).toISOString();
    const endOfToday = endOfDay(today).toISOString();

    // CA du jour
    const { data: ordersData } = await supabase
      .from('orders')
      .select('total')
      .eq('restaurant_id', restaurantId)
      .eq('payment_status', 'paid')
      .gte('created_at', startOfToday)
      .lte('created_at', endOfToday);

    const todayRevenue = ordersData?.reduce((sum, order) => sum + order.total, 0) || 0;

    // Nombre de couverts (somme des party_size des réservations confirmées)
    const { data: reservationsData } = await supabase
      .from('reservations')
      .select('party_size')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'confirmed')
      .gte('created_at', startOfToday)
      .lte('created_at', endOfToday);

    const todayCovers = reservationsData?.reduce((sum, res) => sum + res.party_size, 0) || 0;

    // Taux d'occupation des tables
    const { data: tablesData } = await supabase
      .from('tables')
      .select('status')
      .eq('restaurant_id', restaurantId);

    const totalTables = tablesData?.length || 0;
    const occupiedTables = tablesData?.filter((t) => t.status === 'occupied').length || 0;
    const tableOccupancy = totalTables > 0 ? (occupiedTables / totalTables) * 100 : 0;

    setStats((prev) => ({
      ...prev,
      todayRevenue,
      todayCovers,
      tableOccupancy,
    }));
  };

  const loadWeekStats = async () => {
    if (!restaurantId) return;

    const weekRevenue: number[] = [];
    const weekCovers: number[] = [];
    const weekDates: string[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const startOfDate = startOfDay(date).toISOString();
      const endOfDate = endOfDay(date).toISOString();

      // CA du jour
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total')
        .eq('restaurant_id', restaurantId)
        .eq('payment_status', 'paid')
        .gte('created_at', startOfDate)
        .lte('created_at', endOfDate);

      const dayRevenue = ordersData?.reduce((sum, order) => sum + order.total, 0) || 0;
      weekRevenue.push(dayRevenue);

      // Couverts du jour
      const { data: reservationsData } = await supabase
        .from('reservations')
        .select('party_size')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'confirmed')
        .gte('created_at', startOfDate)
        .lte('created_at', endOfDate);

      const dayCovers = reservationsData?.reduce((sum, res) => sum + res.party_size, 0) || 0;
      weekCovers.push(dayCovers);

      weekDates.push(format(date, 'EEE', { locale: fr }));
    }

    setStats((prev) => ({
      ...prev,
      weekRevenue,
      weekCovers,
      weekDates,
    }));
  };

  const loadPendingReservations = async () => {
    if (!restaurantId) return;

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'pending')
      .order('reservation_date', { ascending: true })
      .limit(5);

    if (error) throw error;
    setPendingReservations(data || []);
  };

  const loadLowStockItems = async () => {
    if (!restaurantId) return;

    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('quantity', { ascending: true });

    if (error) {
      console.error('Erreur chargement stocks:', error);
      setLowStockItems([]);
    } else {
      // Filtrer côté client les items avec quantité <= min_quantity
      const lowItems = data?.filter((item) => item.quantity <= item.min_quantity) || [];
      setLowStockItems(lowItems.slice(0, 5));
    }
  };

  const loadRecentOrders = async () => {
    if (!restaurantId) return;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    setRecentOrders(data || []);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-warning" />
            <p className="text-lg font-medium mb-2">Restaurant non configuré</p>
            <p className="text-muted-foreground mb-6">
              Vous devez inscrire votre restaurant pour accéder au dashboard.
            </p>
            <Button onClick={() => window.location.href = '/register-restaurant'}>
              Inscrire mon restaurant
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxRevenue = Math.max(...stats.weekRevenue, 1);
  const maxCovers = Math.max(...stats.weekCovers, 1);

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de votre activité en temps réel
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {stats.todayRevenue.toFixed(2)} FCFA
            </div>
            <p className="text-xs text-muted-foreground mt-1">Aujourd'hui</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Couverts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayCovers}</div>
            <p className="text-xs text-muted-foreground mt-1">Aujourd'hui</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'occupation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.tableOccupancy.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Tables occupées</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique CA */}
        <Card>
          <CardHeader>
            <CardTitle>Chiffre d'affaires - 7 derniers jours</CardTitle>
            <CardDescription>Évolution du CA quotidien</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.weekDates.map((date, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{date}</span>
                    <span className="text-muted-foreground">
                      {stats.weekRevenue[index].toFixed(2)} FCFA
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${(stats.weekRevenue[index] / maxRevenue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Graphique Couverts */}
        <Card>
          <CardHeader>
            <CardTitle>Couverts - 7 derniers jours</CardTitle>
            <CardDescription>Évolution du nombre de couverts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.weekDates.map((date, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{date}</span>
                    <span className="text-muted-foreground">
                      {stats.weekCovers[index]} couverts
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary transition-all"
                      style={{
                        width: `${(stats.weekCovers[index] / maxCovers) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes et Activité */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Réservations en attente */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Réservations à confirmer
                </CardTitle>
                <CardDescription>Réservations en attente de validation</CardDescription>
              </div>
              {pendingReservations.length > 0 && (
                <Badge variant="destructive">{pendingReservations.length}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pendingReservations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success" />
                <p>Aucune réservation en attente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{reservation.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(reservation.reservation_date), 'PPP', { locale: fr })} à{' '}
                        {reservation.reservation_time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {reservation.party_size} personne(s)
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => toast.info('Fonctionnalité à venir')}
                    >
                      Confirmer
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stocks faibles */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Alertes stocks
                </CardTitle>
                <CardDescription>Produits à réapprovisionner</CardDescription>
              </div>
              {lowStockItems.length > 0 && (
                <Badge variant="destructive">{lowStockItems.length}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success" />
                <p>Tous les stocks sont suffisants</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Stock actuel: {item.quantity} {item.unit}
                      </p>
                      <p className="text-sm text-destructive">
                        Minimum: {item.min_quantity} {item.unit}
                      </p>
                    </div>
                    <AlertTriangle className="w-5 h-5 text-warning" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Commandes récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Activité récente
          </CardTitle>
          <CardDescription>Dernières commandes</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Aucune commande récente
            </p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">Commande #{order.order_number}</span>
                      <Badge variant="outline">{order.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'PPP à HH:mm', { locale: fr })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{order.total.toFixed(2)} FCFA</div>
                    <Badge
                      variant={order.payment_status === 'paid' ? 'default' : 'secondary'}
                      className="mt-1"
                    >
                      {order.payment_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

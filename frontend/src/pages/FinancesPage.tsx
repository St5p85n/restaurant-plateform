import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Banknote, TrendingUp, TrendingDown, Calendar, Download, AlertTriangle } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Order } from '@/types';
import { toast } from 'sonner';
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function FinancesPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>('today');

  const [stats, setStats] = useState({
    revenue: 0,
    ordersCount: 0,
    averageOrder: 0,
    growth: 0,
  });

  useEffect(() => {
    loadRestaurantId();
  }, [profile]);

  useEffect(() => {
    if (restaurantId) {
      loadFinancialData();
    }
  }, [restaurantId, period]);

  const loadRestaurantId = async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    try {
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
      toast.error(`Erreur: ${error.message}`);
      setLoading(false);
    }
  };

  const loadFinancialData = async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);

      let startDate: Date;
      let endDate: Date = new Date();

      switch (period) {
        case 'today':
          startDate = startOfDay(new Date());
          endDate = endOfDay(new Date());
          break;
        case 'week':
          startDate = subDays(new Date(), 7);
          break;
        case 'month':
          startDate = startOfMonth(new Date());
          endDate = endOfMonth(new Date());
          break;
        case 'year':
          startDate = new Date(new Date().getFullYear(), 0, 1);
          break;
        default:
          startDate = startOfDay(new Date());
      }

      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      const revenue = ordersData?.reduce((sum, order) => sum + order.total, 0) || 0;
      const ordersCount = ordersData?.length || 0;
      const averageOrder = ordersCount > 0 ? revenue / ordersCount : 0;

      setOrders(ordersData || []);
      setStats({
        revenue,
        ordersCount,
        averageOrder,
        growth: 0,
      });
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!restaurantId) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-warning" />
            <p className="text-lg font-medium mb-2">Restaurant non configuré</p>
            <p className="text-muted-foreground mb-6">
              Vous devez inscrire votre restaurant pour accéder aux finances.
            </p>
            <Button onClick={() => window.location.href = '/register-restaurant'}>
              Inscrire mon restaurant
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light mb-2">Finances</h1>
          <p className="text-muted-foreground">Rapports financiers et statistiques</p>
        </div>
        <div className="flex gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="week">7 derniers jours</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => toast.info('Fonctionnalité d\'export à venir')}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Chiffre d'affaires</p>
              <Banknote className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-3xl font-light mb-2">{stats.revenue.toFixed(2)} FCFA</p>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600">+{stats.growth.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Commandes</p>
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-3xl font-light">{stats.ordersCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Panier moyen</p>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-3xl font-light">{stats.averageOrder.toFixed(2)} FCFA</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-light">Dernières transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="py-12 text-center">
              <Banknote className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune transaction pour cette période</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 10).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">Commande #{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.created_at ? format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: fr }) : ''}
                    </p>
                  </div>
                  <p className="text-lg font-medium">{order.total.toFixed(2)} FCFA</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

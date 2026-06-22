import React, { useEffect, useState } from 'react';
import AdminStatsCard from '@/components/admin/AdminStatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Store, 
  Users, 
  ShoppingCart, 
  DollarSign,
  AlertCircle,
  TrendingUp,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import type { AdminStats, Complaint, Subscription } from '@/types';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [urgentComplaints, setUrgentComplaints] = useState<Complaint[]>([]);
  const [expiringSubscriptions, setExpiringSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Charger les statistiques globales
      const [
        { count: totalRestaurants },
        { count: activeRestaurants },
        { count: suspendedRestaurants },
        { count: totalCustomers },
        { count: totalOrders },
        { data: revenueData },
        { count: pendingComplaints },
        { data: expiringData }
      ] = await Promise.all([
        supabase.from('restaurants').select('*', { count: 'exact', head: true }),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount').eq('status', 'paid'),
        supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('subscriptions')
          .select('*')
          .eq('status', 'active')
          .gte('end_date', new Date().toISOString())
          .lte('end_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
          .limit(5)
      ]);

      const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      setStats({
        total_restaurants: totalRestaurants || 0,
        active_restaurants: activeRestaurants || 0,
        suspended_restaurants: suspendedRestaurants || 0,
        total_customers: totalCustomers || 0,
        total_orders: totalOrders || 0,
        total_revenue: totalRevenue,
        pending_complaints: pendingComplaints || 0,
        expiring_subscriptions: expiringData?.length || 0,
      });

      setExpiringSubscriptions(expiringData || []);

      // Charger les réclamations urgentes
      const { data: complaintsData } = await supabase
        .from('complaints')
        .select('*, restaurant:restaurants(name)')
        .eq('status', 'pending')
        .gte('priority', 3)
        .order('created_at', { ascending: false })
        .limit(5);

      setUrgentComplaints(complaintsData || []);

    } catch (error: any) {
      console.error('Erreur chargement dashboard:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
    <div className="space-y-8">
        {/* Statistiques principales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <AdminStatsCard
            title="Total Restaurants"
            value={stats?.total_restaurants || 0}
            description={`${stats?.active_restaurants || 0} actifs`}
            icon={Store}
          />
          <AdminStatsCard
            title="Clients"
            value={stats?.total_customers || 0}
            description="Utilisateurs inscrits"
            icon={Users}
          />
          <AdminStatsCard
            title="Commandes"
            value={stats?.total_orders || 0}
            description="Total des commandes"
            icon={ShoppingCart}
          />
          <AdminStatsCard
            title="Chiffre d'affaires"
            value={`${(stats?.total_revenue || 0).toLocaleString()} FCFA`}
            description="Revenus totaux"
            icon={DollarSign}
          />
        </div>

        {/* Alertes */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Réclamations urgentes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    Réclamations urgentes
                  </CardTitle>
                  <CardDescription>
                    {stats?.pending_complaints || 0} réclamations en attente
                  </CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/complaints">
                    Voir tout
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {urgentComplaints.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune réclamation urgente
                </p>
              ) : (
                <div className="space-y-3">
                  {urgentComplaints.map((complaint) => (
                    <div 
                      key={complaint.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{complaint.subject}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(complaint as any).restaurant?.name || 'Restaurant inconnu'}
                        </p>
                      </div>
                      <Badge variant="destructive">Urgent</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Abonnements expirant */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-500" />
                    Abonnements expirant
                  </CardTitle>
                  <CardDescription>
                    {stats?.expiring_subscriptions || 0} abonnements expirent dans 30 jours
                  </CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/subscriptions">
                    Voir tout
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {expiringSubscriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun abonnement expirant prochainement
                </p>
              ) : (
                <div className="space-y-3">
                  {expiringSubscriptions.map((subscription) => (
                    <div 
                      key={subscription.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {subscription.plan === 'monthly' ? 'Mensuel' : 
                           subscription.plan === 'annual' ? 'Annuel' : 
                           'Par utilisateur'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Expire le {new Date(subscription.end_date || '').toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {subscription.amount.toLocaleString()} {subscription.currency}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistiques détaillées */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Restaurants actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{stats?.active_restaurants || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    sur {stats?.total_restaurants || 0} restaurants
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Restaurants suspendus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{stats?.suspended_restaurants || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Nécessitent une action
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Réclamations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{stats?.pending_complaints || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    En attente de traitement
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

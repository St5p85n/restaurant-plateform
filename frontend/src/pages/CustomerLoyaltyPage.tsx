import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Award, Gift, TrendingUp, Calendar, DollarSign, Star } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Customer, LoyaltyTransaction, Offer, Order } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function CustomerLoyaltyPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadLoyaltyData();
  }, [user]);

  const loadLoyaltyData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Charger les profils clients
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('profile_id', user.id);

      if (customersError) throw customersError;
      setCustomers(customersData || []);

      // Charger les transactions de fidélité
      if (customersData && customersData.length > 0) {
        const customerIds = customersData.map((c) => c.id);
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('loyalty_transactions')
          .select('*')
          .in('customer_id', customerIds)
          .order('created_at', { ascending: false })
          .limit(20);

        if (transactionsError) throw transactionsError;
        setTransactions(transactionsData || []);
      }

      // Charger les offres disponibles
      const { data: offersData, error: offersError } = await supabase
        .from('offers')
        .select('*, restaurants(name)')
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (offersError) throw offersError;
      setOffers(offersData || []);

      // Charger l'historique des commandes
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, restaurants(name)')
        .eq('customer_id', user.id)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false })
        .limit(10);

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);
    } catch (error: any) {
      toast.error(`Erreur de chargement: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = customers.reduce((sum, c) => sum + c.loyalty_points, 0);
  const totalSpent = customers.reduce((sum, c) => sum + c.total_spent, 0);
  const totalVisits = customers.reduce((sum, c) => sum + c.total_visits, 0);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Veuillez vous connecter pour accéder à votre espace fidélité
            </p>
            <Button asChild>
              <a href="/login">Se connecter</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Mon espace fidélité</h1>
        <p className="text-muted-foreground">
          Consultez vos points, offres et historique
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points de fidélité</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalPoints}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Points disponibles
            </p>
            <Progress value={(totalPoints % 100)} className="mt-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {100 - (totalPoints % 100)} points jusqu'à la prochaine récompense
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total dépensé</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSpent.toFixed(2)} FCFA</div>
            <p className="text-xs text-muted-foreground mt-1">
              Depuis votre inscription
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visites</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalVisits}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Restaurants visités
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="offers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="offers">Offres disponibles</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        {/* Offres disponibles */}
        <TabsContent value="offers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Offres et réductions
              </CardTitle>
              <CardDescription>
                Utilisez vos points pour bénéficier d'offres exclusives
              </CardDescription>
            </CardHeader>
            <CardContent>
              {offers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune offre disponible pour le moment
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {offers.map((offer) => (
                    <Card key={offer.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{offer.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {(offer as any).restaurants?.name}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary">
                            {offer.discount_type === 'percentage'
                              ? `${offer.discount_value}%`
                              : `${offer.discount_value}FCFA`}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {offer.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            {offer.min_points && (
                              <span className="text-muted-foreground">
                                {offer.min_points} points requis
                              </span>
                            )}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            disabled={offer.min_points ? totalPoints < offer.min_points : false}
                            onClick={() => toast.info('Fonctionnalité à venir')}
                          >
                            Utiliser
                          </Button>
                        </div>
                        {offer.valid_until && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Valide jusqu'au{' '}
                            {format(new Date(offer.valid_until), 'PPP', { locale: fr })}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historique des commandes */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Historique des commandes
              </CardTitle>
              <CardDescription>
                Vos dernières visites et commandes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune commande pour le moment
                </p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">
                                {(order as any).restaurants?.name}
                              </span>
                              <Badge variant="outline">{order.order_number}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(order.created_at), 'PPP à HH:mm', { locale: fr })}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{order.total.toFixed(2)} FCFA</div>
                            <Badge variant="secondary" className="mt-1">
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions de fidélité */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Transactions de points
              </CardTitle>
              <CardDescription>
                Historique de vos gains et dépenses de points
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune transaction pour le moment
                </p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(transaction.created_at), 'PPP à HH:mm', {
                            locale: fr,
                          })}
                        </p>
                      </div>
                      <div
                        className={`font-bold ${
                          transaction.points > 0 ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {transaction.points > 0 ? '+' : ''}
                        {transaction.points} pts
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

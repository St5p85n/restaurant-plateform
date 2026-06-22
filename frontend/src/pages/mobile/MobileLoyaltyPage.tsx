import React, { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, TrendingUp, Award } from 'lucide-react';

interface Customer {
  id: string;
  loyalty_points: number;
  total_visits: number;
  total_spent: number;
}

interface LoyaltyTransaction {
  id: string;
  points: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

export default function MobileLoyaltyPage() {
  const { profile } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadLoyaltyData();
    }
  }, [profile]);

  const loadLoyaltyData = async () => {
    try {
      setLoading(true);

      // Charger les données client
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('profile_id', profile?.id)
        .single();

      if (customerError && customerError.code !== 'PGRST116') throw customerError;
      setCustomer(customerData);

      // Charger les transactions
      if (customerData) {
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('loyalty_transactions')
          .select('*')
          .eq('customer_id', customerData.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (transactionsError) throw transactionsError;
        setTransactions(transactionsData || []);
      }
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getLevelInfo = (points: number) => {
    if (points < 100) return { level: 'Bronze', next: 100, color: 'text-orange-600' };
    if (points < 500) return { level: 'Argent', next: 500, color: 'text-gray-400' };
    if (points < 1000) return { level: 'Or', next: 1000, color: 'text-yellow-500' };
    return { level: 'Platine', next: null, color: 'text-purple-500' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4">
          <h1 className="text-xl font-semibold mb-4">Programme de Fidélité</h1>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4">🎁</div>
            <h3 className="font-semibold mb-2">Rejoignez notre programme</h3>
            <p className="text-sm text-muted-foreground">
              Passez votre première commande pour commencer à gagner des points
            </p>
          </div>
        </div>
      </div>
    );
  }

  const levelInfo = getLevelInfo(customer.loyalty_points);
  const progress = levelInfo.next
    ? (customer.loyalty_points / levelInfo.next) * 100
    : 100;

  return (
    <div className="min-h-screen bg-background">
      {/* En-tête */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4">
          <h1 className="text-xl font-semibold">Fidélité</h1>
          <p className="text-sm text-muted-foreground">Vos points et récompenses</p>
        </div>
      </div>

      {/* Contenu */}
      <div className="space-y-4 p-4">
        {/* Carte de points */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vos points</p>
                <p className="text-3xl font-bold">{customer.loyalty_points}</p>
              </div>
              <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-background ${levelInfo.color}`}>
                <Award className="h-8 w-8" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className={`font-medium ${levelInfo.color}`}>
                  Niveau {levelInfo.level}
                </span>
                {levelInfo.next && (
                  <span className="text-muted-foreground">
                    {levelInfo.next - customer.loyalty_points} pts pour {levelInfo.level === 'Bronze' ? 'Argent' : levelInfo.level === 'Argent' ? 'Or' : 'Platine'}
                  </span>
                )}
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Visites</p>
                <p className="text-lg font-semibold">{customer.total_visits}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dépensé</p>
                <p className="text-lg font-semibold">
                  {customer.total_spent.toLocaleString()} F
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historique des transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historique</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                Aucune transaction
              </p>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>
                  <Badge
                    variant={transaction.points > 0 ? 'default' : 'secondary'}
                    className="shrink-0"
                  >
                    {transaction.points > 0 ? '+' : ''}
                    {transaction.points} pts
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Comment gagner des points */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comment gagner des points ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <span className="text-lg">🛒</span>
              </div>
              <div>
                <p className="font-medium">Passez des commandes</p>
                <p className="text-muted-foreground">1 point = 100 FCFA dépensés</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <span className="text-lg">🎂</span>
              </div>
              <div>
                <p className="font-medium">Anniversaire</p>
                <p className="text-muted-foreground">50 points bonus</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <span className="text-lg">👥</span>
              </div>
              <div>
                <p className="font-medium">Parrainage</p>
                <p className="text-muted-foreground">100 points par filleul</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Calendar, DollarSign, CreditCard } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import type { SubscriptionWithRestaurant } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithRestaurant[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<SubscriptionWithRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    filterSubscriptions();
  }, [subscriptions, searchQuery, statusFilter, planFilter]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          restaurant:restaurants(
            id,
            name,
            email,
            phone,
            is_active
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSubscriptions(data || []);
    } catch (error: any) {
      console.error('Erreur chargement abonnements:', error);
      toast.error('Erreur lors du chargement des abonnements');
    } finally {
      setLoading(false);
    }
  };

  const filterSubscriptions = () => {
    let filtered = [...subscriptions];

    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.restaurant?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.restaurant?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    if (planFilter !== 'all') {
      filtered = filtered.filter(s => s.plan === planFilter);
    }

    setFilteredSubscriptions(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Actif</Badge>;
      case 'suspended':
        return <Badge variant="secondary">Suspendu</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Annulé</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expiré</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'monthly':
        return 'Mensuel';
      case 'annual':
        return 'Annuel';
      case 'per_user':
        return 'Par utilisateur';
      default:
        return plan;
    }
  };

  return (
    <>
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">Gestion des abonnements</h2>
          <p className="text-muted-foreground">
            {filteredSubscriptions.length} abonnement{filteredSubscriptions.length > 1 ? 's' : ''} trouvé{filteredSubscriptions.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Filtres */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par restaurant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="suspended">Suspendus</SelectItem>
              <SelectItem value="cancelled">Annulés</SelectItem>
              <SelectItem value="expired">Expirés</SelectItem>
            </SelectContent>
          </Select>

          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Formule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les formules</SelectItem>
              <SelectItem value="monthly">Mensuel</SelectItem>
              <SelectItem value="annual">Annuel</SelectItem>
              <SelectItem value="per_user">Par utilisateur</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liste des abonnements */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Aucun abonnement trouvé</p>
            <p className="text-sm text-muted-foreground mt-2">
              Essayez de modifier vos filtres de recherche
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubscriptions.map((subscription) => (
              <Card key={subscription.id} className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {subscription.restaurant?.name || 'Restaurant inconnu'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {subscription.restaurant?.email || 'Email non renseigné'}
                      </p>
                    </div>
                    {getStatusBadge(subscription.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Formule</p>
                        <p className="text-sm text-muted-foreground">{getPlanLabel(subscription.plan)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Montant</p>
                        <p className="text-sm text-muted-foreground">
                          {subscription.amount.toLocaleString()} {subscription.currency}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Début</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(subscription.start_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Expiration</p>
                        <p className="text-sm text-muted-foreground">
                          {subscription.end_date 
                            ? new Date(subscription.end_date).toLocaleDateString('fr-FR')
                            : 'Indéterminée'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <Button variant="outline" size="sm" onClick={() => toast.info('Fonctionnalité à venir')}>
                      Modifier
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast.info('Fonctionnalité à venir')}>
                      Prolonger
                    </Button>
                    {subscription.status === 'active' && (
                      <Button variant="outline" size="sm" onClick={() => toast.info('Fonctionnalité à venir')}>
                        Suspendre
                      </Button>
                    )}
                    {subscription.status === 'suspended' && (
                      <Button variant="outline" size="sm" onClick={() => toast.info('Fonctionnalité à venir')}>
                        Réactiver
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

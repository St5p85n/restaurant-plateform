import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Award, Search, TrendingUp, Users, Star, AlertTriangle } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  loyalty_points: number;
  total_visits: number;
  total_spent: number;
}

export default function CustomerLoyaltyManagementPage() {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRestaurantId();
  }, [profile]);

  useEffect(() => {
    if (restaurantId) {
      loadCustomers();
    }
  }, [restaurantId]);

  useEffect(() => {
    filterCustomers();
  }, [searchQuery, customers]);

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

  const loadCustomers = async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('loyalty_points', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCustomers(filtered);
  };

  const getLoyaltyTier = (points: number) => {
    if (points >= 1000) return { name: 'Platine', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    if (points >= 500) return { name: 'Or', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    if (points >= 200) return { name: 'Argent', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    return { name: 'Bronze', color: 'bg-orange-100 text-orange-800 border-orange-200' };
  };

  if (!restaurantId) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-warning" />
            <p className="text-lg font-medium mb-2">Restaurant non configuré</p>
            <p className="text-muted-foreground mb-6">
              Vous devez inscrire votre restaurant pour gérer la fidélité.
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

  const stats = {
    total: customers.length,
    totalPoints: customers.reduce((sum, c) => sum + c.loyalty_points, 0),
    avgPoints: customers.length > 0 ? customers.reduce((sum, c) => sum + c.loyalty_points, 0) / customers.length : 0,
    topCustomers: customers.slice(0, 3),
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-light mb-2">Clients & Fidélité</h1>
        <p className="text-muted-foreground">Gérez vos clients fidèles et leurs récompenses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Clients fidèles</p>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-3xl font-light">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Points totaux</p>
              <Award className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-3xl font-light">{stats.totalPoints}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Moyenne points</p>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-3xl font-light">{stats.avgPoints.toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun client trouvé</p>
            </CardContent>
          </Card>
        ) : (
          filteredCustomers.map((customer) => {
            const tier = getLoyaltyTier(customer.loyalty_points);
            return (
              <Card key={customer.id}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium mb-2">{customer.name}</h3>
                      <Badge className={tier.color}>{tier.name}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{customer.loyalty_points}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>{customer.email}</p>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span>{customer.total_visits} visites</span>
                      <span>{customer.total_spent?.toFixed(2)} FCFA dépensés</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

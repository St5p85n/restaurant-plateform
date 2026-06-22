import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, UtensilsCrossed, MapPin, Star, Banknote } from 'lucide-react';
import { supabase } from '@/db/supabase';
import type { Restaurant } from '@/types';
import { saveRestaurants, getCachedRestaurants } from '@/lib/offlineStore';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import OfflineBanner from '@/components/ui/OfflineBanner';

// Tranches de budget en FCFA
const PRICE_RANGES = [
  { value: 'all', label: 'Tous les budgets' },
  { value: 'low', label: 'Économique (< 5 000 FCFA)', max: 5000 },
  { value: 'medium', label: 'Modéré (5 000 – 15 000 FCFA)', min: 5000, max: 15000 },
  { value: 'high', label: 'Haut de gamme (> 15 000 FCFA)', min: 15000 },
];

function getPriceLabel(price: number | null) {
  if (!price) return null;
  if (price < 5000) return { label: 'Économique', color: 'bg-green-100 text-green-800' };
  if (price <= 15000) return { label: 'Modéré', color: 'bg-amber-100 text-amber-800' };
  return { label: 'Haut de gamme', color: 'bg-purple-100 text-purple-800' };
}

export default function RestaurantsListPage() {
  const isOnline = useOnlineStatus();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');

  const loadRestaurants = useCallback(async () => {
    try {
      if (isOnline) {
        // En ligne : charger depuis Supabase puis mettre en cache
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('is_active', true)
          .order('name');
        if (error) throw error;
        const list = data || [];
        setRestaurants(list);
        await saveRestaurants(list);
      } else {
        // Hors ligne : charger depuis le cache IndexedDB
        const cached = await getCachedRestaurants();
        setRestaurants(cached);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des restaurants:', error);
      // Fallback cache si erreur réseau
      const cached = await getCachedRestaurants();
      if (cached.length > 0) setRestaurants(cached);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [isOnline]);

  // Resync automatique au retour de la connexion
  const handleSync = useCallback(async () => {
    setSyncing(true);
    await loadRestaurants();
  }, [loadRestaurants]);

  useOfflineSync(handleSync);

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    filterRestaurants();
  }, [searchQuery, cuisineFilter, cityFilter, priceFilter, restaurants]);

  const filterRestaurants = () => {
    let filtered = [...restaurants];

    // Recherche textuelle : nom, description, adresse, ville, quartier
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.address?.toLowerCase().includes(q) ||
          r.city?.toLowerCase().includes(q) ||
          r.cuisine_type?.toLowerCase().includes(q)
      );
    }

    // Filtre type de cuisine
    if (cuisineFilter !== 'all') {
      filtered = filtered.filter((r) => r.cuisine_type === cuisineFilter);
    }

    // Filtre localisation (ville)
    if (cityFilter !== 'all') {
      filtered = filtered.filter(
        (r) => r.city?.toLowerCase() === cityFilter.toLowerCase()
      );
    }

    // Filtre budget / prix moyen
    if (priceFilter !== 'all') {
      const range = PRICE_RANGES.find((p) => p.value === priceFilter);
      if (range) {
        filtered = filtered.filter((r) => {
          // Si pas de prix moyen défini, on inclut dans tous les filtres
          if (!r.average_price) return true;
          if (range.min !== undefined && range.max !== undefined)
            return r.average_price >= range.min && r.average_price <= range.max;
          if (range.max !== undefined) return r.average_price < range.max;
          if (range.min !== undefined) return r.average_price > range.min;
          return true;
        });
      }
    }

    setFilteredRestaurants(filtered);
  };

  const uniqueCuisines = Array.from(
    new Set(restaurants.map((r) => r.cuisine_type).filter(Boolean))
  );

  const uniqueCities = Array.from(
    new Set(restaurants.map((r) => r.city).filter(Boolean))
  ).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Banner hors ligne */}
      <OfflineBanner onSync={handleSync} syncing={syncing} />

      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UtensilsCrossed className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-light">KobeTii</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-light mb-4">Commandez en ligne</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Découvrez nos restaurants partenaires et commandez vos plats préférés
          </p>

          {/* Filtres */}
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Ligne 1 : recherche + cuisine */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, adresse, quartier…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
                <SelectTrigger>
                  <UtensilsCrossed className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Type de cuisine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les cuisines</SelectItem>
                  {uniqueCuisines.map((cuisine) => (
                    <SelectItem key={cuisine} value={cuisine || ''}>
                      {cuisine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ligne 2 : localisation + budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger>
                  <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Localisation (ville)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les villes</SelectItem>
                  {uniqueCities.map((city) => (
                    <SelectItem key={city} value={city || ''}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger>
                  <Banknote className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Budget" />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Liste des restaurants */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-muted-foreground">
            {filteredRestaurants.length} restaurant{filteredRestaurants.length > 1 ? 's' : ''} trouvé{filteredRestaurants.length > 1 ? 's' : ''}
          </p>
          {(cityFilter !== 'all' || priceFilter !== 'all' || cuisineFilter !== 'all' || searchQuery) && (
            <button
              className="text-sm text-primary underline underline-offset-2"
              onClick={() => {
                setSearchQuery('');
                setCuisineFilter('all');
                setCityFilter('all');
                setPriceFilter('all');
              }}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>

        {filteredRestaurants.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun restaurant trouvé</p>
              <p className="text-sm text-muted-foreground mt-1">
                Essayez de modifier vos critères de recherche
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => {
              const priceInfo = getPriceLabel(restaurant.average_price);
              return (
                <Link key={restaurant.id} to={`/restaurant/${restaurant.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-xl font-medium mb-1 truncate">{restaurant.name}</h3>
                            {restaurant.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 text-pretty">
                                {restaurant.description}
                              </p>
                            )}
                          </div>
                          {restaurant.rating > 0 && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              <span className="text-sm font-medium">{Number(restaurant.rating).toFixed(1)}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 text-sm text-muted-foreground">
                          {restaurant.cuisine_type && (
                            <div className="flex items-center gap-2">
                              <UtensilsCrossed className="w-4 h-4 shrink-0" />
                              <span>{restaurant.cuisine_type}</span>
                            </div>
                          )}
                          {(restaurant.city || restaurant.address) && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 shrink-0" />
                              <span className="truncate">
                                {[restaurant.address, restaurant.city].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}
                          {restaurant.average_price && (
                            <div className="flex items-center gap-2">
                              <Banknote className="w-4 h-4 shrink-0" />
                              <span>Moy. {restaurant.average_price.toLocaleString()} FCFA</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-border flex items-center justify-between">
                          <span className="text-primary font-medium text-sm">Voir le menu →</span>
                          {priceInfo && (
                            <Badge className={`text-xs ${priceInfo.color} border-0`}>
                              {priceInfo.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

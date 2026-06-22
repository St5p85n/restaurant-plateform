import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Star, UtensilsCrossed, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/db/supabase';
import type { Restaurant } from '@/types';
import { toast } from 'sonner';

export default function RestaurantsListPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    filterRestaurants();
  }, [restaurants, searchQuery, cuisineFilter, locationFilter, sortBy]);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error: any) {
      toast.error(`Erreur de chargement: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterRestaurants = () => {
    let filtered = [...restaurants];

    // Recherche par nom ou description
    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtre par type de cuisine
    if (cuisineFilter !== 'all') {
      filtered = filtered.filter((r) => r.cuisine_type === cuisineFilter);
    }

    // Filtre par localisation
    if (locationFilter) {
      filtered = filtered.filter((r) =>
        r.address?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Tri
    filtered.sort((a, b) => {
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'reviews') {
        return b.total_reviews - a.total_reviews;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    setFilteredRestaurants(filtered);
  };

  const cuisineTypes = Array.from(
    new Set(restaurants.map((r) => r.cuisine_type).filter(Boolean))
  );

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Tous les restaurants</h1>
        <p className="text-muted-foreground">
          Découvrez {restaurants.length} restaurants partenaires
        </p>
      </div>

      {/* Filtres */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5" />
            Filtres et recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type de cuisine */}
            <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type de cuisine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {cuisineTypes.map((type) => (
                  <SelectItem key={type} value={type || 'all'}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Localisation */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Localisation..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Tri */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Note</SelectItem>
                <SelectItem value="reviews">Nombre d'avis</SelectItem>
                <SelectItem value="name">Nom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Résultats */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredRestaurants.length} restaurant(s) trouvé(s)
            </p>
            {(searchQuery || cuisineFilter !== 'all' || locationFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setCuisineFilter('all');
                  setLocationFilter('');
                }}
              >
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des restaurants */}
      {filteredRestaurants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Aucun restaurant trouvé</p>
            <p className="text-muted-foreground mb-4">
              Essayez de modifier vos critères de recherche
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setCuisineFilter('all');
                setLocationFilter('');
              }}
            >
              Réinitialiser les filtres
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => (
            <Card
              key={restaurant.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-video bg-muted flex items-center justify-center">
                {restaurant.cover_image_url ? (
                  <img
                    src={restaurant.cover_image_url}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UtensilsCrossed className="w-16 h-16 text-muted-foreground" />
                )}
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{restaurant.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">{restaurant.address || 'Non spécifié'}</span>
                    </CardDescription>
                  </div>
                  {restaurant.cuisine_type && (
                    <Badge variant="secondary" className="ml-2">
                      {restaurant.cuisine_type}
                    </Badge>
                  )}
                </div>
                {restaurant.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                    {restaurant.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span className="font-semibold">{restaurant.rating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({restaurant.total_reviews} avis)
                    </span>
                  </div>
                  <Button asChild size="sm">
                    <Link to={`/restaurants/${restaurant.id}`}>Voir le menu</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

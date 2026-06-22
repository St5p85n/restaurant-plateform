import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Search, MapPin } from 'lucide-react';
import RestaurantCard from '@/components/mobile/RestaurantCard';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  cuisine_type: string;
  address: string;
  city: string;
  rating: number;
  total_reviews: number;
  cover_image_url: string;
  is_active: boolean;
  latitude?: number;
  longitude?: number;
}

export default function MobileHomePage() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    loadRestaurants();
    getUserLocation();
  }, []);

  useEffect(() => {
    filterRestaurants();
  }, [searchQuery, restaurants]);

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
        }
      );
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

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
      setFilteredRestaurants(data || []);
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterRestaurants = () => {
    if (!searchQuery.trim()) {
      setFilteredRestaurants(restaurants);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = restaurants.filter(
      (restaurant) =>
        restaurant.name.toLowerCase().includes(query) ||
        restaurant.cuisine_type?.toLowerCase().includes(query) ||
        restaurant.city?.toLowerCase().includes(query)
    );
    setFilteredRestaurants(filtered);
  };

  const handleRestaurantClick = (restaurant: Restaurant) => {
    navigate(`/mobile/restaurant/${restaurant.id}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Chargement des restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* En-tête */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">KobeTii</h1>
              <p className="text-sm text-muted-foreground">Commandez vos plats préférés</p>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>À proximité</span>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un restaurant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Liste des restaurants */}
      <div className="space-y-4 p-4">
        {filteredRestaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="font-semibold mb-2">Aucun restaurant trouvé</h3>
            <p className="text-sm text-muted-foreground">
              Essayez de modifier votre recherche
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                {filteredRestaurants.length} restaurant{filteredRestaurants.length > 1 ? 's' : ''}
              </h2>
            </div>

            <div className="space-y-4">
              {filteredRestaurants.map((restaurant) => {
                const distance =
                  userLocation && restaurant.latitude && restaurant.longitude
                    ? calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        restaurant.latitude,
                        restaurant.longitude
                      )
                    : undefined;

                return (
                  <RestaurantCard
                    key={restaurant.id}
                    {...restaurant}
                    distance={distance}
                    onClick={() => handleRestaurantClick(restaurant)}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

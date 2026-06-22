import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { MapPin, Star, Clock, Phone, Mail, UtensilsCrossed } from 'lucide-react';
import { supabase } from '@/db/supabase';
import type { Restaurant, MenuItem, MenuCategory } from '@/types';
import { toast } from 'sonner';

export default function RestaurantDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurantData();
  }, [id]);

  const loadRestaurantData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Charger le restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);

      // Charger les catégories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', id)
        .eq('is_active', true)
        .order('display_order');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Charger les plats
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', id)
        .eq('is_available', true);

      if (itemsError) throw itemsError;
      setMenuItems(itemsData || []);
    } catch (error: any) {
      toast.error(`Erreur de chargement: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Restaurant non trouvé</p>
            <Button asChild className="mt-4">
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Cover Image */}
      <div className="w-full h-64 md:h-96 bg-muted flex items-center justify-center">
        <UtensilsCrossed className="w-24 h-24 text-muted-foreground" />
      </div>

      <div className="container py-8">
        {/* Restaurant Info */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{restaurant.name}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                {restaurant.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{restaurant.address}</span>
                  </div>
                )}
                {restaurant.cuisine_type && (
                  <Badge variant="secondary">{restaurant.cuisine_type}</Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild size="lg">
                <Link to={`/reservations?restaurant=${restaurant.id}`}>
                  Réserver une table
                </Link>
              </Button>
              <div className="flex items-center gap-2 justify-center">
                <Star className="w-5 h-5 fill-primary text-primary" />
                <span className="font-semibold">{restaurant.rating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">
                  ({restaurant.total_reviews} avis)
                </span>
              </div>
            </div>
          </div>

          {restaurant.description && (
            <p className="text-muted-foreground">{restaurant.description}</p>
          )}

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {restaurant.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{restaurant.phone}</span>
              </div>
            )}
            {restaurant.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{restaurant.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>Voir les horaires</span>
            </div>
          </div>
        </div>

        {/* Menu */}
        <Card>
          <CardHeader>
            <CardTitle>Notre carte</CardTitle>
            <CardDescription>Découvrez nos plats et spécialités</CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                La carte n'est pas encore disponible
              </p>
            ) : (
              <Tabs defaultValue={categories[0]?.id} className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto">
                  {categories.map((category) => (
                    <TabsTrigger key={category.id} value={category.id}>
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {categories.map((category) => (
                  <TabsContent key={category.id} value={category.id} className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {menuItems
                        .filter((item) => item.category_id === category.id)
                        .map((item) => (
                          <Card key={item.id}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-lg">{item.name}</CardTitle>
                                  {item.description && (
                                    <CardDescription className="mt-1">
                                      {item.description}
                                    </CardDescription>
                                  )}
                                  {item.allergens && item.allergens.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {item.allergens.map((allergen, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                          {allergen}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="text-lg font-bold text-primary ml-4">
                                  {item.price.toFixed(2)} FCFA
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                        ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

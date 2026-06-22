import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ArrowLeft, ShoppingCart, Star, MapPin, SlidersHorizontal, X } from 'lucide-react';
import MenuItemCard from '@/components/mobile/MenuItemCard';
import MenuFilters, { DEFAULT_FILTERS, hasActiveFilters, applyMenuFilters } from '@/components/menu/MenuFilters';
import type { MenuFilterState } from '@/components/menu/MenuFilters';

interface Restaurant {
  id: string;
  name: string;
  cuisine_type: string;
  address: string;
  rating: number;
  total_reviews: number;
  cover_image_url: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  allergens: string[];
  category_id: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_halal: boolean;
  is_gluten_free: boolean;
  spice_level: number;
  preparation_time: number | null;
}

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export default function MobileRestaurantPage() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsMap, setReviewsMap] = useState<Record<string, { avg: number; count: number }>>({});
  const [menuFilters, setMenuFilters] = useState<MenuFilterState>({ ...DEFAULT_FILTERS, diet: new Set() });

  useEffect(() => {
    if (restaurantId) {
      loadRestaurantData();
    }
  }, [restaurantId]);

  const loadRestaurantData = async () => {
    try {
      setLoading(true);

      // Charger le restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);

      // Charger les catégories et plats
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select(`
          *,
          items:menu_items(*)
        `)
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('display_order');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Charger les notes moyennes par plat
      const allItemIds: string[] = (categoriesData ?? []).flatMap(
        (cat: any) => (cat.items ?? []).map((i: any) => i.id)
      );
      if (allItemIds.length > 0) {
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('menu_item_id, rating')
          .in('menu_item_id', allItemIds);
        const map: Record<string, { avg: number; count: number }> = {};
        (reviewsData ?? []).forEach((r: any) => {
          if (!map[r.menu_item_id]) map[r.menu_item_id] = { avg: 0, count: 0 };
          map[r.menu_item_id].count += 1;
          map[r.menu_item_id].avg   += r.rating;
        });
        Object.keys(map).forEach((k) => { map[k].avg = map[k].avg / map[k].count; });
        setReviewsMap(map);
      }
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (menuItem: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.menuItem.id === menuItemId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.menuItem.id === menuItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter((item) => item.menuItem.id !== menuItemId);
    });
  };

  const getCartQuantity = (menuItemId: string) => {
    return cart.find((item) => item.menuItem.id === menuItemId)?.quantity || 0;
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleViewCart = () => {
    navigate(`/mobile/cart/${restaurantId}`, { state: { cart, restaurant } });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Chargement du menu...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Restaurant introuvable</p>
          <Button onClick={() => navigate('/mobile')} className="mt-4">
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* En-tête avec image */}
      <div className="relative">
        <div className="h-48 w-full overflow-hidden bg-muted">
          {restaurant.cover_image_url ? (
            <img
              src={restaurant.cover_image_url}
              alt={restaurant.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl">
              🍽️
            </div>
          )}
        </div>

        {/* Bouton retour */}
        <button
          onClick={() => navigate('/mobile')}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Informations restaurant */}
      <div className="space-y-3 border-b border-border p-4">
        <div>
          <h1 className="text-xl font-semibold">{restaurant.name}</h1>
          <p className="text-sm text-muted-foreground">{restaurant.cuisine_type}</p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{restaurant.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">
              ({restaurant.total_reviews})
            </span>
          </div>
          <Badge variant="secondary">30-45 min</Badge>
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{restaurant.address}</span>
        </div>
      </div>

      {/* Menu par catégories */}
      <div className="space-y-6 p-4">
        {/* ── Barre filtres ── */}
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filtres
                {hasActiveFilters(menuFilters) && (
                  <Badge variant="secondary" className="ml-0.5 h-4 rounded-full px-1 text-[10px]">
                    {[
                      menuFilters.priceMin !== '' || menuFilters.priceMax !== '',
                      menuFilters.minRating > 0,
                      menuFilters.diet.size > 0,
                      menuFilters.spiceLevel !== null,
                      menuFilters.maxPrepTime !== null,
                    ].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-xl">
              <SheetHeader className="mb-6">
                <SheetTitle>Filtres</SheetTitle>
              </SheetHeader>
              <MenuFilters
                filters={menuFilters}
                onChange={setMenuFilters}
                compact
              />
            </SheetContent>
          </Sheet>

          {/* Chips résumé */}
          {menuFilters.priceMax !== '' && (
            <Badge variant="outline" className="gap-1 text-xs font-normal">
              ≤ {menuFilters.priceMax} FCFA
              <button onClick={() => setMenuFilters((f) => ({ ...f, priceMax: '' }))}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {menuFilters.minRating > 0 && (
            <Badge variant="outline" className="gap-1 text-xs font-normal">
              {menuFilters.minRating}★ et +
              <button onClick={() => setMenuFilters((f) => ({ ...f, minRating: 0 }))}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {hasActiveFilters(menuFilters) && (
            <button
              onClick={() => setMenuFilters({ ...DEFAULT_FILTERS, diet: new Set() })}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Effacer
            </button>
          )}
        </div>

        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="font-semibold mb-2">Menu non disponible</h3>
            <p className="text-sm text-muted-foreground">
              Ce restaurant n'a pas encore de menu
            </p>
          </div>
        ) : (
          categories.map((category) => {
            const visibleItems = applyMenuFilters(
              (category.items ?? []).filter((i) => i.is_available),
              menuFilters,
              reviewsMap,
              (item) => item.id,
            );
            if (visibleItems.length === 0) return null;
            return (
              <div key={category.id} className="space-y-3">
                <h2 className="font-semibold text-lg">{category.name}</h2>
                <div className="space-y-3">
                  {visibleItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      {...item}
                      quantity={getCartQuantity(item.id)}
                      avgRating={reviewsMap[item.id]?.avg}
                      reviewCount={reviewsMap[item.id]?.count}
                      onAdd={() => addToCart(item)}
                      onRemove={() => removeFromCart(item.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}

        {/* Message aucun résultat après filtrage */}
        {hasActiveFilters(menuFilters) &&
          categories.every(
            (cat) =>
              applyMenuFilters(
                (cat.items ?? []).filter((i) => i.is_available),
                menuFilters,
                reviewsMap,
                (item) => item.id,
              ).length === 0
          ) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <SlidersHorizontal className="h-8 w-8 mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Aucun plat ne correspond à vos filtres.
              </p>
              <button
                onClick={() => setMenuFilters({ ...DEFAULT_FILTERS, diet: new Set() })}
                className="mt-2 text-xs text-muted-foreground underline underline-offset-2"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )
        }
      </div>

      {/* Panier flottant */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-40 p-4">
          <Button
            size="lg"
            className="w-full shadow-lg"
            onClick={handleViewCart}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            <span className="flex-1">Voir le panier ({cartItemsCount})</span>
            <span className="font-semibold">{cartTotal.toLocaleString()} FCFA</span>
          </Button>
        </div>
      )}
    </div>
  );
}

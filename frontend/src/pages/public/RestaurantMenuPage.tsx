import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { UtensilsCrossed, ShoppingCart, Plus, Minus, Trash2, ArrowLeft, X, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useCart } from '@/contexts/CartContext';
import { LazyImage } from '@/components/ui/lazy-image';
import type { Restaurant, MenuItem, MenuCategory } from '@/types';
import { toast } from 'sonner';
import StarRatingDisplay from '@/components/reviews/StarRatingDisplay';
import MenuFilters, { DEFAULT_FILTERS, hasActiveFilters, applyMenuFilters } from '@/components/menu/MenuFilters';
import type { MenuFilterState } from '@/components/menu/MenuFilters';
import { saveMenu, getCachedMenu, getCachedRestaurantById } from '@/lib/offlineStore';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import OfflineBanner from '@/components/ui/OfflineBanner';

export default function RestaurantMenuPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cart = useCart();
  const isOnline = useOnlineStatus();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [reviewsMap, setReviewsMap] = useState<Record<string, { avg: number; count: number }>>({});
  const [showCart, setShowCart] = useState(false);
  const [addItemDialog, setAddItemDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  const [menuFilters, setMenuFilters] = useState<MenuFilterState>({ ...DEFAULT_FILTERS, diet: new Set() });

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      if (isOnline) {
        // En ligne : charger depuis Supabase
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (restaurantError) throw restaurantError;
        if (!restaurantData) {
          toast.error('Restaurant non trouvé');
          navigate('/restaurants');
          return;
        }
        setRestaurant(restaurantData);

        const { data: categoriesData, error: categoriesError } = await supabase
          .from('menu_categories')
          .select('*')
          .eq('restaurant_id', id)
          .order('display_order');
        if (categoriesError) throw categoriesError;
        const cats = categoriesData || [];
        setCategories(cats);

        const { data: itemsData, error: itemsError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', id)
          .eq('is_available', true)
          .order('name');
        if (itemsError) throw itemsError;
        const items = itemsData || [];
        setMenuItems(items);

        // Mettre en cache le menu consulté
        await saveMenu(id, cats, items);

        // Notes moyennes
        const ids = items.map((i) => i.id);
        if (ids.length > 0) {
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select('menu_item_id, rating')
            .in('menu_item_id', ids);
          const map: Record<string, { avg: number; count: number }> = {};
          (reviewsData ?? []).forEach((r: any) => {
            if (!map[r.menu_item_id]) map[r.menu_item_id] = { avg: 0, count: 0 };
            map[r.menu_item_id].count += 1;
            map[r.menu_item_id].avg += r.rating;
          });
          Object.keys(map).forEach((k) => {
            map[k].avg = map[k].avg / map[k].count;
          });
          setReviewsMap(map);
        }
      } else {
        // Hors ligne : charger depuis le cache
        const [cachedMenu, cachedRestaurant] = await Promise.all([
          getCachedMenu(id),
          getCachedRestaurantById(id),
        ]);
        if (cachedRestaurant) setRestaurant(cachedRestaurant);
        if (cachedMenu) {
          setCategories(cachedMenu.categories);
          setMenuItems(cachedMenu.items);
        } else if (!cachedRestaurant) {
          toast.error('Ce menu n\'est pas disponible hors ligne');
          navigate('/restaurants');
          return;
        }
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement:', error);
      // Fallback cache si erreur réseau
      const [cachedMenu, cachedRestaurant] = await Promise.all([
        getCachedMenu(id),
        getCachedRestaurantById(id),
      ]);
      if (cachedRestaurant) setRestaurant(cachedRestaurant);
      if (cachedMenu) {
        setCategories(cachedMenu.categories);
        setMenuItems(cachedMenu.items);
        toast.info('Affichage du menu en cache (hors ligne)');
      } else {
        toast.error('Erreur lors du chargement du menu');
      }
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [id, isOnline, navigate]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    await loadData();
  }, [loadData]);

  useOfflineSync(handleSync);

  useEffect(() => {
    if (id) {
      loadData();
      cart.setRestaurant(id);
    }
  }, [id]);

  const filteredItems = applyMenuFilters(
    selectedCategory === 'all'
      ? menuItems
      : menuItems.filter((item) => item.category_id === selectedCategory),
    menuFilters,
    reviewsMap,
    (item) => item.id,
  );

  const openAddItemDialog = (item: MenuItem) => {
    setSelectedItem(item);
    setItemQuantity(1);
    setItemNotes('');
    setAddItemDialog(true);
  };

  const handleAddToCart = () => {
    if (selectedItem) {
      cart.addItem(selectedItem, itemQuantity, itemNotes);
      toast.success(`${selectedItem.name} ajouté au panier`);
      setAddItemDialog(false);
    }
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!restaurant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Banner hors ligne */}
      <OfflineBanner onSync={handleSync} syncing={syncing} />

      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/restaurants">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-medium">{restaurant.name}</h1>
                {restaurant.cuisine_type && (
                  <p className="text-sm text-muted-foreground">{restaurant.cuisine_type}</p>
                )}
              </div>
            </div>

            <Button onClick={() => setShowCart(true)} className="relative">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Panier
              {cart.getItemCount() > 0 && (
                <Badge className="ml-2 bg-primary-foreground text-primary">
                  {cart.getItemCount()}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <div className="container mx-auto px-4 py-8">
        {/* Filtres par catégorie */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
          >
            Tous
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Barre filtres avancés */}
        <div className="mb-8 flex items-center gap-3">
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
            <SheetContent side="right" className="w-[320px] overflow-y-auto">
              <SheetHeader className="mb-6">
                <SheetTitle>Filtres</SheetTitle>
              </SheetHeader>
              <MenuFilters
                filters={menuFilters}
                onChange={setMenuFilters}
              />
            </SheetContent>
          </Sheet>

          {/* Chips résumé filtres actifs */}
          {menuFilters.priceMin !== '' && (
            <Badge variant="outline" className="gap-1 text-xs font-normal">
              ≥ {menuFilters.priceMin} FCFA
              <button onClick={() => setMenuFilters((f) => ({ ...f, priceMin: '' }))}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
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
              Tout effacer
            </button>
          )}
        </div>

        {/* Liste des plats */}
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun plat disponible</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => openAddItemDialog(item)}>
                {item.image_url && (
                  <div className="h-48 w-full overflow-hidden">
                    <LazyImage
                      src={item.image_url}
                      alt={item.name}
                      className="h-48 w-full"
                      placeholderClassName="rounded-t-lg"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 className="font-medium mb-1">{item.name}</h3>
                  {/* Note moyenne */}
                  {(reviewsMap[item.id]?.count ?? 0) > 0 && (
                    <div className="mb-2">
                      <StarRatingDisplay
                        rating={reviewsMap[item.id].avg}
                        count={reviewsMap[item.id].count}
                        size="xs"
                      />
                    </div>
                  )}
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}
                  {/* Badges préférences */}
                  {(item.is_vegetarian || item.is_vegan || item.is_halal || item.is_gluten_free || item.spice_level > 0) && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.is_vegan      && <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">🌱 Végan</Badge>}
                      {item.is_vegetarian && !item.is_vegan && <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">🥦 Végétarien</Badge>}
                      {item.is_halal      && <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">☪️ Halal</Badge>}
                      {item.is_gluten_free&& <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">🌾 Sans gluten</Badge>}
                      {item.spice_level === 1 && <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">🌶 Légèrement épicé</Badge>}
                      {item.spice_level === 2 && <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">🌶🌶 Épicé</Badge>}
                      {item.spice_level === 3 && <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">🌶🌶🌶 Très épicé</Badge>}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">{item.price.toFixed(2)} FCFA</span>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); openAddItemDialog(item); }}>
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog d'ajout au panier */}
      <Dialog open={addItemDialog} onOpenChange={setAddItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedItem?.description && (
              <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Prix: {selectedItem?.price.toFixed(2)} FCFA</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantité</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-lg font-medium w-12 text-center">{itemQuantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setItemQuantity(itemQuantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Instructions spéciales (optionnel)</label>
              <Textarea
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                placeholder="Ex: Sans oignons, bien cuit..."
                rows={3}
              />
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between text-lg font-medium">
                <span>Total:</span>
                <span>{((selectedItem?.price || 0) * itemQuantity).toFixed(2)} FCFA</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddToCart}>
              Ajouter au panier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sidebar Panier */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Votre panier</span>
              <Button variant="ghost" size="icon" onClick={() => setShowCart(false)}>
                <X className="w-5 h-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            {cart.items.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Votre panier est vide</p>
              </div>
            ) : (
              cart.items.map((item) => (
                <div key={item.menuItem.id} className="flex gap-3 pb-4 border-b border-border">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.menuItem.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.menuItem.price.toFixed(2)} FCFA</p>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-1">Note: {item.notes}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => cart.updateQuantity(item.menuItem.id, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => cart.updateQuantity(item.menuItem.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <span className="font-medium">
                      {(item.menuItem.price * item.quantity).toFixed(2)} FCFA
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => cart.removeItem(item.menuItem.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.items.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-lg font-medium">
                <span>Total:</span>
                <span>{cart.getTotal().toFixed(2)} FCFA</span>
              </div>
              <Button className="w-full" onClick={handleCheckout}>
                Commander
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

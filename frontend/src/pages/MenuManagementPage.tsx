import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UtensilsCrossed, Plus, Edit, Trash2, Search, AlertTriangle } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { MenuItem, MenuCategory } from '@/types';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ui/image-upload';
import { LazyImage } from '@/components/ui/lazy-image';

export default function MenuManagementPage() {
  const { profile } = useAuth();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    display_order: 0,
  });

  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: 0,
    category_id: '',
    is_available: true,
    image_url: '',
  });

  useEffect(() => {
    loadRestaurantId();
  }, [profile]);

  useEffect(() => {
    if (restaurantId) {
      loadData();
    }
  }, [restaurantId]);

  useEffect(() => {
    filterItems();
  }, [searchQuery, selectedCategory, menuItems]);

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
      toast.error(`Erreur de chargement: ${error.message}`);
      setLoading(false);
    }
  };

  const loadData = async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('name', { ascending: true });

      if (itemsError) throw itemsError;
      setMenuItems(itemsData || []);
    } catch (error: any) {
      toast.error(`Erreur de chargement: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...menuItems];

    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.category_id === selectedCategory);
    }

    setFilteredItems(filtered);
  };

  const handleSaveCategory = async () => {
    if (!restaurantId) return;

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('menu_categories')
          .update(categoryForm)
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Catégorie mise à jour');
      } else {
        const { error } = await supabase
          .from('menu_categories')
          .insert({
            ...categoryForm,
            restaurant_id: restaurantId,
          });

        if (error) throw error;
        toast.success('Catégorie créée');
      }

      setCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', display_order: 0 });
      loadData();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return;

    try {
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      toast.success('Catégorie supprimée');
      loadData();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const handleSaveItem = async () => {
    if (!restaurantId) return;

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(itemForm)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Article mis à jour');
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert({
            ...itemForm,
            restaurant_id: restaurantId,
          });

        if (error) throw error;
        toast.success('Article créé');
      }

      setItemDialogOpen(false);
      setEditingItem(null);
      setItemForm({
        name: '',
        description: '',
        price: 0,
        category_id: '',
        is_available: true,
        image_url: '',
      });
      loadData();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      toast.success('Article supprimé');
      loadData();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const openEditCategory = (category: MenuCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      display_order: category.display_order || 0,
    });
    setCategoryDialogOpen(true);
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category_id: item.category_id || '',
      is_available: item.is_available,
      image_url: item.image_url || '',
    });
    setItemDialogOpen(true);
  };

  if (!restaurantId) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-warning" />
            <p className="text-lg font-medium mb-2">Restaurant non configuré</p>
            <p className="text-muted-foreground mb-6">
              Vous devez inscrire votre restaurant pour gérer la carte.
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

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-light mb-2">Carte & Menus</h1>
        <p className="text-muted-foreground">Gérez les catégories et articles de votre carte</p>
      </div>

      <Tabs defaultValue="items" className="space-y-6">
        <TabsList>
          <TabsTrigger value="items">Articles</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un article..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setItemDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvel article
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Aucun article trouvé</p>
                </CardContent>
              </Card>
            ) : (
              filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden h-full flex flex-col">
                  <div className="h-48 w-full overflow-hidden bg-muted/30 flex items-center justify-center shrink-0">
                    {item.image_url ? (
                      <LazyImage
                        src={item.image_url}
                        alt={item.name}
                        className="h-48 w-full"
                        placeholderClassName="rounded-t-lg"
                      />
                    ) : (
                      <UtensilsCrossed className="w-10 h-10 text-muted-foreground/40" />
                    )}
                  </div>
                  <CardContent className="pt-4 space-y-3 flex-1 flex flex-col">
                    <div className="flex items-start justify-between flex-1">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium mb-1 truncate">{item.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 text-pretty">
                          {item.description}
                        </p>
                      </div>
                      {!item.is_available && (
                        <Badge variant="outline" className="ml-2 shrink-0">
                          Indisponible
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-base font-medium">{item.price.toFixed(2)} FCFA</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditItem(item)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setCategoryDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle catégorie
            </Button>
          </div>

          <div className="space-y-4">
            {categories.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Aucune catégorie créée</p>
                </CardContent>
              </Card>
            ) : (
              categories.map((category) => (
                <Card key={category.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium mb-1">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {menuItems.filter((i) => i.category_id === category.id).length} articles
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditCategory(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nom *</Label>
              <Input
                id="cat-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Ex: Entrées"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Description de la catégorie..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-order">Ordre d'affichage</Label>
              <Input
                id="cat-order"
                type="number"
                value={categoryForm.display_order}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, display_order: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveCategory}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Modifier l\'article' : 'Nouvel article'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">Nom *</Label>
                <Input
                  id="item-name"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="Ex: Salade César"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-price">Prix (FCFA) *</Label>
                <Input
                  id="item-price"
                  type="number"
                  step="0.01"
                  value={itemForm.price}
                  onChange={(e) => setItemForm({ ...itemForm, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-category">Catégorie *</Label>
              <Select value={itemForm.category_id || ''} onValueChange={(value) => setItemForm({ ...itemForm, category_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-desc">Description</Label>
              <Textarea
                id="item-desc"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Description de l'article..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Image du plat</Label>
              <ImageUpload
                currentImageUrl={itemForm.image_url}
                onImageUploaded={(url) => setItemForm({ ...itemForm, image_url: url })}
                onImageRemoved={() => setItemForm({ ...itemForm, image_url: '' })}
                restaurantId={restaurantId || ''}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="item-available"
                checked={itemForm.is_available}
                onChange={(e) => setItemForm({ ...itemForm, is_available: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="item-available">Disponible</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveItem}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

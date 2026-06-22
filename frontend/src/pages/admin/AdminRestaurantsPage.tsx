import React, { useEffect, useState } from 'react';
import RestaurantCard from '@/components/admin/RestaurantCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, Plus } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import type { RestaurantWithStats } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<RestaurantWithStats[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<RestaurantWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cuisineFilter, setCuisineFilter] = useState<string>('all');

  // Dialog de modification
  const [editDialog, setEditDialog] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    description: '',
    cuisine_type: '',
    is_active: true,
  });

  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'suspend' | 'activate' | 'deactivate' | null;
    restaurantId: string | null;
    restaurantName: string;
  }>({
    open: false,
    type: null,
    restaurantId: null,
    restaurantName: '',
  });

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    filterRestaurants();
  }, [restaurants, searchQuery, statusFilter, cuisineFilter]);

  const loadRestaurants = async () => {
    try {
      setLoading(true);

      // Charger les restaurants avec leurs abonnements et propriétaires
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          subscription:subscriptions!subscriptions_restaurant_id_fkey(
            id,
            plan,
            status,
            start_date,
            end_date,
            amount,
            currency
          ),
          owner:profiles!restaurants_owner_id_fkey(
            id,
            full_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Charger les statistiques pour chaque restaurant
      const restaurantsWithStats = await Promise.all(
        (data || []).map(async (restaurant) => {
          const [
            { count: totalOrders },
            { data: revenueData },
            { count: totalComplaints }
          ] = await Promise.all([
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurant.id),
            supabase.from('orders').select('total_amount').eq('restaurant_id', restaurant.id).eq('status', 'paid'),
            supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurant.id)
          ]);

          const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

          return {
            ...restaurant,
            stats: {
              total_orders: totalOrders || 0,
              total_revenue: totalRevenue,
              average_rating: restaurant.rating || 0,
              total_complaints: totalComplaints || 0,
              active_users: 0, // TODO: calculer le nombre d'utilisateurs actifs
            },
          };
        })
      );

      setRestaurants(restaurantsWithStats);
    } catch (error: any) {
      console.error('Erreur chargement restaurants:', error);
      toast.error('Erreur lors du chargement des restaurants');
    } finally {
      setLoading(false);
    }
  };

  const filterRestaurants = () => {
    let filtered = [...restaurants];

    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(r => r.is_active && r.subscription?.status === 'active');
      } else if (statusFilter === 'suspended') {
        filtered = filtered.filter(r => r.subscription?.status === 'suspended');
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(r => !r.is_active);
      }
    }

    // Filtre par type de cuisine
    if (cuisineFilter !== 'all') {
      filtered = filtered.filter(r => r.cuisine_type === cuisineFilter);
    }

    setFilteredRestaurants(filtered);
  };

  const handleEdit = (id: string) => {
    const r = restaurants.find((r) => r.id === id);
    if (!r) return;
    setEditForm({
      id: r.id,
      name: r.name,
      address: r.address || '',
      city: r.city || '',
      phone: r.phone || '',
      email: r.email || '',
      description: r.description || '',
      cuisine_type: r.cuisine_type || '',
      is_active: r.is_active,
    });
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    setEditLoading(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          name: editForm.name,
          address: editForm.address || null,
          city: editForm.city || null,
          phone: editForm.phone || null,
          email: editForm.email || null,
          description: editForm.description || null,
          cuisine_type: editForm.cuisine_type || null,
          is_active: editForm.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editForm.id);
      if (error) throw error;
      toast.success('Restaurant modifié avec succès');
      setEditDialog(false);
      await loadRestaurants();
    } catch (e: any) {
      toast.error(`Erreur : ${e.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  const setEdit = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setEditForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSuspend = (id: string) => {
    const restaurant = restaurants.find(r => r.id === id);
    setActionDialog({
      open: true,
      type: 'suspend',
      restaurantId: id,
      restaurantName: restaurant?.name || '',
    });
  };

  const handleActivate = (id: string) => {
    const restaurant = restaurants.find(r => r.id === id);
    setActionDialog({
      open: true,
      type: 'activate',
      restaurantId: id,
      restaurantName: restaurant?.name || '',
    });
  };

  const handleDeactivate = (id: string) => {
    const restaurant = restaurants.find(r => r.id === id);
    setActionDialog({
      open: true,
      type: 'deactivate',
      restaurantId: id,
      restaurantName: restaurant?.name || '',
    });
  };

  const confirmAction = async () => {
    if (!actionDialog.restaurantId || !actionDialog.type) return;

    try {
      if (actionDialog.type === 'suspend') {
        // Suspendre l'abonnement
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'suspended' })
          .eq('restaurant_id', actionDialog.restaurantId);

        if (error) throw error;
        toast.success('Restaurant suspendu avec succès');
      } else if (actionDialog.type === 'activate') {
        // Réactiver l'abonnement
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('restaurant_id', actionDialog.restaurantId);

        if (error) throw error;
        toast.success('Restaurant réactivé avec succès');
      } else if (actionDialog.type === 'deactivate') {
        // Désactiver le restaurant
        const { error } = await supabase
          .from('restaurants')
          .update({ is_active: false })
          .eq('id', actionDialog.restaurantId);

        if (error) throw error;
        toast.success('Restaurant désactivé avec succès');
      }

      // Recharger les restaurants
      await loadRestaurants();
    } catch (error: any) {
      console.error('Erreur action restaurant:', error);
      toast.error('Erreur lors de l\'action sur le restaurant');
    } finally {
      setActionDialog({ open: false, type: null, restaurantId: null, restaurantName: '' });
    }
  };

  const cuisineTypes = Array.from(new Set(restaurants.map(r => r.cuisine_type).filter(Boolean)));

  return (
    <>
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gestion des restaurants</h2>
            <p className="text-muted-foreground">
              {filteredRestaurants.length} restaurant{filteredRestaurants.length > 1 ? 's' : ''} trouvé{filteredRestaurants.length > 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => toast.info('Fonctionnalité à venir')}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un restaurant
          </Button>
        </div>

        {/* Filtres */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, adresse, email..."
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
              <SelectItem value="inactive">Inactifs</SelectItem>
            </SelectContent>
          </Select>

          <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Type de cuisine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {cuisineTypes.map((type) => (
                <SelectItem key={type} value={type || ''}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Liste des restaurants */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3 rounded-lg border border-border p-6">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Aucun restaurant trouvé</p>
            <p className="text-sm text-muted-foreground mt-2">
              Essayez de modifier vos filtres de recherche
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onSuspend={handleSuspend}
                onActivate={handleActivate}
                onDeactivate={handleDeactivate}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialog de modification */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le restaurant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Nom *</Label>
                <Input id="edit-name" value={editForm.name} onChange={setEdit('name')} placeholder="Nom du restaurant" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-cuisine">Type de cuisine</Label>
                <Input id="edit-cuisine" value={editForm.cuisine_type} onChange={setEdit('cuisine_type')} placeholder="Ex : Africain, Français…" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-address">Adresse</Label>
              <Input id="edit-address" value={editForm.address} onChange={setEdit('address')} placeholder="Adresse complète" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-city">Ville</Label>
                <Input id="edit-city" value={editForm.city} onChange={setEdit('city')} placeholder="Ville" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-phone">Téléphone</Label>
                <Input id="edit-phone" value={editForm.phone} onChange={setEdit('phone')} placeholder="+221 …" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={editForm.email} onChange={setEdit('email')} placeholder="contact@restaurant.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea id="edit-desc" value={editForm.description} onChange={setEdit('description')} rows={3} placeholder="Description du restaurant…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-status">Statut</Label>
              <Select
                value={editForm.is_active ? 'active' : 'inactive'}
                onValueChange={(v) => setEditForm((prev) => ({ ...prev, is_active: v === 'active' }))}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setEditDialog(false)} disabled={editLoading}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={editLoading || !editForm.name.trim()}>
              {editLoading ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation */}
      <AlertDialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.type === 'suspend' && 'Suspendre le restaurant'}
              {actionDialog.type === 'activate' && 'Réactiver le restaurant'}
              {actionDialog.type === 'deactivate' && 'Désactiver le restaurant'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog.type === 'suspend' &&
                `Êtes-vous sûr de vouloir suspendre "${actionDialog.restaurantName}" ? Le restaurant ne pourra plus accepter de commandes.`
              }
              {actionDialog.type === 'activate' &&
                `Êtes-vous sûr de vouloir réactiver "${actionDialog.restaurantName}" ? Le restaurant pourra à nouveau accepter des commandes.`
              }
              {actionDialog.type === 'deactivate' &&
                `Êtes-vous sûr de vouloir désactiver définitivement "${actionDialog.restaurantName}" ? Cette action est irréversible.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

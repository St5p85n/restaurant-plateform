import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Banknote,
  ShoppingCart,
  Star,
  Users,
  MessageSquare,
  Pause,
  Play,
  Ban,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import type { RestaurantWithStats, Subscription, Complaint } from '@/types';
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

export default function AdminRestaurantDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<RestaurantWithStats | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'suspend' | 'activate' | 'deactivate' | 'reduce_visibility' | 'restore_visibility' | null;
  }>({
    open: false,
    type: null,
  });

  useEffect(() => {
    if (id) {
      loadRestaurantDetails();
    }
  }, [id]);

  const loadRestaurantDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Charger le restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select(`
          *,
          owner:profiles!restaurants_owner_id_fkey(
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('id', id)
        .single();

      if (restaurantError) throw restaurantError;

      // Charger les statistiques
      const [
        { count: totalOrders },
        { data: revenueData },
        { count: totalComplaints },
        { count: activeUsers }
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('restaurant_id', id),
        supabase.from('orders').select('total_amount').eq('restaurant_id', id).eq('status', 'paid'),
        supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('restaurant_id', id),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('restaurant_id', id)
      ]);

      const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      setRestaurant({
        ...restaurantData,
        stats: {
          total_orders: totalOrders || 0,
          total_revenue: totalRevenue,
          average_rating: restaurantData.rating || 0,
          total_complaints: totalComplaints || 0,
          active_users: activeUsers || 0,
        },
      });

      // Charger l'historique des abonnements
      const { data: subscriptionsData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('restaurant_id', id)
        .order('created_at', { ascending: false });

      setSubscriptions(subscriptionsData || []);

      // Charger l'historique des réclamations
      const { data: complaintsData } = await supabase
        .from('complaints')
        .select('*')
        .eq('restaurant_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      setComplaints(complaintsData || []);

    } catch (error: any) {
      console.error('Erreur chargement détails restaurant:', error);
      toast.error('Erreur lors du chargement des détails');
      navigate('/admin/restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (type: typeof actionDialog.type) => {
    setActionDialog({ open: true, type });
  };

  const confirmAction = async () => {
    if (!id || !actionDialog.type) return;

    try {
      if (actionDialog.type === 'suspend') {
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'suspended' })
          .eq('restaurant_id', id);
        if (error) throw error;
        toast.success('Restaurant suspendu');
      } else if (actionDialog.type === 'activate') {
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('restaurant_id', id);
        if (error) throw error;
        toast.success('Restaurant réactivé');
      } else if (actionDialog.type === 'deactivate') {
        const { error } = await supabase
          .from('restaurants')
          .update({ is_active: false })
          .eq('id', id);
        if (error) throw error;
        toast.success('Restaurant désactivé');
      } else if (actionDialog.type === 'reduce_visibility') {
        const { error } = await supabase
          .from('restaurants')
          .update({ visibility_score: 50 })
          .eq('id', id);
        if (error) throw error;
        toast.success('Visibilité réduite');
      } else if (actionDialog.type === 'restore_visibility') {
        const { error } = await supabase
          .from('restaurants')
          .update({ visibility_score: 100 })
          .eq('id', id);
        if (error) throw error;
        toast.success('Visibilité restaurée');
      }

      await loadRestaurantDetails();
    } catch (error: any) {
      console.error('Erreur action:', error);
      toast.error('Erreur lors de l\'action');
    } finally {
      setActionDialog({ open: false, type: null });
    }
  };

  if (loading) {
    return (
      <>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </>
    );
  }

  if (!restaurant) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-lg font-medium">Restaurant non trouvé</p>
          <Button asChild className="mt-4">
            <Link to="/admin/restaurants">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Link>
          </Button>
        </div>
      </>
    );
  }

  const currentSubscription = subscriptions.find(s => s.status === 'active' || s.status === 'suspended');

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/restaurants')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold">{restaurant.name}</h2>
              <p className="text-muted-foreground">{restaurant.cuisine_type || 'Non spécifié'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {restaurant.is_active && currentSubscription?.status === 'active' && (
              <div className="space-y-6">
                <Button variant="outline" onClick={() => handleAction('suspend')}>
                  <Pause className="h-4 w-4 mr-2" />
                  Suspendre
                </Button>
                {restaurant.visibility_score === 100 ? (
                  <Button variant="outline" onClick={() => handleAction('reduce_visibility')}>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Réduire visibilité
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => handleAction('restore_visibility')}>
                    <Eye className="h-4 w-4 mr-2" />
                    Restaurer visibilité
                  </Button>
                )}
                </div>
            )}
            {currentSubscription?.status === 'suspended' && (
              <Button variant="outline" onClick={() => handleAction('activate')}>
                <Play className="h-4 w-4 mr-2" />
                Réactiver
              </Button>
            )}
            {restaurant.is_active && (
              <Button variant="destructive" onClick={() => handleAction('deactivate')}>
                <Ban className="h-4 w-4 mr-2" />
                Désactiver
              </Button>
            )}
          </div>
        </div>

        {/* Informations principales */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Adresse</p>
                  <p className="text-sm text-muted-foreground">{restaurant.address || 'Non renseignée'}</p>
                  {restaurant.city && <p className="text-sm text-muted-foreground">{restaurant.city}</p>}
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Téléphone</p>
                  <p className="text-sm text-muted-foreground">{restaurant.phone || 'Non renseigné'}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{restaurant.email || 'Non renseigné'}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Date d'inscription</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(restaurant.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Propriétaire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Nom complet</p>
                <p className="text-sm text-muted-foreground">{restaurant.owner?.full_name || 'Non renseigné'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{restaurant.owner?.email || 'Non renseigné'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">Téléphone</p>
                <p className="text-sm text-muted-foreground">{restaurant.owner?.phone || 'Non renseigné'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Commandes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <p className="text-2xl font-bold">{restaurant.stats?.total_orders || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Chiffre d'affaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <p className="text-2xl font-bold">{(restaurant.stats?.total_revenue || 0).toLocaleString()} FCFA</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Note moyenne</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <p className="text-2xl font-bold">{(restaurant.stats?.average_rating || 0).toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Utilisateurs actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-2xl font-bold">{restaurant.stats?.active_users || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Abonnement actuel */}
        {currentSubscription && (
          <Card>
            <CardHeader>
              <CardTitle>Abonnement actuel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Formule</p>
                  <p className="text-lg font-semibold capitalize">
                    {currentSubscription.plan === 'monthly' ? 'Mensuel' :
                     currentSubscription.plan === 'annual' ? 'Annuel' :
                     'Par utilisateur'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Statut</p>
                  <Badge variant={currentSubscription.status === 'active' ? 'default' : 'secondary'}>
                    {currentSubscription.status === 'active' ? 'Actif' : 'Suspendu'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Montant</p>
                  <p className="text-lg font-semibold">
                    {currentSubscription.amount.toLocaleString()} FCFA
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date d'expiration</p>
                  <p className="text-lg font-semibold">
                    {currentSubscription.end_date 
                      ? new Date(currentSubscription.end_date).toLocaleDateString('fr-FR')
                      : 'Indéterminée'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Réclamations récentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Réclamations récentes</CardTitle>
                <CardDescription>{restaurant.stats?.total_complaints || 0} réclamations au total</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/complaints">
                  Voir toutes
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {complaints.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune réclamation
              </p>
            ) : (
              <div className="space-y-3">
                {complaints.map((complaint) => (
                  <div 
                    key={complaint.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium truncate">{complaint.subject}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(complaint.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <Badge variant={
                      complaint.status === 'resolved' ? 'default' :
                      complaint.status === 'in_review' ? 'secondary' :
                      'outline'
                    }>
                      {complaint.status === 'pending' ? 'En attente' :
                       complaint.status === 'in_review' ? 'En cours' :
                       complaint.status === 'resolved' ? 'Résolu' :
                       'Fermé'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmation */}
      <AlertDialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.type === 'suspend' && 'Suspendre le restaurant'}
              {actionDialog.type === 'activate' && 'Réactiver le restaurant'}
              {actionDialog.type === 'deactivate' && 'Désactiver le restaurant'}
              {actionDialog.type === 'reduce_visibility' && 'Réduire la visibilité'}
              {actionDialog.type === 'restore_visibility' && 'Restaurer la visibilité'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog.type === 'suspend' && 
                'Le restaurant ne pourra plus accepter de commandes. Voulez-vous continuer ?'
              }
              {actionDialog.type === 'activate' && 
                'Le restaurant pourra à nouveau accepter des commandes. Voulez-vous continuer ?'
              }
              {actionDialog.type === 'deactivate' && 
                'Cette action est irréversible. Le restaurant sera définitivement désactivé. Voulez-vous continuer ?'
              }
              {actionDialog.type === 'reduce_visibility' && 
                'Le restaurant sera moins visible sur la plateforme. Voulez-vous continuer ?'
              }
              {actionDialog.type === 'restore_visibility' && 
                'Le restaurant retrouvera sa visibilité normale. Voulez-vous continuer ?'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

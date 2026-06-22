import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Truck, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Mail, 
  Phone, 
  MapPin,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  Ban
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile, DeliveryPersonnel, VehicleType, DeliveryPersonnelStatus } from '@/types';
import { toast } from 'sonner';

export default function UserManagementPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('staff');
  
  // États pour le personnel restaurant
  const [staff, setStaff] = useState<Profile[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Profile[]>([]);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Profile | null>(null);
  
  // États pour les livreurs
  const [deliveryPersonnel, setDeliveryPersonnel] = useState<DeliveryPersonnel[]>([]);
  const [filteredDelivery, setFilteredDelivery] = useState<DeliveryPersonnel[]>([]);
  const [deliverySearchQuery, setDeliverySearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryPersonnel | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  // Formulaire personnel restaurant
  const [staffForm, setStaffForm] = useState({
    email: '',
    full_name: '',
    role: 'server',
    phone: '',
  });

  // Formulaire livreurs
  const [deliveryForm, setDeliveryForm] = useState({
    full_name: '',
    phone: '',
    vehicle_type: '' as VehicleType | '',
    vehicle_number: '',
    status: 'available' as DeliveryPersonnelStatus,
  });

  useEffect(() => {
    loadRestaurantId();
  }, [profile]);

  useEffect(() => {
    if (restaurantId) {
      loadStaff();
      loadDeliveryPersonnel();
    }
  }, [restaurantId]);

  useEffect(() => {
    filterStaff();
  }, [staffSearchQuery, roleFilter, staff]);

  useEffect(() => {
    filterDelivery();
  }, [deliverySearchQuery, statusFilter, deliveryPersonnel]);

  const loadRestaurantId = async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    if (profile.restaurant_id) {
      setRestaurantId(profile.restaurant_id);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', profile.id)
        .single();

      if (error) throw error;
      setRestaurantId(data.id);
    } catch (error) {
      console.error('Erreur lors du chargement du restaurant:', error);
      toast.error('Erreur lors du chargement du restaurant');
    } finally {
      setLoading(false);
    }
  };

  // ============ GESTION DU PERSONNEL RESTAURANT ============

  const loadStaff = async () => {
    if (!restaurantId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('full_name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement du personnel:', error);
      toast.error('Erreur lors du chargement du personnel');
    }
  };

  const filterStaff = () => {
    let filtered = staff;

    if (staffSearchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.full_name?.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
          s.email?.toLowerCase().includes(staffSearchQuery.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((s) => s.role === roleFilter);
    }

    setFilteredStaff(filtered);
  };

  const handleAddStaff = () => {
    setEditingStaff(null);
    setStaffForm({
      email: '',
      full_name: '',
      role: 'server',
      phone: '',
    });
    setStaffDialogOpen(true);
  };

  const handleEditStaff = (staffMember: Profile) => {
    setEditingStaff(staffMember);
    setStaffForm({
      email: staffMember.email || '',
      full_name: staffMember.full_name || '',
      role: staffMember.role || 'server',
      phone: staffMember.phone || '',
    });
    setStaffDialogOpen(true);
  };

  const handleSaveStaff = async () => {
    if (!staffForm.email || !staffForm.full_name) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      if (editingStaff) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: staffForm.full_name,
            role: staffForm.role,
            phone: staffForm.phone,
          })
          .eq('id', editingStaff.id);

        if (error) throw error;
        toast.success('Personnel modifié avec succès');
      } else {
        toast.info('Fonctionnalité d\'ajout de personnel en cours de développement');
      }

      setStaffDialogOpen(false);
      loadStaff();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre du personnel?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', staffId);

      if (error) throw error;
      toast.success('Personnel supprimé avec succès');
      loadStaff();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(`Erreur: ${error.message}`);
    }
  };

  // ============ GESTION DES LIVREURS ============

  const loadDeliveryPersonnel = async () => {
    if (!restaurantId) return;

    try {
      const { data, error } = await supabase
        .from('delivery_personnel')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('full_name');

      if (error) throw error;
      setDeliveryPersonnel(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des livreurs:', error);
      toast.error('Erreur lors du chargement des livreurs');
    }
  };

  const filterDelivery = () => {
    let filtered = deliveryPersonnel;

    if (deliverySearchQuery) {
      filtered = filtered.filter(
        (d) =>
          d.full_name?.toLowerCase().includes(deliverySearchQuery.toLowerCase()) ||
          d.phone?.toLowerCase().includes(deliverySearchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }

    setFilteredDelivery(filtered);
  };

  const handleAddDelivery = () => {
    setEditingDelivery(null);
    setDeliveryForm({
      full_name: '',
      phone: '',
      vehicle_type: '',
      vehicle_number: '',
      status: 'available',
    });
    setDeliveryDialogOpen(true);
  };

  const handleEditDelivery = (person: DeliveryPersonnel) => {
    setEditingDelivery(person);
    setDeliveryForm({
      full_name: person.full_name,
      phone: person.phone || '',
      vehicle_type: person.vehicle_type || '',
      vehicle_number: person.vehicle_number || '',
      status: person.status,
    });
    setDeliveryDialogOpen(true);
  };

  const handleSaveDelivery = async () => {
    if (!deliveryForm.full_name || !deliveryForm.phone || !deliveryForm.vehicle_type) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!restaurantId) {
      toast.error('Restaurant non trouvé');
      return;
    }

    try {
      if (editingDelivery) {
        const { error } = await supabase
          .from('delivery_personnel')
          .update({
            full_name: deliveryForm.full_name,
            phone: deliveryForm.phone,
            vehicle_type: deliveryForm.vehicle_type,
            vehicle_number: deliveryForm.vehicle_number,
            status: deliveryForm.status,
          })
          .eq('id', editingDelivery.id);

        if (error) throw error;
        toast.success('Livreur modifié avec succès');
      } else {
        const { error } = await supabase
          .from('delivery_personnel')
          .insert({
            restaurant_id: restaurantId,
            full_name: deliveryForm.full_name,
            phone: deliveryForm.phone,
            vehicle_type: deliveryForm.vehicle_type,
            vehicle_number: deliveryForm.vehicle_number,
            status: deliveryForm.status,
          });

        if (error) throw error;
        toast.success('Livreur ajouté avec succès');
      }

      setDeliveryDialogOpen(false);
      loadDeliveryPersonnel();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const handleDeleteDelivery = async (deliveryId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce livreur?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('delivery_personnel')
        .delete()
        .eq('id', deliveryId);

      if (error) throw error;
      toast.success('Livreur supprimé avec succès');
      loadDeliveryPersonnel();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(`Erreur: ${error.message}`);
    }
  };

  // ============ HELPERS ============

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      owner: { label: 'Propriétaire', variant: 'default' },
      manager: { label: 'Gérant', variant: 'default' },
      chef: { label: 'Chef', variant: 'secondary' },
      server: { label: 'Serveur', variant: 'outline' },
      accountant: { label: 'Comptable', variant: 'secondary' },
    };

    const config = roleConfig[role] || { label: role, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: DeliveryPersonnelStatus) => {
    const statusConfig: Record<DeliveryPersonnelStatus, { label: string; icon: any; className: string }> = {
      available: { label: 'Disponible', icon: CheckCircle, className: 'bg-green-500/10 text-green-700 dark:text-green-400' },
      busy: { label: 'Occupé', icon: Clock, className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
      offline: { label: 'Hors ligne', icon: Ban, className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getVehicleLabel = (type: VehicleType) => {
    const labels: Record<VehicleType, string> = {
      bike: 'Vélo',
      motorcycle: 'Moto',
      car: 'Voiture',
      scooter: 'Scooter',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Restaurant non trouvé
            </CardTitle>
            <CardDescription>
              Vous devez être associé à un restaurant pour gérer les utilisateurs.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
        <p className="text-muted-foreground mt-2">
          Gérez le personnel du restaurant et les livreurs
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Personnel Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Livreurs Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryPersonnel.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Livreurs Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {deliveryPersonnel.filter((d) => d.status === 'available').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Livreurs Occupés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {deliveryPersonnel.filter((d) => d.status === 'busy').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Personnel Restaurant
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Livreurs
          </TabsTrigger>
        </TabsList>

        {/* Personnel Restaurant Tab */}
        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personnel du Restaurant</CardTitle>
                  <CardDescription>
                    Gérez les employés de votre restaurant
                  </CardDescription>
                </div>
                <Button onClick={handleAddStaff}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtres */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom ou email..."
                    value={staffSearchQuery}
                    onChange={(e) => setStaffSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filtrer par rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="manager">Gérant</SelectItem>
                    <SelectItem value="chef">Chef</SelectItem>
                    <SelectItem value="server">Serveur</SelectItem>
                    <SelectItem value="accountant">Comptable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Liste du personnel */}
              <div className="space-y-3">
                {filteredStaff.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun personnel trouvé
                  </div>
                ) : (
                  filteredStaff.map((staffMember) => (
                    <Card key={staffMember.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{staffMember.full_name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {staffMember.email}
                                </span>
                                {staffMember.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {staffMember.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getRoleBadge(staffMember.role || 'server')}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditStaff(staffMember)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteStaff(staffMember.id)}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Livreurs Tab */}
        <TabsContent value="delivery" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Livreurs</CardTitle>
                  <CardDescription>
                    Gérez les livreurs pour les commandes
                  </CardDescription>
                </div>
                <Button onClick={handleAddDelivery}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtres */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom ou téléphone..."
                    value={deliverySearchQuery}
                    onChange={(e) => setDeliverySearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="busy">Occupé</SelectItem>
                    <SelectItem value="offline">Hors ligne</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Liste des livreurs */}
              <div className="space-y-3">
                {filteredDelivery.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun livreur trouvé
                  </div>
                ) : (
                  filteredDelivery.map((person) => (
                    <Card key={person.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Truck className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{person.full_name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {person.phone}
                                </span>
                                {person.vehicle_type && (
                                  <span className="flex items-center gap-1">
                                    <Truck className="w-3 h-3" />
                                    {getVehicleLabel(person.vehicle_type)}
                                    {person.vehicle_number && ` - ${person.vehicle_number}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(person.status)}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditDelivery(person)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteDelivery(person.id)}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Personnel Restaurant */}
      <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? 'Modifier le personnel' : 'Ajouter un personnel'}
            </DialogTitle>
            <DialogDescription>
              {editingStaff
                ? 'Modifiez les informations du membre du personnel'
                : 'Ajoutez un nouveau membre du personnel'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email *</Label>
              <Input
                id="staff-email"
                type="email"
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                disabled={!!editingStaff}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-name">Nom complet *</Label>
              <Input
                id="staff-name"
                value={staffForm.full_name}
                onChange={(e) => setStaffForm({ ...staffForm, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-role">Rôle *</Label>
              <Select
                value={staffForm.role}
                onValueChange={(value) => setStaffForm({ ...staffForm, role: value })}
              >
                <SelectTrigger id="staff-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Gérant</SelectItem>
                  <SelectItem value="chef">Chef</SelectItem>
                  <SelectItem value="server">Serveur</SelectItem>
                  <SelectItem value="accountant">Comptable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-phone">Téléphone</Label>
              <Input
                id="staff-phone"
                type="tel"
                value={staffForm.phone}
                onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStaffDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveStaff}>
              {editingStaff ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Livreurs */}
      <Dialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDelivery ? 'Modifier le livreur' : 'Ajouter un livreur'}
            </DialogTitle>
            <DialogDescription>
              {editingDelivery
                ? 'Modifiez les informations du livreur'
                : 'Ajoutez un nouveau livreur'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delivery-name">Nom complet *</Label>
              <Input
                id="delivery-name"
                value={deliveryForm.full_name}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery-phone">Téléphone *</Label>
              <Input
                id="delivery-phone"
                type="tel"
                value={deliveryForm.phone}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery-vehicle">Type de véhicule *</Label>
              <Select
                value={deliveryForm.vehicle_type}
                onValueChange={(value) =>
                  setDeliveryForm({ ...deliveryForm, vehicle_type: value as VehicleType })
                }
              >
                <SelectTrigger id="delivery-vehicle">
                  <SelectValue placeholder="Sélectionner un véhicule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bike">Vélo</SelectItem>
                  <SelectItem value="motorcycle">Moto</SelectItem>
                  <SelectItem value="scooter">Scooter</SelectItem>
                  <SelectItem value="car">Voiture</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery-vehicle-number">Numéro de véhicule</Label>
              <Input
                id="delivery-vehicle-number"
                value={deliveryForm.vehicle_number}
                onChange={(e) =>
                  setDeliveryForm({ ...deliveryForm, vehicle_number: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery-status">Statut *</Label>
              <Select
                value={deliveryForm.status}
                onValueChange={(value) =>
                  setDeliveryForm({ ...deliveryForm, status: value as DeliveryPersonnelStatus })
                }
              >
                <SelectTrigger id="delivery-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="busy">Occupé</SelectItem>
                  <SelectItem value="offline">Hors ligne</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliveryDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveDelivery}>
              {editingDelivery ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

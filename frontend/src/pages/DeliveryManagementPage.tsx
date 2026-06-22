import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Truck, Plus, Edit, Trash2, Phone, User, MapPin } from 'lucide-react';
import type { DeliveryPersonnel, VehicleType, DeliveryPersonnelStatus } from '@/types';

export default function DeliveryManagementPage() {
  const { profile } = useAuth();
  const [deliveryPersonnel, setDeliveryPersonnel] = useState<DeliveryPersonnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<DeliveryPersonnel | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    vehicle_type: '' as VehicleType | '',
    vehicle_number: '',
    status: 'available' as DeliveryPersonnelStatus,
  });

  useEffect(() => {
    if (profile?.restaurant_id) {
      loadDeliveryPersonnel();
    }
  }, [profile?.restaurant_id]);

  const loadDeliveryPersonnel = async () => {
    if (!profile?.restaurant_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_personnel')
        .select('*')
        .eq('restaurant_id', profile.restaurant_id)
        .order('full_name');

      if (error) throw error;
      setDeliveryPersonnel(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des livreurs:', error);
      toast.error('Erreur lors du chargement des livreurs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.restaurant_id) return;

    try {
      if (editingPerson) {
        // Mise à jour
        const { error } = await supabase
          .from('delivery_personnel')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            vehicle_type: formData.vehicle_type || null,
            vehicle_number: formData.vehicle_number || null,
            status: formData.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPerson.id);

        if (error) throw error;
        toast.success('Livreur mis à jour avec succès');
      } else {
        // Création
        const { error } = await supabase
          .from('delivery_personnel')
          .insert({
            restaurant_id: profile.restaurant_id,
            full_name: formData.full_name,
            phone: formData.phone,
            vehicle_type: formData.vehicle_type || null,
            vehicle_number: formData.vehicle_number || null,
            status: formData.status,
          });

        if (error) throw error;
        toast.success('Livreur ajouté avec succès');
      }

      setIsDialogOpen(false);
      resetForm();
      loadDeliveryPersonnel();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      toast.error('Erreur lors de l\'enregistrement du livreur');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce livreur ?')) return;

    try {
      const { error } = await supabase
        .from('delivery_personnel')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Livreur supprimé avec succès');
      loadDeliveryPersonnel();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression du livreur');
    }
  };

  const handleEdit = (person: DeliveryPersonnel) => {
    setEditingPerson(person);
    setFormData({
      full_name: person.full_name,
      phone: person.phone,
      vehicle_type: person.vehicle_type || '',
      vehicle_number: person.vehicle_number || '',
      status: person.status,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPerson(null);
    setFormData({
      full_name: '',
      phone: '',
      vehicle_type: '',
      vehicle_number: '',
      status: 'available',
    });
  };

  const updateStatus = async (id: string, newStatus: DeliveryPersonnelStatus) => {
    try {
      const { error } = await supabase
        .from('delivery_personnel')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast.success('Statut mis à jour');
      loadDeliveryPersonnel();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const getStatusBadge = (status: DeliveryPersonnelStatus) => {
    const statusConfig: Record<DeliveryPersonnelStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      available: { label: 'Disponible', variant: 'default' },
      busy: { label: 'Occupé', variant: 'secondary' },
      offline: { label: 'Hors ligne', variant: 'destructive' },
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement des livreurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Livreurs</h1>
          <p className="text-muted-foreground">Gérez votre équipe de livraison</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un livreur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingPerson ? 'Modifier le livreur' : 'Ajouter un livreur'}
                </DialogTitle>
                <DialogDescription>
                  Remplissez les informations du livreur
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nom complet *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_type">Type de véhicule</Label>
                  <Select
                    value={formData.vehicle_type}
                    onValueChange={(value) => setFormData({ ...formData, vehicle_type: value as VehicleType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
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
                  <Label htmlFor="vehicle_number">Numéro de véhicule</Label>
                  <Input
                    id="vehicle_number"
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as DeliveryPersonnelStatus })}
                  >
                    <SelectTrigger>
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingPerson ? 'Mettre à jour' : 'Ajouter'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des livreurs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {deliveryPersonnel.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Aucun livreur enregistré</p>
            </CardContent>
          </Card>
        ) : (
          deliveryPersonnel.map((person) => (
            <Card key={person.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {person.full_name}
                  </CardTitle>
                  {getStatusBadge(person.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{person.phone}</span>
                  </div>
                  {person.vehicle_type && (
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {person.vehicle_type === 'bike' && 'Vélo'}
                        {person.vehicle_type === 'motorcycle' && 'Moto'}
                        {person.vehicle_type === 'scooter' && 'Scooter'}
                        {person.vehicle_type === 'car' && 'Voiture'}
                        {person.vehicle_number && ` - ${person.vehicle_number}`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Select
                    value={person.status}
                    onValueChange={(value) => updateStatus(person.id, value as DeliveryPersonnelStatus)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponible</SelectItem>
                      <SelectItem value="busy">Occupé</SelectItem>
                      <SelectItem value="offline">Hors ligne</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(person)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(person.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

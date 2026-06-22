import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, Trash2, Edit } from 'lucide-react';

interface DeliveryAddress {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postal_code: string | null;
  is_default: boolean;
}

export default function ClientProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
      loadAddresses();
    }
  }, [profile]);

  const loadAddresses = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('delivery_addresses')
        .select('*')
        .eq('customer_id', profile.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error: any) {
      console.error('Erreur chargement adresses:', error);
      toast.error('Erreur lors du chargement des adresses');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone,
        })
        .eq('id', profile?.id);

      if (error) throw error;

      // Rafraîchir le profil dans le contexte
      await refreshProfile();

      toast.success('Profil mis à jour avec succès');
    } catch (error: any) {
      console.error('Erreur mise à jour profil:', error);
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette adresse?')) return;

    try {
      const { error } = await supabase
        .from('delivery_addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;

      toast.success('Adresse supprimée');
      loadAddresses();
    } catch (error: any) {
      console.error('Erreur suppression adresse:', error);
      toast.error('Erreur lors de la suppression de l\'adresse');
    }
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Mon Profil</h1>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles et vos adresses de livraison
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Informations personnelles</TabsTrigger>
          <TabsTrigger value="addresses">Adresses de livraison</TabsTrigger>
        </TabsList>

        {/* Onglet Profil */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Mettez à jour vos informations de profil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {/* Nom complet */}
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nom complet</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="full_name"
                      type="text"
                      className="pl-10"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    />
                  </div>
                </div>

                {/* Email (lecture seule) */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      value={profileForm.email}
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    L'email ne peut pas être modifié
                  </p>
                </div>

                {/* Téléphone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      className="pl-10"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Adresses */}
        <TabsContent value="addresses">
          <Card>
            <CardHeader>
              <CardTitle>Adresses de livraison</CardTitle>
              <CardDescription>
                Gérez vos adresses de livraison enregistrées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {addresses.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune adresse enregistrée</h3>
                  <p className="text-muted-foreground mb-4">
                    Vos adresses de livraison seront enregistrées automatiquement lors de vos commandes
                  </p>
                </div>
              ) : (
                addresses.map((address) => (
                  <Card key={address.id} className="relative">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{address.full_name}</h3>
                            {address.is_default && (
                              <Badge variant="secondary">Par défaut</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {address.phone}
                            </p>
                            <p className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 mt-0.5" />
                              <span>
                                {address.address_line1}
                                {address.address_line2 && `, ${address.address_line2}`}
                                <br />
                                {address.city}
                                {address.postal_code && ` ${address.postal_code}`}
                              </span>
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAddress(address.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

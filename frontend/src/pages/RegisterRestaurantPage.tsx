import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UtensilsCrossed, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function RegisterRestaurantPage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    email: '',
    description: '',
    cuisine_type: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.id) {
      toast.error('Vous devez être connecté pour inscrire un restaurant');
      return;
    }

    try {
      setLoading(true);

      // Générer un slug à partir du nom du restaurant
      const slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
        .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
        .replace(/^-+|-+$/g, ''); // Supprimer les tirets au début et à la fin

      // Créer le restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .insert({
          name: formData.name,
          slug: slug,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          phone: formData.phone,
          email: formData.email,
          description: formData.description || null,
          cuisine_type: formData.cuisine_type || null,
          is_active: true,
          owner_id: profile.id,
        })
        .select()
        .single();

      if (restaurantError) throw restaurantError;

      // Associer le restaurant à l'utilisateur et définir le rôle owner
      // Utiliser la fonction RPC pour contourner la politique RLS
      const { error: profileError } = await supabase.rpc('set_user_as_restaurant_owner', {
        p_user_id: profile.id,
        p_restaurant_id: restaurantData.id,
      });

      if (profileError) throw profileError;

      // Créer quelques tables par défaut pour le restaurant
      const defaultTables = Array.from({ length: 10 }, (_, i) => ({
        restaurant_id: restaurantData.id,
        table_number: `${i + 1}`,
        capacity: i < 4 ? 2 : i < 8 ? 4 : 6,
        status: 'available',
      }));

      const { error: tablesError } = await supabase
        .from('tables')
        .insert(defaultTables);

      if (tablesError) {
        console.error('Erreur création tables:', tablesError);
        // Ne pas bloquer si erreur sur les tables
      }

      // Rafraîchir le profil
      await refreshProfile();

      setSuccess(true);
      toast.success('Restaurant inscrit avec succès!');

      // Rediriger vers le dashboard après 2 secondes
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      toast.error(`Erreur d'inscription: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-success" />
            <h2 className="text-2xl font-bold mb-2">Restaurant inscrit!</h2>
            <p className="text-muted-foreground mb-4">
              Votre restaurant a été créé avec succès. Vous allez être redirigé vers le dashboard...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">KobeTii</span>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Inscrire mon restaurant</CardTitle>
              <CardDescription>
                Remplissez les informations de votre restaurant pour commencer à utiliser KobeTii
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informations de base */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informations de base</h3>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du restaurant *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Le Petit Bistrot"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cuisine_type">Type de cuisine</Label>
                    <Input
                      id="cuisine_type"
                      value={formData.cuisine_type}
                      onChange={(e) => setFormData({ ...formData, cuisine_type: e.target.value })}
                      placeholder="Ex: Française, Italienne, Asiatique..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Décrivez votre restaurant..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Adresse */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Adresse</h3>

                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Ex: 123 Rue de la Paix"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Ville *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Ex: Paris"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Code postal *</Label>
                      <Input
                        id="postal_code"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        placeholder="Ex: 75001"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact</h3>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Ex: +33 1 23 45 67 89"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Ex: contact@restaurant.fr"
                      required
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Inscription en cours...
                      </>
                    ) : (
                      'Inscrire mon restaurant'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

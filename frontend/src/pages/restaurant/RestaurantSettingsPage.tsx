import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';
import ImageUploader from '@/components/ui/ImageUploader';

interface RestaurantData {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
  cuisine_type: string;
  opening_hours: string;
  logo_url: string;
  cover_image_url: string;
}

const EMPTY: RestaurantData = {
  id: '',
  name: '',
  description: '',
  address: '',
  city: '',
  postal_code: '',
  phone: '',
  email: '',
  cuisine_type: '',
  opening_hours: '',
  logo_url: '',
  cover_image_url: '',
};

export default function RestaurantSettingsPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<RestaurantData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.restaurant_id) {
      setLoading(false);
      return;
    }
    supabase
      .from('restaurants')
      .select('*')
      .eq('id', profile.restaurant_id)
      .maybeSingle()
      .then(({ data: r, error }) => {
        if (error) {
          toast.error('Impossible de charger les paramètres du restaurant');
        } else if (r) {
          setData({
            id: r.id ?? '',
            name: r.name ?? '',
            description: r.description ?? '',
            address: r.address ?? '',
            city: r.city ?? '',
            postal_code: r.postal_code ?? '',
            phone: r.phone ?? '',
            email: r.email ?? '',
            cuisine_type: r.cuisine_type ?? '',
            opening_hours: r.opening_hours ?? '',
            logo_url: r.logo_url ?? '',
            cover_image_url: r.cover_image_url ?? '',
          });
        }
        setLoading(false);
      });
  }, [profile?.restaurant_id]);

  const set = (field: keyof RestaurantData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.id) return;
    setSaving(true);
    const { error } = await supabase
      .from('restaurants')
      .update({
        name: data.name,
        description: data.description || null,
        address: data.address,
        city: data.city || null,
        postal_code: data.postal_code || null,
        phone: data.phone || null,
        email: data.email || null,
        cuisine_type: data.cuisine_type || null,
        opening_hours: data.opening_hours || null,
        logo_url: data.logo_url || null,
        cover_image_url: data.cover_image_url || null,
      })
      .eq('id', data.id);

    if (error) {
      toast.error(`Erreur lors de la sauvegarde : ${error.message}`);
    } else {
      toast.success('Paramètres sauvegardés avec succès');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data.id) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Aucun restaurant associé à ce compte.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez les informations et la configuration de votre restaurant.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Informations générales</CardTitle>
            <CardDescription>Nom, description et type de cuisine.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du restaurant *</Label>
              <Input id="name" value={data.name} onChange={set('name')} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={data.description}
                onChange={set('description')}
                rows={3}
                placeholder="Décrivez votre restaurant..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cuisine_type">Type de cuisine</Label>
              <Input
                id="cuisine_type"
                value={data.cuisine_type}
                onChange={set('cuisine_type')}
                placeholder="Ex : Sénégalaise, Française..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Contact</CardTitle>
            <CardDescription>Téléphone et adresse e-mail du restaurant.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" type="tel" value={data.phone} onChange={set('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={data.email} onChange={set('email')} />
            </div>
          </CardContent>
        </Card>

        {/* Adresse */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Adresse</CardTitle>
            <CardDescription>Localisation physique du restaurant.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Adresse *</Label>
              <Input id="address" value={data.address} onChange={set('address')} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input id="city" value={data.city} onChange={set('city')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Code postal</Label>
                <Input id="postal_code" value={data.postal_code} onChange={set('postal_code')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Horaires */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Horaires d'ouverture</CardTitle>
            <CardDescription>Renseignez vos horaires pour informer vos clients.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="opening_hours">Horaires</Label>
              <Textarea
                id="opening_hours"
                value={data.opening_hours}
                onChange={set('opening_hours')}
                rows={3}
                placeholder="Ex : Lun–Ven 11h–22h, Sam–Dim 12h–23h"
              />
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Images</CardTitle>
            <CardDescription>
              Logo carré et photo de couverture. Les images trop grandes sont compressées automatiquement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Logo du restaurant</Label>
              <div className="max-w-[160px]">
                <ImageUploader
                  bucket="restaurant-images"
                  folder={`restaurants/${data.id}/logo`}
                  currentUrl={data.logo_url}
                  onUploadComplete={(url) => setData((prev) => ({ ...prev, logo_url: url }))}
                  label="Logo"
                  aspectClass="aspect-square"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Photo de couverture</Label>
              <ImageUploader
                bucket="restaurant-images"
                folder={`restaurants/${data.id}/cover`}
                currentUrl={data.cover_image_url}
                onUploadComplete={(url) => setData((prev) => ({ ...prev, cover_image_url: url }))}
                label="Couverture"
                aspectClass="aspect-video"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bouton sauvegarder */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="min-w-32">
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sauvegarde...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Sauvegarder</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

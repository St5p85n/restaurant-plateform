import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, MessageSquare } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Restaurant } from '@/types';
import { toast } from 'sonner';

export default function ComplaintPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setRestaurants((data || []) as Restaurant[]);
    } catch (error: any) {
      toast.error(`Erreur de chargement: ${error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRestaurant || !subject || !description) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!user) {
      toast.error('Veuillez vous connecter pour soumettre une réclamation');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from('complaints').insert({
        restaurant_id: selectedRestaurant,
        source: 'customer',
        submitted_by: user.id,
        subject,
        description,
        rating: rating ? parseInt(rating) : null,
        status: 'pending',
        priority: 1,
      });

      if (error) throw error;

      setSuccess(true);
      toast.success('Réclamation envoyée avec succès');

      // Réinitialiser le formulaire après 3 secondes
      setTimeout(() => {
        setSuccess(false);
        setSelectedRestaurant('');
        setSubject('');
        setDescription('');
        setRating('');
      }, 3000);
    } catch (error: any) {
      toast.error(`Erreur d'envoi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container py-16">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-success" />
            <h2 className="text-2xl font-bold mb-2">Réclamation envoyée!</h2>
            <p className="text-muted-foreground mb-6">
              Votre réclamation a été transmise au restaurant.
              Vous recevrez une réponse dans les plus brefs délais.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild variant="outline">
                <a href="/">Retour à l'accueil</a>
              </Button>
              <Button onClick={() => setSuccess(false)}>
                Nouvelle réclamation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Soumettre une réclamation</h1>
          <p className="text-muted-foreground">
            Faites-nous part de votre expérience et aidez-nous à nous améliorer
          </p>
        </div>

        {/* Avertissement */}
        <Card className="mb-6 border-warning/50 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">Informations importantes</p>
                <p className="text-sm text-muted-foreground">
                  Votre réclamation sera transmise directement au restaurant concerné.
                  Soyez constructif et précis dans votre description pour faciliter le traitement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Formulaire de réclamation
            </CardTitle>
            <CardDescription>
              Tous les champs marqués d'un * sont obligatoires
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Restaurant */}
              <div className="space-y-2">
                <Label htmlFor="restaurant">Restaurant concerné *</Label>
                <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                  <SelectTrigger id="restaurant">
                    <SelectValue placeholder="Sélectionnez un restaurant" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants.map((restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label htmlFor="rating">Note (optionnel)</Label>
                <Select value={rating} onValueChange={setRating}>
                  <SelectTrigger id="rating">
                    <SelectValue placeholder="Attribuez une note" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">⭐⭐⭐⭐⭐ Excellent</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ Très bien</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ Bien</SelectItem>
                    <SelectItem value="2">⭐⭐ Moyen</SelectItem>
                    <SelectItem value="1">⭐ Médiocre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sujet */}
              <div className="space-y-2">
                <Label htmlFor="subject">Sujet *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Résumez votre réclamation en quelques mots"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description détaillée *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez votre expérience de manière détaillée. Incluez la date, l'heure, et tous les détails pertinents..."
                  rows={8}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Plus votre description est précise, plus il sera facile pour le restaurant de traiter votre réclamation.
                </p>
              </div>

              {/* Catégories suggérées */}
              <div className="space-y-2">
                <Label>Catégories courantes</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Qualité de la nourriture',
                    'Service',
                    'Propreté',
                    'Temps d\'attente',
                    'Prix',
                    'Réservation',
                    'Autre',
                  ].map((category) => (
                    <Button
                      key={category}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!subject) {
                          setSubject(category);
                        }
                      }}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Envoi en cours...' : 'Envoyer la réclamation'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Informations complémentaires */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Que se passe-t-il ensuite?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p>
                Votre réclamation est transmise au restaurant concerné
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p>
                Le restaurant examine votre réclamation et prépare une réponse
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <p>
                Vous recevez une réponse par email dans un délai de 48 heures
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <p>
                Si nécessaire, notre équipe super admin intervient pour résoudre le problème
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

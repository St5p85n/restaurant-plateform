import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Star, Clock, UtensilsCrossed, Calendar, Award, TrendingUp, ShoppingCart, Truck } from 'lucide-react';
import UserMenu from '@/components/common/UserMenu';

export default function HomePage() {
  const featuredRestaurants = [
    {
      id: '1',
      name: 'Le Thiep',
      cuisine: 'Senegalaise',
      rating: 4.8,
      reviews: 124,
      address: 'Dakar, Senegal',
      image: 'restaurant-1.jpg',
    },
    {
      id: '2',
      name: 'Saveurs d\'Afrique',
      cuisine: 'Africaine',
      rating: 4.6,
      reviews: 89,
      address: 'Dakar, Sénégal',
      image: 'restaurant-2.jpg',
    },
    {
      id: '3',
      name: 'La manioc',
      cuisine: 'Centrafricaine',
      rating: 4.9,
      reviews: 156,
      address: 'Bangui, Centrafrique',
      image: 'restaurant-3.jpg',
    },
  ];

  const features = [
    {
      icon: ShoppingCart,
      title: 'Commande en ligne',
      description: 'Commandez vos plats préférés en quelques clics',
    },
    {
      icon: Truck,
      title: 'Livraison rapide',
      description: 'Suivez votre commande en temps réel',
    },
    {
      icon: Calendar,
      title: 'Réservation en ligne',
      description: 'Réservez votre table en quelques clics',
    },
    {
      icon: Award,
      title: 'Programme de fidélité',
      description: 'Gagnez des points à chaque visite',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">KobeTii</span>
          </Link>
          <UserMenu />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Commandez en ligne et faites-vous{' '}
              <span className="gradient-text">livrer</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Découvrez les meilleurs restaurants, commandez vos plats préférés et suivez votre livraison en temps réel
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="h-14 text-lg">
                <Link to="/order/restaurants">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Passer Commande 
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 text-lg">
                <Link to="/restaurants">
                  <Calendar className="w-5 h-5 mr-2" />
                  Réserver une table
                </Link>
              </Button>
            </div>

            {/* Lien inscription */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Nouveau client? </span>
              <Link to="/register-client" className="text-primary hover:underline font-medium">
                Créer un compte pour suivre vos commandes
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Restaurants disponibles</h2>
            <p className="text-muted-foreground">Commandez dès maintenant chez nos partenaires</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRestaurants.map((restaurant) => (
              <Card key={restaurant.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <UtensilsCrossed className="w-16 h-16 text-muted-foreground" />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{restaurant.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {restaurant.address}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{restaurant.cuisine}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-primary text-primary" />
                      <span className="font-semibold">{restaurant.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({restaurant.reviews} avis)
                      </span>
                    </div>
                    <Button asChild size="sm">
                      <Link to={`/restaurant/${restaurant.id}`}>
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Commander
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button asChild size="lg">
              <Link to="/order/restaurants">
                Voir tous les restaurants
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Comment ça marche?</h2>
            <p className="text-muted-foreground">Commandez en ligne en quelques étapes simples</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-none">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Vous êtes restaurateur?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Rejoignez KobeTii et profitez d'une solution complète pour gérer votre établissement
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link to="/register-restaurant">
                    Inscrire mon restaurant
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/pricing">
                    Voir les tarifs
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

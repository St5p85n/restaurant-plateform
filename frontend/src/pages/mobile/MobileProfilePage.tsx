import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  MapPin,
  Bell,
  CreditCard,
  HelpCircle,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export default function MobileProfilePage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const menuItems = [
    {
      icon: User,
      label: 'Informations personnelles',
      path: '/mobile/profile/edit',
    },
    {
      icon: MapPin,
      label: 'Mes adresses',
      path: '/mobile/profile/addresses',
    },
    {
      icon: CreditCard,
      label: 'Moyens de paiement',
      path: '/mobile/profile/payment',
    },
    {
      icon: Bell,
      label: 'Notifications',
      path: '/mobile/profile/notifications',
    },
    {
      icon: Settings,
      label: 'Paramètres',
      path: '/mobile/profile/settings',
    },
    {
      icon: HelpCircle,
      label: 'Aide et support',
      path: '/mobile/profile/help',
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* En-tête */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4">
          <h1 className="text-xl font-semibold">Profil</h1>
          <p className="text-sm text-muted-foreground">Gérez votre compte</p>
        </div>
      </div>

      {/* Contenu */}
      <div className="space-y-4 p-4">
        {/* Carte profil */}
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {profile?.full_name ? getInitials(profile.full_name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{profile?.full_name || 'Utilisateur'}</h3>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              {profile?.phone && (
                <p className="text-sm text-muted-foreground">{profile.phone}</p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        {/* Menu */}
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => navigate(item.path)}
                  className="flex w-full items-center gap-3 p-4 transition-colors hover:bg-muted/50 active:bg-muted"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="flex-1 text-left text-sm font-medium">
                    {item.label}
                  </span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Informations */}
        <Card>
          <CardContent className="space-y-3 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Version 1.0.0
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <button className="hover:text-foreground">
                Conditions d'utilisation
              </button>
              <span>•</span>
              <button className="hover:text-foreground">
                Politique de confidentialité
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Déconnexion */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Se déconnecter
        </Button>
      </div>
    </div>
  );
}

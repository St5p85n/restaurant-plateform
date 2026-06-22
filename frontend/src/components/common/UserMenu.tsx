import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, LogOut, LayoutDashboard, UserCircle, LogIn } from 'lucide-react';
import { toast } from 'sonner';

export default function UserMenu() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Erreur lors de la déconnexion');
    } else {
      toast.success('Déconnexion réussie');
      navigate('/');
    }
  };

  // Si pas connecté, afficher bouton de connexion
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost">
          <Link to="/register-client">
            <User className="w-4 h-4 mr-2" />
            S'inscrire
          </Link>
        </Button>
        <Button asChild>
          <Link to="/login">
            <LogIn className="w-4 h-4 mr-2" />
            Se connecter
          </Link>
        </Button>
      </div>
    );
  }

  // Si connecté, afficher menu utilisateur
  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDashboardLink = () => {
    if (profile?.role === 'customer') {
      return '/client/dashboard';
    }
    return '/dashboard';
  };

  const getProfileLink = () => {
    if (profile?.role === 'customer') {
      return '/client/profile';
    }
    return '/dashboard'; // Les autres rôles n'ont pas de page profil dédiée pour l'instant
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(profile?.full_name || null)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile?.full_name || 'Utilisateur'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {profile?.email || user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={getDashboardLink()} className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>
              {profile?.role === 'customer' ? 'Mon Espace Client' : 'Mon Espace Restaurant'}
            </span>
          </Link>
        </DropdownMenuItem>
        {profile?.role === 'customer' && (
          <DropdownMenuItem asChild>
            <Link to={getProfileLink()} className="cursor-pointer">
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Mon Profil</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Se déconnecter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

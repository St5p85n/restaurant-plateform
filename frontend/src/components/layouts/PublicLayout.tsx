import React, { type ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PublicLayoutProps {
  children?: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const { user, profile } = useAuth();
  const location = useLocation();
  
  // Ne pas afficher le layout sur la page de login
  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary">
              <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text">KobeTii</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
              Accueil
            </Link>
            <Link to="/restaurants" className="text-sm font-medium hover:text-primary transition-colors">
              Restaurants
            </Link>
            <Link to="/reservations" className="text-sm font-medium hover:text-primary transition-colors">
              Réserver
            </Link>
            <Link to="/complaint" className="text-sm font-medium hover:text-primary transition-colors">
              Réclamation
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {user && profile ? (
              <>
                {profile.role !== 'customer' && (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/dashboard">
                      Mon Espace
                    </Link>
                  </Button>
                )}
                <Button asChild variant="default" size="sm">
                  <Link to="/customer/loyalty">
                    <User className="w-4 h-4 mr-2" />
                    Mon Compte
                  </Link>
                </Button>
              </>
            ) : (
              <Button asChild variant="default" size="sm">
                <Link to="/login">
                  Connexion
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-4">KobeTii</h3>
              <p className="text-sm text-muted-foreground">
                Plateforme complète de gestion de restaurants
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Liens rapides</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="hover:text-primary">Accueil</Link></li>
                <li><Link to="/restaurants" className="hover:text-primary">Restaurants</Link></li>
                <li><Link to="/reservations" className="hover:text-primary">Réserver</Link></li>
                <li><Link to="/complaint" className="hover:text-primary">Réclamation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Pour les restaurants</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register-restaurant" className="hover:text-primary">Inscrire mon restaurant</Link></li>
                <li><Link to="/pricing" className="hover:text-primary">Tarifs</Link></li>
                <li><Link to="/login" className="hover:text-primary">Connexion</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/terms" className="hover:text-primary">Conditions d'utilisation</Link></li>
                <li><Link to="/privacy" className="hover:text-primary">Politique de confidentialité</Link></li>
                <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2026 KobeTii. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

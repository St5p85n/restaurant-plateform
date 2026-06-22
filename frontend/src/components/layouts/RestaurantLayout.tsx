import React, { type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  LayoutDashboard, 
  Calendar, 
  UtensilsCrossed, 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign, 
  Award,
  MessageSquare,
  Menu,
  LogOut,
  Settings,
  Truck,
  ClipboardList,
  CreditCard,
  ReceiptText,
} from 'lucide-react';
import { Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ThemeToggle from '@/components/common/ThemeToggle';

interface RestaurantLayoutProps {
  children: ReactNode;
}

export default function RestaurantLayout({ children }: RestaurantLayoutProps) {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error(`Erreur de déconnexion: ${error.message}`);
    } else {
      toast.success('Déconnexion réussie');
      navigate('/');
    }
  };

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['owner', 'manager', 'accountant'],
    },
    {
      title: 'Réservations',
      href: '/dashboard/reservations',
      icon: Calendar,
      roles: ['owner', 'manager', 'server'],
    },
    {
      title: 'Carte & Menus',
      href: '/dashboard/menu',
      icon: UtensilsCrossed,
      roles: ['owner', 'manager', 'chef'],
    },
    {
      title: 'Tables',
      href: '/dashboard/pos',
      icon: ShoppingCart,
      roles: ['owner', 'manager', 'server'],
    },
    {
      title: 'Stocks',
      href: '/dashboard/stock',
      icon: Package,
      roles: ['owner', 'manager', 'chef'],
    },
    {
      title: 'Personnel',
      href: '/dashboard/staff',
      icon: Users,
      roles: ['owner', 'manager'],
    },
    {
      title: 'Utilisateurs & Livreurs',
      href: '/dashboard/users',
      icon: Users,
      roles: ['owner', 'manager'],
    },
    {
      title: 'Finances',
      href: '/dashboard/finances',
      icon: DollarSign,
      roles: ['owner', 'manager', 'accountant'],
    },
    {
      title: 'Transactions',
      href: '/dashboard/payments',
      icon: ReceiptText,
      roles: ['owner', 'manager', 'accountant'],
    },
    {
      title: 'Clients & Fidélité',
      href: '/dashboard/customers',
      icon: Award,
      roles: ['owner', 'manager'],
    },
    {
      title: 'Réclamations',
      href: '/dashboard/complaints',
      icon: MessageSquare,
      roles: ['owner', 'manager'],
    },
    {
      title: 'Avis clients',
      href: '/dashboard/reviews',
      icon: Star,
      roles: ['owner', 'manager'],
    },
    {
      title: 'Commandes',
      href: '/dashboard/orders',
      icon: ClipboardList,
      roles: ['owner', 'manager', 'server'],
    },
    {
      title: 'Livraison',
      href: '/dashboard/delivery',
      icon: Truck,
      roles: ['owner', 'manager'],
    },
    {
      title: 'Abonnement',
      href: '/dashboard/subscription',
      icon: CreditCard,
      roles: ['owner'],
    },
  ];

  const filteredNavigation = navigationItems.filter((item) =>
    !profile?.role || item.roles.includes(profile.role)
  );

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary">
            <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold gradient-text">KobeTii</span>
            <p className="text-xs text-muted-foreground">Espace Restaurant</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t space-y-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Apparence</span>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => navigate('/dashboard/settings')}
        >
          <Settings className="w-5 h-5 mr-3" />
          Paramètres
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Déconnexion
        </Button>
        {profile && (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            <p className="font-medium">{profile.full_name || profile.email}</p>
            <p className="capitalize">{profile.role}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r bg-background">
        <Sidebar />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 border-b bg-background">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>

        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary">
            <UtensilsCrossed className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold gradient-text">KobeTii</span>
        </Link>

        <div className="w-10" />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-muted/30">
        <div className="lg:pt-0 pt-16">
          {children}
        </div>
      </main>
    </div>
  );
}

import { type ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Store,
  CreditCard,
  MessageSquare,
  Menu,
  LogOut,
  Shield,
  BarChart2,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ThemeToggle from '@/components/common/ThemeToggle';
import { supabase } from '@/db/supabase';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    supabase
      .from('restaurants')
      .select('id', { count: 'exact', head: true })
      .eq('approval_status', 'pending')
      .then(({ count }) => setPendingCount(count || 0));
  }, []);

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
    { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, badge: undefined as number | undefined },
    { title: 'Analytique avancée', href: '/admin/advanced-dashboard', icon: BarChart2, badge: undefined },
    { title: "Demandes d'inscription", href: '/admin/registration-requests', icon: ClipboardList, badge: pendingCount > 0 ? pendingCount : undefined },
    { title: 'Restaurants', href: '/admin/restaurants', icon: Store, badge: undefined },
    { title: 'Abonnements', href: '/admin/subscriptions', icon: CreditCard, badge: undefined },
    { title: 'Réclamations', href: '/admin/complaints', icon: MessageSquare, badge: undefined },
    { title: 'Super Admins', href: '/admin/super-admins', icon: Shield, badge: undefined },
  ];

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const NavLinks = () => (
    <nav className="flex-1 space-y-1 p-4">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="flex-1">{item.title}</span>
            {item.badge != null && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold px-1">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Admin</h2>
            <p className="text-sm text-muted-foreground">KobeTii</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <NavLinks />

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-muted p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{profile?.full_name || 'Super Admin'}</p>
            <p className="truncate text-xs text-muted-foreground">{profile?.email || user?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-border md:block">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 min-w-0 flex-col">
        {/* Header Mobile */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background px-4 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold">Admin KobeTii</span>
          </div>

          <ThemeToggle />
        </header>

        {/* Header Desktop */}
        <header className="hidden h-16 items-center justify-between border-b border-border bg-background px-8 md:flex">
          <div>
            <h1 className="text-xl font-semibold">
              {navigationItems.find((item) => isActive(item.href))?.title || 'Administration'}
            </h1>
            <p className="text-sm text-muted-foreground">Gestion de la plateforme KobeTii</p>
          </div>
          <ThemeToggle />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

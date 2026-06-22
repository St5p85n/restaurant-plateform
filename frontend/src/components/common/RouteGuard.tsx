import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { routes } from '@/routes';

interface RouteGuardProps {
  children: React.ReactNode;
}

// System-level public routes (no need to register in routes.tsx)
const SYSTEM_PUBLIC_ROUTES = ['/login', '/403', '/404', '/register-client'];

// Derived from routes.tsx: all routes marked with public: true
const routePublicPaths = routes.filter(r => r.public).map(r => r.path);

const PUBLIC_ROUTES = [...SYSTEM_PUBLIC_ROUTES, ...routePublicPaths];

function matchPublicRoute(path: string, patterns: string[]) {
  return patterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(path);
    }
    return path === pattern;
  });
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const isPublic = matchPublicRoute(location.pathname, PUBLIC_ROUTES);

    // Si pas connecté et route privée → login
    if (!user && !isPublic) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return;
    }

    // Si connecté, rediriger selon le rôle
    if (user && profile) {
      // Redirection uniquement depuis /login (après connexion)
      if (location.pathname === '/login') {
        if (profile.role === 'super_admin') {
          navigate('/admin/dashboard', { replace: true });
        } else if (profile.role === 'customer') {
          navigate('/client/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
        return;
      }

      // Protéger les routes admin (uniquement pour super_admin)
      if (location.pathname.startsWith('/admin') && profile.role !== 'super_admin') {
        navigate('/403', { replace: true });
        return;
      }

      // Empêcher les clients d'accéder aux routes restaurant
      if (profile.role === 'customer' && location.pathname.startsWith('/dashboard')) {
        navigate('/client/dashboard', { replace: true });
        return;
      }

      // Empêcher le personnel restaurant d'accéder aux routes client
      if (profile.role !== 'customer' && location.pathname.startsWith('/client')) {
        navigate('/dashboard', { replace: true });
        return;
      }
    }
  }, [user, profile, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
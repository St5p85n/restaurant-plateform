import React, { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Shield, AlertTriangle } from 'lucide-react';
import SuperAdminCard from '@/components/admin/SuperAdminCard';

interface SuperAdmin {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  created_at: string;
  last_login: string | null;
  login_count: number;
}

interface AuthLog {
  id: string;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export default function SuperAdminManagementPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<SuperAdmin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<SuperAdmin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [authLogs, setAuthLogs] = useState<AuthLog[]>([]);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeAdminId, setRevokeAdminId] = useState<string | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    loadSuperAdmins();
  }, []);

  useEffect(() => {
    filterAdmins();
  }, [searchQuery, admins]);

  const loadSuperAdmins = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_super_admins_with_stats');

      if (error) throw error;

      setAdmins(data || []);
      setFilteredAdmins(data || []);
    } catch (error: any) {
      toast.error(`Erreur lors du chargement: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterAdmins = () => {
    if (!searchQuery.trim()) {
      setFilteredAdmins(admins);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = admins.filter(
      (admin) =>
        admin.email.toLowerCase().includes(query) ||
        admin.full_name?.toLowerCase().includes(query) ||
        admin.username?.toLowerCase().includes(query)
    );
    setFilteredAdmins(filtered);
  };

  const handleViewHistory = async (adminId: string) => {
    try {
      setLoadingLogs(true);
      setSelectedAdminId(adminId);
      setShowHistoryDialog(true);

      const { data, error } = await supabase.rpc('get_user_auth_logs', {
        p_user_id: adminId,
        p_limit: 50,
      });

      if (error) throw error;

      setAuthLogs(data || []);
    } catch (error: any) {
      toast.error(`Erreur lors du chargement de l'historique: ${error.message}`);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleRevoke = (adminId: string) => {
    setRevokeAdminId(adminId);
    setShowRevokeDialog(true);
  };

  const confirmRevoke = async () => {
    if (!revokeAdminId) return;

    try {
      setRevoking(true);
      const { data, error } = await supabase.rpc('revoke_super_admin', {
        p_user_id: revokeAdminId,
      });

      if (error) throw error;

      if (data && !data.success) {
        toast.error(data.error || 'Erreur lors de la révocation');
        return;
      }

      toast.success('Accès super admin révoqué avec succès');
      setShowRevokeDialog(false);
      setRevokeAdminId(null);
      loadSuperAdmins();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setRevoking(false);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      login: 'Connexion',
      logout: 'Déconnexion',
      signup: 'Inscription',
      password_reset: 'Réinitialisation mot de passe',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      login: 'text-green-600',
      logout: 'text-gray-600',
      signup: 'text-blue-600',
      password_reset: 'text-orange-600',
    };
    return colors[action] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Chargement des super administrateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Gestion des Super Administrateurs</h1>
            <p className="text-sm text-muted-foreground">
              Gérez les accès et consultez l'historique des connexions
            </p>
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email ou username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredAdmins.length} administrateur{filteredAdmins.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Liste des super admins */}
      {filteredAdmins.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed border-border/60">
          <div className="text-center space-y-2">
            <Shield className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Aucun administrateur trouvé' : 'Aucun super administrateur'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAdmins.map((admin) => (
            <SuperAdminCard
              key={admin.id}
              admin={admin}
              onViewHistory={handleViewHistory}
              onRevoke={handleRevoke}
              currentUserId={user?.id || ''}
            />
          ))}
        </div>
      )}

      {/* Dialog Historique */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historique des connexions</DialogTitle>
            <DialogDescription>
              Dernières 50 actions d'authentification
            </DialogDescription>
          </DialogHeader>

          {loadingLogs ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : authLogs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Aucun historique disponible
            </div>
          ) : (
            <div className="space-y-2">
              {authLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg border border-border/40 p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    {log.ip_address && (
                      <p className="text-xs text-muted-foreground">IP: {log.ip_address}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmation Révocation */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Révoquer l'accès super admin</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              Cette action changera le rôle de cet utilisateur en "client". Il perdra tous ses
              privilèges d'administration. Cette action est réversible en recréant un compte super
              admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevoke}
              disabled={revoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revoking ? 'Révocation...' : 'Révoquer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

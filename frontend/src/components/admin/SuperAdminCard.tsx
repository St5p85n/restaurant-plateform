import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, History, UserX, Calendar, LogIn } from 'lucide-react';

interface SuperAdminCardProps {
  admin: {
    id: string;
    email: string;
    username: string | null;
    full_name: string | null;
    created_at: string;
    last_login: string | null;
    login_count: number;
  };
  onViewHistory: (adminId: string) => void;
  onRevoke: (adminId: string) => void;
  currentUserId: string;
}

export default function SuperAdminCard({ admin, onViewHistory, onRevoke, currentUserId }: SuperAdminCardProps) {
  const isCurrentUser = admin.id === currentUserId;
  const createdDate = new Date(admin.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const lastLoginDate = admin.last_login
    ? new Date(admin.last_login).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Jamais';

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/5">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-medium leading-none">
                {admin.full_name || 'Sans nom'}
              </h3>
              <p className="text-sm text-muted-foreground">{admin.email}</p>
              {admin.username && (
                <p className="text-xs text-muted-foreground">@{admin.username}</p>
              )}
            </div>
          </div>
          {isCurrentUser && (
            <Badge variant="secondary" className="text-xs">
              Vous
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/30 p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Créé le</span>
            </div>
            <p className="text-sm font-medium">{createdDate}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <LogIn className="h-3.5 w-3.5" />
              <span>Dernière connexion</span>
            </div>
            <p className="text-sm font-medium">{lastLoginDate}</p>
          </div>
        </div>

        {/* Nombre de connexions */}
        <div className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-3">
          <span className="text-sm text-muted-foreground">Connexions totales</span>
          <Badge variant="outline" className="font-mono">
            {admin.login_count}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewHistory(admin.id)}
          >
            <History className="mr-2 h-4 w-4" />
            Historique
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onRevoke(admin.id)}
            disabled={isCurrentUser}
          >
            <UserX className="mr-2 h-4 w-4" />
            Révoquer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Package } from 'lucide-react';

interface OrderCardProps {
  id: string;
  order_number: string;
  restaurant_name: string;
  status: string;
  total: number;
  created_at: string;
  items_count: number;
  delivery_status?: string;
  onClick: () => void;
}

export default function OrderCard({
  order_number,
  restaurant_name,
  status,
  total,
  created_at,
  items_count,
  delivery_status,
  onClick,
}: OrderCardProps) {
  const getStatusBadge = () => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: 'En attente' },
      in_progress: { variant: 'default', label: 'En préparation' },
      ready: { variant: 'default', label: 'Prêt' },
      served: { variant: 'outline', label: 'Servi' },
      paid: { variant: 'outline', label: 'Payé' },
      cancelled: { variant: 'destructive', label: 'Annulé' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDeliveryStatusBadge = () => {
    if (!delivery_status) return null;
    
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string; icon: React.ReactNode }> = {
      pending: { variant: 'secondary', label: 'En attente', icon: <Clock className="h-3 w-3" /> },
      assigned: { variant: 'default', label: 'Livreur assigné', icon: <Package className="h-3 w-3" /> },
      picked_up: { variant: 'default', label: 'En cours', icon: <MapPin className="h-3 w-3" /> },
      delivered: { variant: 'outline', label: 'Livré', icon: <Package className="h-3 w-3" /> },
    };
    const config = statusConfig[delivery_status] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <Card className="overflow-hidden border-border/40 transition-all active:scale-[0.98]" onClick={onClick}>
      <CardContent className="space-y-3 p-4">
        {/* En-tête */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="font-semibold text-sm">#{order_number}</p>
            <p className="text-sm text-muted-foreground">{restaurant_name}</p>
          </div>
          {getStatusBadge()}
        </div>

        {/* Informations */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{items_count} article{items_count > 1 ? 's' : ''}</span>
          </div>
          <span className="font-semibold text-primary">
            {total.toLocaleString()} FCFA
          </span>
        </div>

        {/* Statut livraison */}
        {delivery_status && (
          <div className="flex items-center justify-between">
            {getDeliveryStatusBadge()}
            <span className="text-xs text-muted-foreground">
              {formatDate(created_at)}
            </span>
          </div>
        )}

        {!delivery_status && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDate(created_at)}</span>
          </div>
        )}

        {/* Action */}
        {(status === 'in_progress' || delivery_status === 'picked_up') && (
          <Button variant="outline" size="sm" className="w-full" onClick={onClick}>
            Suivre la commande
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

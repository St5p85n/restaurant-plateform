import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Eye,
  Pause,
  Play,
  Ban,
  Pencil
} from 'lucide-react';
import type { RestaurantWithStats } from '@/types';
import { Link } from 'react-router-dom';

interface RestaurantCardProps {
  restaurant: RestaurantWithStats;
  onSuspend?: (id: string) => void;
  onActivate?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export default function RestaurantCard({ 
  restaurant, 
  onSuspend, 
  onActivate,
  onDeactivate,
  onEdit,
}: RestaurantCardProps) {
  const getStatusBadge = () => {
    if (!restaurant.is_active) {
      return <Badge variant="destructive">Désactivé</Badge>;
    }
    if (restaurant.subscription?.status === 'suspended') {
      return <Badge variant="secondary">Suspendu</Badge>;
    }
    if (restaurant.subscription?.status === 'active') {
      return <Badge variant="default">Actif</Badge>;
    }
    return <Badge variant="outline">En attente</Badge>;
  };

  return (
    <Card className="hover:border-primary transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{restaurant.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{restaurant.cuisine_type || 'Non spécifié'}</p>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Informations de contact */}
        <div className="space-y-2 text-sm">
          {restaurant.address && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{restaurant.address}</span>
            </div>
          )}
          {restaurant.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{restaurant.phone}</span>
            </div>
          )}
          {restaurant.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{restaurant.email}</span>
            </div>
          )}
        </div>

        {/* Statistiques */}
        {restaurant.stats && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Commandes</p>
              <p className="text-lg font-semibold">{restaurant.stats.total_orders}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
              <p className="text-lg font-semibold">{restaurant.stats.total_revenue.toLocaleString()} FCFA</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Note moyenne</p>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <p className="text-lg font-semibold">{restaurant.stats.average_rating.toFixed(1)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Réclamations</p>
              <p className="text-lg font-semibold">{restaurant.stats.total_complaints}</p>
            </div>
          </div>
        )}

        {/* Abonnement */}
        {restaurant.subscription && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Abonnement</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-medium capitalize">
                {restaurant.subscription.plan === 'monthly' ? 'Mensuel' : 
                 restaurant.subscription.plan === 'annual' ? 'Annuel' : 
                 'Par utilisateur'}
              </span>
              <span className="text-sm font-semibold">
                {restaurant.subscription.amount?.toLocaleString() || '0'} {restaurant.subscription.currency || 'FCFA'}
              </span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 flex-wrap">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link to={`/admin/restaurants/${restaurant.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            Détails
          </Link>
        </Button>

        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(restaurant.id)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        
        {restaurant.is_active && restaurant.subscription?.status === 'active' && onSuspend && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onSuspend(restaurant.id)}
          >
            <Pause className="h-4 w-4" />
          </Button>
        )}
        
        {restaurant.subscription?.status === 'suspended' && onActivate && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onActivate(restaurant.id)}
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
        
        {restaurant.is_active && onDeactivate && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDeactivate(restaurant.id)}
          >
            <Ban className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

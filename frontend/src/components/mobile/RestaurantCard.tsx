import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Clock } from 'lucide-react';

interface RestaurantCardProps {
  id: string;
  name: string;
  cuisine_type: string;
  address: string;
  rating: number;
  total_reviews: number;
  cover_image_url?: string;
  distance?: number;
  is_active: boolean;
  onClick: () => void;
}

export default function RestaurantCard({
  name,
  cuisine_type,
  address,
  rating,
  total_reviews,
  cover_image_url,
  distance,
  is_active,
  onClick,
}: RestaurantCardProps) {
  return (
    <Card 
      className="overflow-hidden border-border/40 transition-all active:scale-[0.98]" 
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-40 w-full overflow-hidden bg-muted">
        {cover_image_url ? (
          <img
            src={cover_image_url}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        
        {!is_active && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Badge variant="secondary">Fermé</Badge>
          </div>
        )}
      </div>

      <CardContent className="space-y-3 p-4">
        {/* Nom et type */}
        <div>
          <h3 className="font-semibold text-base line-clamp-1">{name}</h3>
          <p className="text-sm text-muted-foreground">{cuisine_type}</p>
        </div>

        {/* Informations */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({total_reviews})</span>
          </div>

          {distance && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{distance.toFixed(1)} km</span>
            </div>
          )}
        </div>

        {/* Adresse */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span className="line-clamp-1">{address}</span>
        </div>

        {/* Temps de livraison estimé */}
        {is_active && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>30-45 min</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

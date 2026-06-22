import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';
import StarRatingDisplay from '@/components/reviews/StarRatingDisplay';

interface MenuItemCardProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  allergens?: string[];
  quantity?: number;
  avgRating?: number;
  reviewCount?: number;
  onAdd: () => void;
  onRemove?: () => void;
}

export default function MenuItemCard({
  name,
  description,
  price,
  image_url,
  is_available,
  allergens,
  quantity = 0,
  avgRating,
  reviewCount,
  onAdd,
  onRemove,
}: MenuItemCardProps) {
  return (
    <Card className={`overflow-hidden border-border/40 ${!is_available ? 'opacity-60' : ''}`}>
      <CardContent className="flex gap-3 p-3">
        {/* Image */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
          {image_url ? (
            <img
              src={image_url}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl">
              🍽️
            </div>
          )}
          
          {!is_available && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Badge variant="secondary" className="text-xs">
                Indisponible
              </Badge>
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className="flex flex-1 flex-col justify-between">
          <div className="space-y-1">
            <h4 className="font-medium text-sm line-clamp-1">{name}</h4>
            {(avgRating ?? 0) > 0 && (
              <StarRatingDisplay rating={avgRating!} count={reviewCount} size="xs" />
            )}
            {description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
            {allergens && allergens.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {allergens.slice(0, 2).map((allergen) => (
                  <Badge key={allergen} variant="outline" className="text-xs px-1.5 py-0">
                    {allergen}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-primary">
              {price.toLocaleString()} FCFA
            </span>

            {is_available && (
              <div className="flex items-center gap-2">
                {quantity > 0 ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0"
                      onClick={onRemove}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">
                      {quantity}
                    </span>
                    <Button
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={onAdd}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <Button size="sm" className="h-7 px-3" onClick={onAdd}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Ajouter
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

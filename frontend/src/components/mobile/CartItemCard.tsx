import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Trash2 } from 'lucide-react';

interface CartItemCardProps {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  special_instructions?: string;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

export default function CartItemCard({
  name,
  price,
  quantity,
  image_url,
  special_instructions,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemCardProps) {
  const subtotal = price * quantity;

  return (
    <Card className="overflow-hidden border-border/40">
      <CardContent className="flex gap-3 p-3">
        {/* Image */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
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
        </div>

        {/* Contenu */}
        <div className="flex flex-1 flex-col justify-between">
          <div className="space-y-1">
            <h4 className="font-medium text-sm line-clamp-1">{name}</h4>
            <p className="text-sm text-primary font-semibold">
              {price.toLocaleString()} FCFA
            </p>
            {special_instructions && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                Note: {special_instructions}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            {/* Contrôles de quantité */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={onDecrease}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-6 text-center text-sm font-medium">
                {quantity}
              </span>
              <Button
                size="sm"
                className="h-7 w-7 p-0"
                onClick={onIncrease}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Sous-total et suppression */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">
                {subtotal.toLocaleString()} F
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={onRemove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

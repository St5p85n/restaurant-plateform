import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingDisplayProps {
  rating: number;     // moyenne (ex. 4.3)
  count?: number;     // nb d'avis
  size?: 'xs' | 'sm' | 'md';
  showCount?: boolean;
}

// Composant réutilisable pour afficher une note en lecture seule
export default function StarRatingDisplay({
  rating,
  count,
  size = 'sm',
  showCount = true,
}: StarRatingDisplayProps) {
  const sizeClass =
    size === 'xs' ? 'h-3 w-3' : size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  const textClass =
    size === 'xs' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-xs';

  if (rating === 0 || !rating) {
    return showCount ? (
      <span className={`${textClass} text-muted-foreground/60`}>
        {count === 0 ? 'Aucun avis' : ''}
      </span>
    ) : null;
  }

  return (
    <span className="inline-flex items-center gap-1">
      <Star className={`${sizeClass} fill-yellow-400 text-yellow-400 shrink-0`} />
      <span className={`${textClass} font-medium text-foreground`}>
        {rating.toFixed(1)}
      </span>
      {showCount && count !== undefined && (
        <span className={`${textClass} text-muted-foreground`}>
          ({count})
        </span>
      )}
    </span>
  );
}

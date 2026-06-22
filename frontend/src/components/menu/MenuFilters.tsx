import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SlidersHorizontal, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MenuFilterState {
  priceMin:        string;   // '' = non défini
  priceMax:        string;
  minRating:       number;   // 0 = pas de filtre
  diet:            Set<'vegetarian' | 'vegan' | 'halal' | 'gluten_free'>;
  spiceLevel:      number | null;  // null = tous, 0-3
  maxPrepTime:     number | null;  // null = tous (minutes)
}

export const DEFAULT_FILTERS: MenuFilterState = {
  priceMin:    '',
  priceMax:    '',
  minRating:   0,
  diet:        new Set(),
  spiceLevel:  null,
  maxPrepTime: null,
};

export function hasActiveFilters(f: MenuFilterState): boolean {
  return (
    f.priceMin !== '' ||
    f.priceMax !== '' ||
    f.minRating > 0 ||
    f.diet.size > 0 ||
    f.spiceLevel !== null ||
    f.maxPrepTime !== null
  );
}

interface MenuFiltersProps {
  filters: MenuFilterState;
  onChange: (f: MenuFilterState) => void;
  /** Affichage compact pour mobile */
  compact?: boolean;
  currency?: string;
}

// ─── Données chips ────────────────────────────────────────────────────────────

const RATING_OPTIONS = [
  { label: '3★ et +', value: 3 },
  { label: '4★ et +', value: 4 },
  { label: '4.5★ et +', value: 4.5 },
];

const DIET_OPTIONS: { label: string; value: MenuFilterState['diet'] extends Set<infer T> ? T : never; emoji: string }[] = [
  { label: 'Végétarien', value: 'vegetarian',  emoji: '🥦' },
  { label: 'Végan',      value: 'vegan',       emoji: '🌱' },
  { label: 'Halal',      value: 'halal',       emoji: '☪️' },
  { label: 'Sans gluten',value: 'gluten_free', emoji: '🌾' },
];

const SPICE_OPTIONS = [
  { label: 'Non épicé',    value: 0, emoji: '🫙' },
  { label: 'Légèrement',   value: 1, emoji: '🌶' },
  { label: 'Épicé',        value: 2, emoji: '🌶🌶' },
  { label: 'Très épicé',   value: 3, emoji: '🌶🌶🌶' },
];

const PREP_OPTIONS = [
  { label: 'Rapide  ≤ 15 min',  value: 15 },
  { label: 'Moyen   ≤ 30 min',  value: 30 },
  { label: 'Long    ≤ 60 min',  value: 60 },
];

// ─── Composant ────────────────────────────────────────────────────────────────

export default function MenuFilters({ filters, onChange, compact = false, currency = 'FCFA' }: MenuFiltersProps) {
  const set = (patch: Partial<MenuFilterState>) => onChange({ ...filters, ...patch });

  const toggleDiet = (v: typeof DIET_OPTIONS[number]['value']) => {
    const next = new Set(filters.diet);
    if (next.has(v)) next.delete(v); else next.add(v);
    set({ diet: next });
  };

  const activeCount = [
    filters.priceMin !== '' || filters.priceMax !== '',
    filters.minRating > 0,
    filters.diet.size > 0,
    filters.spiceLevel !== null,
    filters.maxPrepTime !== null,
  ].filter(Boolean).length;

  return (
    <div className={`space-y-4 ${compact ? 'text-xs' : 'text-sm'}`}>
      {/* ─ En-tête ─ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-muted-foreground`} />
          <span className="font-medium text-foreground">Filtres</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="h-5 rounded-full px-1.5 text-xs font-normal">
              {activeCount}
            </Badge>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={() => onChange({ ...DEFAULT_FILTERS, diet: new Set() })}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            <X className="h-3 w-3" />
            Réinitialiser
          </button>
        )}
      </div>

      {/* ─ Prix ─ */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Prix ({currency})
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.priceMin}
            onChange={(e) => set({ priceMin: e.target.value })}
            className="h-8 w-24 px-2 text-xs"
            min={0}
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.priceMax}
            onChange={(e) => set({ priceMax: e.target.value })}
            className="h-8 w-24 px-2 text-xs"
            min={0}
          />
        </div>
      </div>

      {/* ─ Note minimale ─ */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Note minimale
        </p>
        <div className="flex flex-wrap gap-2">
          {RATING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => set({ minRating: filters.minRating === opt.value ? 0 : opt.value })}
              className={`inline-flex h-7 items-center rounded-full border px-3 text-xs transition-colors ${
                filters.minRating === opt.value
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-muted-foreground hover:border-foreground/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─ Régime alimentaire ─ */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Régime alimentaire
        </p>
        <div className="flex flex-wrap gap-2">
          {DIET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => toggleDiet(opt.value)}
              className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors ${
                filters.diet.has(opt.value)
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-muted-foreground hover:border-foreground/40'
              }`}
            >
              <span>{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─ Niveau d'épices ─ */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Niveau d'épices
        </p>
        <div className="flex flex-wrap gap-2">
          {SPICE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => set({ spiceLevel: filters.spiceLevel === opt.value ? null : opt.value })}
              className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors ${
                filters.spiceLevel === opt.value
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-muted-foreground hover:border-foreground/40'
              }`}
            >
              <span>{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─ Temps de préparation ─ */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Temps de préparation
        </p>
        <div className="flex flex-wrap gap-2">
          {PREP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => set({ maxPrepTime: filters.maxPrepTime === opt.value ? null : opt.value })}
              className={`inline-flex h-7 items-center rounded-full border px-3 text-xs transition-colors ${
                filters.maxPrepTime === opt.value
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-muted-foreground hover:border-foreground/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Fonction utilitaire de filtrage ─────────────────────────────────────────

export function applyMenuFilters<T extends {
  price: number;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_halal?: boolean;
  is_gluten_free?: boolean;
  spice_level?: number;
  preparation_time?: number | null;
}>(
  items: T[],
  filters: MenuFilterState,
  reviewsMap: Record<string, { avg: number; count: number }>,
  getId: (item: T) => string,
): T[] {
  return items.filter((item) => {
    const id = getId(item);

    // Prix
    if (filters.priceMin !== '' && item.price < parseFloat(filters.priceMin)) return false;
    if (filters.priceMax !== '' && item.price > parseFloat(filters.priceMax)) return false;

    // Note minimale
    if (filters.minRating > 0) {
      const avg = reviewsMap[id]?.avg ?? 0;
      if (avg < filters.minRating) return false;
    }

    // Régimes alimentaires (ET logique : tous les régimes sélectionnés doivent être satisfaits)
    if (filters.diet.has('vegetarian') && !item.is_vegetarian) return false;
    if (filters.diet.has('vegan')      && !item.is_vegan)      return false;
    if (filters.diet.has('halal')      && !item.is_halal)      return false;
    if (filters.diet.has('gluten_free')&& !item.is_gluten_free)return false;

    // Épices
    if (filters.spiceLevel !== null && item.spice_level !== filters.spiceLevel) return false;

    // Temps de préparation
    if (filters.maxPrepTime !== null) {
      if (item.preparation_time == null || item.preparation_time > filters.maxPrepTime) return false;
    }

    return true;
  });
}

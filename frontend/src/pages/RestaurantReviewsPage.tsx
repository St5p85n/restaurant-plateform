import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Search, ArrowUpDown, MessageSquare, Reply, Check, X, Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import StarRatingDisplay from '@/components/reviews/StarRatingDisplay';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer_id: string | null;
  restaurant_reply: string | null;
  replied_at: string | null;
}

interface DishWithReviews {
  id: string;
  name: string;
  image_url: string | null;
  avg_rating: number;
  review_count: number;
  reviews: ReviewRow[];
}

type SortKey = 'avg_rating_desc' | 'avg_rating_asc' | 'review_count_desc' | 'name_asc';
type RatingFilter = 'all' | '5' | '4' | '3' | '2' | '1';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RestaurantReviewsPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [dishes, setDishes] = useState<DishWithReviews[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('avg_rating_desc');
  const [expandedDish, setExpandedDish] = useState<string | null>(null);
  // État pour l'édition de réponse : reviewId → texte en cours
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [replyEditing, setReplyEditing] = useState<Set<string>>(new Set());
  const [replySaving, setReplySaving] = useState<Set<string>>(new Set());

  // Charger le restaurant_id du user connecté
  useEffect(() => {
    if (user) loadRestaurantId();
  }, [user]);

  const loadRestaurantId = async () => {
    const { data } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', user!.id)
      .maybeSingle();
    if (data?.id) setRestaurantId(data.id);
  };

  const loadData = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      // 1. Plats du restaurant
      const { data: items, error: itemsErr } = await supabase
        .from('menu_items')
        .select('id, name, image_url')
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (itemsErr) throw itemsErr;

      // 2. Avis pour tous ces plats
      const ids = (items ?? []).map((i) => i.id);
      let reviews: ReviewRow[] = [];
      if (ids.length > 0) {
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('id, rating, comment, created_at, customer_id, menu_item_id, restaurant_reply, replied_at')
          .in('menu_item_id', ids)
          .order('created_at', { ascending: false });
        reviews = Array.isArray(reviewsData) ? (reviewsData as any[]) : [];
      }

      // 3. Grouper par plat
      const grouped: Record<string, ReviewRow[]> = {};
      reviews.forEach((r: any) => {
        if (!grouped[r.menu_item_id]) grouped[r.menu_item_id] = [];
        grouped[r.menu_item_id].push(r);
      });

      const result: DishWithReviews[] = (items ?? []).map((item) => {
        const dishReviews = grouped[item.id] ?? [];
        const avg = dishReviews.length > 0
          ? dishReviews.reduce((s, r) => s + r.rating, 0) / dishReviews.length
          : 0;
        return {
          id:           item.id,
          name:         item.name,
          image_url:    item.image_url,
          avg_rating:   avg,
          review_count: dishReviews.length,
          reviews:      dishReviews,
        };
      });

      setDishes(result);
    } catch {
      toast.error('Erreur lors du chargement des évaluations');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Réponses restaurant ──────────────────────────────────────────────────
  const startReply = (review: ReviewRow) => {
    setReplyDraft((prev) => ({ ...prev, [review.id]: review.restaurant_reply ?? '' }));
    setReplyEditing((prev) => new Set(prev).add(review.id));
  };

  const cancelReply = (reviewId: string) => {
    setReplyEditing((prev) => { const s = new Set(prev); s.delete(reviewId); return s; });
    setReplyDraft((prev) => { const n = { ...prev }; delete n[reviewId]; return n; });
  };

  const submitReply = async (reviewId: string) => {
    const text = (replyDraft[reviewId] ?? '').trim();
    setReplySaving((prev) => new Set(prev).add(reviewId));
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          restaurant_reply: text || null,
          replied_at: text ? new Date().toISOString() : null,
        })
        .eq('id', reviewId);
      if (error) throw error;
      toast.success(text ? 'Réponse publiée.' : 'Réponse supprimée.');
      cancelReply(reviewId);
      // Mettre à jour localement sans recharger
      setDishes((prev) =>
        prev.map((d) => ({
          ...d,
          reviews: d.reviews.map((r) =>
            r.id === reviewId
              ? { ...r, restaurant_reply: text || null, replied_at: text ? new Date().toISOString() : null }
              : r
          ),
        }))
      );
    } catch {
      toast.error('Impossible de publier la réponse.');
    } finally {
      setReplySaving((prev) => { const s = new Set(prev); s.delete(reviewId); return s; });
    }
  };

  // ── Filtrage + tri ───────────────────────────────────────────────────────
  const filtered = dishes
    .filter((d) => {
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
      const matchRating = ratingFilter === 'all'
        ? true
        : d.reviews.some((r) => r.rating === parseInt(ratingFilter));
      return matchSearch && matchRating;
    })
    .sort((a, b) => {
      switch (sortKey) {
        case 'avg_rating_desc': return b.avg_rating - a.avg_rating;
        case 'avg_rating_asc':  return a.avg_rating - b.avg_rating;
        case 'review_count_desc': return b.review_count - a.review_count;
        case 'name_asc': return a.name.localeCompare(b.name, 'fr');
        default: return 0;
      }
    });

  // ── KPIs globaux ─────────────────────────────────────────────────────────
  const totalReviews = dishes.reduce((s, d) => s + d.review_count, 0);
  const ratedDishes  = dishes.filter((d) => d.review_count > 0);
  const globalAvg    = ratedDishes.length > 0
    ? ratedDishes.reduce((s, d) => s + d.avg_rating, 0) / ratedDishes.length
    : 0;
  const bestDish     = [...dishes].sort((a, b) => b.avg_rating - a.avg_rating).find((d) => d.review_count > 0);

  // ── Rendu ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 font-montserrat">

      {/* ─ En-tête ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-semibold text-foreground text-balance">
          Évaluations des plats
        </h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Avis clients sur l'ensemble de votre carte
        </p>
      </div>

      {/* ─ KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Avis reçus',
            value: loading ? '—' : totalReviews.toLocaleString('fr-FR'),
          },
          {
            label: 'Note moyenne',
            value: loading ? '—' : (globalAvg > 0 ? globalAvg.toFixed(1) + ' / 5' : '—'),
          },
          {
            label: 'Meilleur plat',
            value: loading ? '—' : (bestDish ? bestDish.name : '—'),
          },
        ].map((kpi) => (
          <Card key={kpi.label} className="h-full">
            <CardContent className="p-5">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20 bg-muted" />
                  <Skeleton className="h-6 w-28 bg-muted" />
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="mt-1 text-base font-semibold text-foreground truncate text-balance">
                    {kpi.value}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─ Filtres ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un plat…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select value={ratingFilter} onValueChange={(v) => setRatingFilter(v as RatingFilter)}>
          <SelectTrigger className="h-8 w-40 text-sm">
            <SelectValue placeholder="Toutes les notes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les notes</SelectItem>
            <SelectItem value="5">⭐ 5 étoiles</SelectItem>
            <SelectItem value="4">⭐ 4 étoiles</SelectItem>
            <SelectItem value="3">⭐ 3 étoiles</SelectItem>
            <SelectItem value="2">⭐ 2 étoiles</SelectItem>
            <SelectItem value="1">⭐ 1 étoile</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="h-8 w-48 text-sm">
            <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="avg_rating_desc">Mieux notés en premier</SelectItem>
            <SelectItem value="avg_rating_asc">Moins bien notés</SelectItem>
            <SelectItem value="review_count_desc">Plus d'avis en premier</SelectItem>
            <SelectItem value="name_asc">Nom A → Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ─ Liste des plats ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <Skeleton className="h-14 w-14 shrink-0 rounded-md bg-muted" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40 bg-muted" />
                    <Skeleton className="h-4 w-24 bg-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {search || ratingFilter !== 'all'
              ? 'Aucun plat ne correspond à vos filtres.'
              : 'Aucun avis reçu pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((dish) => {
            const isExpanded = expandedDish === dish.id;
            const displayedReviews = ratingFilter === 'all'
              ? dish.reviews
              : dish.reviews.filter((r) => r.rating === parseInt(ratingFilter));

            return (
              <Card key={dish.id} className="overflow-hidden">
                {/* ── Ligne du plat ── */}
                <div
                  className="flex cursor-pointer items-center gap-4 p-5 transition-colors hover:bg-muted/30"
                  onClick={() => setExpandedDish(isExpanded ? null : dish.id)}
                >
                  {dish.image_url ? (
                    <img
                      src={dish.image_url}
                      alt={dish.name}
                      className="h-12 w-12 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                      —
                    </div>
                  )}

                  <div className="flex flex-1 min-w-0 items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {dish.name}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <StarRatingDisplay
                          rating={dish.avg_rating}
                          count={dish.review_count}
                          size="xs"
                        />
                        {dish.review_count === 0 && (
                          <span className="text-xs text-muted-foreground/60">Aucun avis</span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      {/* Barre de niveau */}
                      {dish.review_count > 0 && (
                        <div className="hidden items-center gap-1.5 md:flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <div
                              key={s}
                              className={`h-1 w-5 rounded-full transition-colors ${
                                s <= Math.round(dish.avg_rating)
                                  ? 'bg-yellow-400'
                                  : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      {dish.review_count > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground"
                          onClick={() => setExpandedDish(isExpanded ? null : dish.id)}
                        >
                          {isExpanded ? 'Masquer' : 'Voir les avis'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Commentaires dépliés ── */}
                {isExpanded && displayedReviews.length > 0 && (
                  <div className="border-t border-border bg-muted/20">
                    <div className="divide-y divide-border px-5">
                      {displayedReviews.map((review) => {
                        const isEditingReply = replyEditing.has(review.id);
                        const isSaving      = replySaving.has(review.id);
                        const draft         = replyDraft[review.id] ?? '';

                        return (
                          <div key={review.id} className="py-5">
                            {/* ─ En-tête avis ─ */}
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`h-3.5 w-3.5 ${
                                        s <= review.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'fill-none text-muted-foreground/30'
                                      }`}
                                    />
                                  ))}
                                </span>
                                <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                                  {review.rating}/5
                                </Badge>
                              </div>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {format(parseISO(review.created_at), 'd MMM yyyy', { locale: fr })}
                              </span>
                            </div>

                            {/* ─ Commentaire client ─ */}
                            {review.comment && (
                              <p className="mt-2 text-sm text-muted-foreground text-pretty leading-relaxed">
                                {review.comment}
                              </p>
                            )}

                            {/* ─ Réponse existante ─ */}
                            {review.restaurant_reply && !isEditingReply && (
                              <div className="mt-3 rounded-md border border-border bg-background px-4 py-3">
                                <div className="mb-1.5 flex items-center justify-between gap-2">
                                  <span className="text-xs font-medium text-foreground">
                                    Réponse du restaurant
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {review.replied_at
                                      ? format(parseISO(review.replied_at), 'd MMM yyyy', { locale: fr })
                                      : ''}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground text-pretty leading-relaxed">
                                  {review.restaurant_reply}
                                </p>
                                <button
                                  onClick={() => startReply(review)}
                                  className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
                                >
                                  <Pencil className="h-3 w-3" />
                                  Modifier
                                </button>
                              </div>
                            )}

                            {/* ─ Formulaire de réponse ─ */}
                            {isEditingReply ? (
                              <div className="mt-3 space-y-2">
                                <Textarea
                                  value={draft}
                                  onChange={(e) =>
                                    setReplyDraft((prev) => ({ ...prev, [review.id]: e.target.value }))
                                  }
                                  placeholder="Rédigez votre réponse publique…"
                                  className="min-h-[80px] resize-none text-sm"
                                  maxLength={800}
                                  disabled={isSaving}
                                />
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {draft.length}/800
                                  </span>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 gap-1 px-2 text-xs"
                                      onClick={() => cancelReply(review.id)}
                                      disabled={isSaving}
                                    >
                                      <X className="h-3 w-3" />
                                      Annuler
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-7 gap-1 px-3 text-xs"
                                      onClick={() => submitReply(review.id)}
                                      disabled={isSaving}
                                    >
                                      <Check className="h-3 w-3" />
                                      {isSaving ? 'Publication…' : 'Publier'}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              !review.restaurant_reply && (
                                <button
                                  onClick={() => startReply(review)}
                                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-2 hover:underline"
                                >
                                  <Reply className="h-3.5 w-3.5" />
                                  Répondre
                                </button>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isExpanded && displayedReviews.length === 0 && (
                  <div className="border-t border-border bg-muted/20 px-5 py-4">
                    <p className="text-sm text-muted-foreground">
                      Aucun avis avec la note sélectionnée.
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

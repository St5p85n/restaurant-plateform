import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, CheckCircle, Reply } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  menu_item: {
    id: string;
    name: string;
    image_url: string | null;
    description: string | null;
  };
}

interface OrderInfo {
  id: string;
  order_number: string;
  status: string;
  delivery_status: string;
  created_at: string;
  restaurant: { name: string };
  order_items: OrderItem[];
}

interface DishRating {
  menu_item_id: string;
  rating: number;
  comment: string;
}

interface ExistingReview {
  rating: number;
  comment: string | null;
  restaurant_reply: string | null;
  replied_at: string | null;
}

// ─── Composant étoiles ────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hovered, setHovered] = useState(0);
  const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-7 w-7' : 'h-6 w-6';
  const active = hovered || value;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={readonly ? 'cursor-default' : 'cursor-pointer transition-transform hover:scale-110'}
        >
          <Star
            className={`${sizeClass} transition-colors ${
              star <= active
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-muted-foreground/40'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ReviewOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState<Set<string>>(new Set());
  const [existingReviews, setExistingReviews] = useState<Record<string, ExistingReview>>({});
  const [ratings, setRatings] = useState<Record<string, DishRating>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('orders')
        .select(`
          id, order_number, status, delivery_status, created_at,
          restaurant:restaurants(name),
          order_items(
            id, menu_item_id, quantity, unit_price,
            menu_item:menu_items(id, name, image_url, description)
          )
        `)
        .eq('id', orderId!)
        .maybeSingle();

      if (err) throw err;
      if (!data) { setError('Commande introuvable.'); setLoading(false); return; }

      // Vérifier que la commande est bien livrée/terminée
      const isDelivered =
        data.delivery_status === 'delivered' ||
        data.status === 'served' ||
        data.status === 'completed' ||
        data.status === 'paid';

      if (!isDelivered) {
        setError("Cette commande n'est pas encore livrée. L'évaluation sera disponible après réception.");
        setLoading(false);
        return;
      }

      setOrder(data as unknown as OrderInfo);

      // Vérifier les plats déjà évalués
      if (user) {
        const menuItemIds = (data.order_items ?? []).map((i: any) => i.menu_item_id);
        if (menuItemIds.length > 0) {
          const { data: existing } = await supabase
            .from('reviews')
            .select('menu_item_id, rating, comment, restaurant_reply, replied_at')
            .eq('order_id', orderId!)
            .in('menu_item_id', menuItemIds);

          const reviewedIds = new Set((existing ?? []).map((r: any) => r.menu_item_id));
          setAlreadyReviewed(reviewedIds);

          // Stocker les données des avis existants (pour afficher les réponses)
          const existingMap: Record<string, ExistingReview> = {};
          (existing ?? []).forEach((r: any) => {
            existingMap[r.menu_item_id] = {
              rating:           r.rating,
              comment:          r.comment,
              restaurant_reply: r.restaurant_reply,
              replied_at:       r.replied_at,
            };
          });
          setExistingReviews(existingMap);

          if (reviewedIds.size === menuItemIds.length) setSubmitted(true);
        }
      }

      // Initialiser les ratings
      const init: Record<string, DishRating> = {};
      (data.order_items ?? []).forEach((item: any) => {
        init[item.menu_item_id] = { menu_item_id: item.menu_item_id, rating: 0, comment: '' };
      });
      setRatings(init);
    } catch {
      setError('Erreur lors du chargement de la commande.');
    } finally {
      setLoading(false);
    }
  };

  const setRating = (menuItemId: string, value: number) => {
    setRatings((prev) => ({ ...prev, [menuItemId]: { ...prev[menuItemId], rating: value } }));
  };

  const setComment = (menuItemId: string, value: string) => {
    setRatings((prev) => ({ ...prev, [menuItemId]: { ...prev[menuItemId], comment: value } }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour soumettre une évaluation.');
      return;
    }

    const toSubmit = Object.values(ratings).filter(
      (r) => r.rating > 0 && !alreadyReviewed.has(r.menu_item_id)
    );

    if (toSubmit.length === 0) {
      toast.error('Veuillez attribuer une note à au moins un plat.');
      return;
    }

    setSubmitting(true);
    try {
      const rows = toSubmit.map((r) => ({
        order_id:     orderId!,
        menu_item_id: r.menu_item_id,
        customer_id:  user.id,
        rating:       r.rating,
        comment:      r.comment.trim() || null,
      }));

      const { error: err } = await supabase.from('reviews').insert(rows);
      if (err) throw err;

      toast.success('Merci pour vos évaluations !');
      setSubmitted(true);
    } catch {
      toast.error("Erreur lors de l'envoi des évaluations. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Rendu ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background font-montserrat">
        <div className="mx-auto max-w-xl px-4 py-12">
          <Skeleton className="mb-8 h-6 w-48 bg-muted" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-6 space-y-3 border-b border-border pb-6">
              <Skeleton className="h-5 w-36 bg-muted" />
              <Skeleton className="h-8 w-32 bg-muted" />
              <Skeleton className="h-20 w-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 font-montserrat">
        <p className="text-center text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-4 font-montserrat">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <CheckCircle className="h-7 w-7 text-foreground" />
        </div>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-foreground">Merci pour vos avis !</h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            Vos évaluations aident d'autres clients à choisir les meilleurs plats.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </div>
    );
  }

  const items = order?.order_items ?? [];
  const pendingCount = Object.values(ratings).filter(
    (r) => r.rating > 0 && !alreadyReviewed.has(r.menu_item_id)
  ).length;

  return (
    <div className="min-h-screen bg-background font-montserrat">
      <div className="mx-auto max-w-xl px-4 py-10 md:py-14">

        {/* ─ En-tête ─────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" className="mb-6 -ml-2 gap-1.5 text-sm text-muted-foreground" asChild>
            <Link to={`/order/${orderId}`}>
              <ArrowLeft className="h-4 w-4" />
              Retour au suivi
            </Link>
          </Button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground text-balance">
                Évaluer les plats
              </h1>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">
                {order?.restaurant.name} · Commande {order?.order_number}
              </p>
              {order?.created_at && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {format(parseISO(order.created_at), 'd MMMM yyyy', { locale: fr })}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {items.length} plat{items.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* ─ Liste des plats ──────────────────────────────────────────────── */}
        <div className="space-y-0 divide-y divide-border">
          {items.map((item) => {
            const mid = item.menu_item_id;
            const alreadyDone = alreadyReviewed.has(mid);
            const r = ratings[mid] ?? { rating: 0, comment: '' };
            const existing = existingReviews[mid];

            return (
              <div key={item.id} className="py-7 first:pt-0">
                <div className="flex items-start gap-4">
                  {/* Image */}
                  {item.menu_item?.image_url ? (
                    <img
                      src={item.menu_item.image_url}
                      alt={item.menu_item.name}
                      className="h-14 w-14 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                      —
                    </div>
                  )}

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.menu_item?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                      </div>
                      {alreadyDone && (
                        <Badge variant="outline" className="shrink-0 text-xs text-muted-foreground">
                          Évalué
                        </Badge>
                      )}
                    </div>

                    {/* Étoiles */}
                    <div className="mt-3">
                      <StarRating
                        value={alreadyDone ? (existing?.rating ?? 0) : r.rating}
                        onChange={alreadyDone ? undefined : (v) => setRating(mid, v)}
                        readonly={alreadyDone}
                        size="md"
                      />
                      {!alreadyDone && r.rating > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {['', 'Mauvais', 'Passable', 'Bien', 'Très bien', 'Excellent'][r.rating]}
                        </p>
                      )}
                    </div>

                    {/* Commentaire soumis (lecture seule) */}
                    {alreadyDone && existing?.comment && (
                      <p className="mt-2 text-sm text-muted-foreground text-pretty leading-relaxed">
                        {existing.comment}
                      </p>
                    )}

                    {/* Commentaire en cours de saisie */}
                    {!alreadyDone && r.rating > 0 && (
                      <div className="mt-3">
                        <Textarea
                          placeholder="Commentaire optionnel…"
                          value={r.comment}
                          onChange={(e) => setComment(mid, e.target.value)}
                          className="min-h-[72px] resize-none text-sm"
                          maxLength={500}
                        />
                        {r.comment.length > 0 && (
                          <p className="mt-1 text-right text-xs text-muted-foreground">
                            {r.comment.length}/500
                          </p>
                        )}
                      </div>
                    )}

                    {/* Réponse du restaurant */}
                    {alreadyDone && existing?.restaurant_reply && (
                      <div className="mt-3 rounded-md border border-border bg-muted/30 px-4 py-3">
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <Reply className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="text-xs font-medium text-foreground">
                            Réponse du restaurant
                          </span>
                          {existing.replied_at && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              {format(parseISO(existing.replied_at), 'd MMM yyyy', { locale: fr })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground text-pretty leading-relaxed">
                          {existing.restaurant_reply}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─ Bouton soumettre ─────────────────────────────────────────────── */}
        {items.some((i) => !alreadyReviewed.has(i.menu_item_id)) && (
          <div className="mt-8 border-t border-border pt-6">
            {!user && (
              <p className="mb-3 text-sm text-muted-foreground">
                Vous devez être{' '}
                <Link to="/login" className="underline underline-offset-2">
                  connecté
                </Link>{' '}
                pour soumettre une évaluation.
              </p>
            )}
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={submitting || pendingCount === 0 || !user}
            >
              {submitting
                ? 'Envoi en cours…'
                : pendingCount > 0
                  ? `Envoyer ${pendingCount} évaluation${pendingCount > 1 ? 's' : ''}`
                  : 'Sélectionnez au moins une note'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

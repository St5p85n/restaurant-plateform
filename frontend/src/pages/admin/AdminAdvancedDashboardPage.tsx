import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import {
  AreaChart, Area, BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  TrendingUp, ShoppingBag, Store, CreditCard,
  Medal, CalendarDays, FileDown, BarChart2, Star, Hash,
} from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfQuarter, endOfQuarter,
  startOfYear, endOfYear, subMonths, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ─── Types ────────────────────────────────────────────────────────────────────

type PeriodKey = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface PeriodRange { from: Date; to: Date }

interface MonthRevenue {
  mois: string;
  revenus: number;
  commandes: number;
}

interface MonthRating {
  mois: string;
  note: number | null;     // moyenne des notes (null = aucun avis)
  avis: number;            // nombre d'avis
}

interface RestaurantRank {
  id: string;
  name: string;
  cuisine_type: string | null;
  rating: number;
  total_reviews: number;
  order_count: number;
  revenue: number;
  logo_url: string | null;
}

interface TopDish {
  menu_item_id: string;
  name: string;
  restaurant_name: string;
  quantity_sold: number;
  total_revenue: number;
  unit_price: number;
}

interface KpiData {
  total_revenue: number;
  total_orders: number;
  active_restaurants: number;
  avg_order: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPeriodRange(key: PeriodKey, custom?: DateRange): PeriodRange {
  const now = new Date();
  switch (key) {
    case 'today':   return { from: startOfDay(now), to: endOfDay(now) };
    case 'week':    return { from: startOfWeek(now, { locale: fr }), to: endOfWeek(now, { locale: fr }) };
    case 'month':   return { from: startOfMonth(now), to: endOfMonth(now) };
    case 'quarter': return { from: startOfQuarter(now), to: endOfQuarter(now) };
    case 'year':    return { from: startOfYear(now), to: endOfYear(now) };
    case 'custom':
      return {
        from: custom?.from ? startOfDay(custom.from) : startOfMonth(now),
        to:   custom?.to   ? endOfDay(custom.to)     : endOfMonth(now),
      };
  }
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' FCFA';
}

const MEDALS = ['🥇', '🥈', '🥉'];

// ─── Composant KPI Card ───────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, loading,
}: { label: string; value: string; sub?: string; icon: React.ElementType; loading: boolean }) {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-24 bg-muted" />
            <Skeleton className="h-8 w-32 bg-muted" />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-foreground text-balance">{value}</p>
              {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
            </div>
            <div className="shrink-0 rounded-md bg-muted p-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Composant Filtre Période ─────────────────────────────────────────────────

const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: 'today',   label: "Aujourd'hui" },
  { value: 'week',    label: 'Cette semaine' },
  { value: 'month',   label: 'Ce mois' },
  { value: 'quarter', label: 'Ce trimestre' },
  { value: 'year',    label: 'Cette année' },
  { value: 'custom',  label: 'Personnalisé' },
];

interface PeriodFilterProps {
  period: PeriodKey;
  customRange: DateRange | undefined;
  onPeriodChange: (p: PeriodKey) => void;
  onCustomChange: (r: DateRange | undefined) => void;
}

function PeriodFilter({ period, customRange, onPeriodChange, onCustomChange }: PeriodFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CalendarDays className="h-4 w-4" />
        <span>Période :</span>
      </div>
      <Select value={period} onValueChange={(v) => onPeriodChange(v as PeriodKey)}>
        <SelectTrigger className="h-8 w-44 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {period === 'custom' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-sm">
              {customRange?.from
                ? customRange.to
                  ? `${format(customRange.from, 'dd/MM/yy')} – ${format(customRange.to, 'dd/MM/yy')}`
                  : format(customRange.from, 'dd/MM/yyyy')
                : 'Choisir les dates'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={customRange}
              onSelect={onCustomChange}
              locale={fr}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AdminAdvancedDashboardPage() {
  const reportRef = useRef<HTMLDivElement>(null);

  const [period, setPeriod] = useState<PeriodKey>('month');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  const [loadingKpi, setLoadingKpi]         = useState(true);
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [loadingRanks, setLoadingRanks]     = useState(true);
  const [loadingDishes, setLoadingDishes]   = useState(true);
  const [loadingRatings, setLoadingRatings] = useState(true);
  const [exporting, setExporting]           = useState(false);

  const [kpi, setKpi]                   = useState<KpiData | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthRevenue[]>([]);
  const [monthlyRatings, setMonthlyRatings] = useState<MonthRating[]>([]);
  const [restaurants, setRestaurants]   = useState<RestaurantRank[]>([]);
  const [topDishes, setTopDishes]       = useState<TopDish[]>([]);
  const [dishRestaurantFilter, setDishRestaurantFilter] = useState<string>('all');
  const [ratingsRestaurantFilter, setRatingsRestaurantFilter] = useState<string>('all');

  // Calcul de la plage active
  const range = period === 'custom' && customRange?.from
    ? getPeriodRange('custom', customRange)
    : getPeriodRange(period);

  const fromIso = range.from.toISOString();
  const toIso   = range.to.toISOString();

  // ── Chargement KPI ──────────────────────────────────────────────────────────
  const loadKpi = useCallback(async () => {
    setLoadingKpi(true);
    try {
      const [ordersRes, restaurantsRes] = await Promise.all([
        supabase.from('orders')
          .select('total')
          .gte('created_at', fromIso)
          .lte('created_at', toIso),
        supabase.from('restaurants')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
      ]);

      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const totalRevenue = orders.reduce((s, o) => s + (o.total ?? 0), 0);
      const totalOrders  = orders.length;
      const avgOrder     = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setKpi({
        total_revenue:       totalRevenue,
        total_orders:        totalOrders,
        active_restaurants:  restaurantsRes.count ?? 0,
        avg_order:           avgOrder,
      });
    } catch {
      toast.error('Erreur lors du chargement des KPIs');
    } finally {
      setLoadingKpi(false);
    }
  }, [fromIso, toIso]);

  // ── Chargement revenus mensuels ─────────────────────────────────────────────
  const loadMonthlyRevenue = useCallback(async () => {
    setLoadingRevenue(true);
    try {
      // Toujours afficher les 12 derniers mois indépendamment du filtre
      const start12 = startOfMonth(subMonths(new Date(), 11)).toISOString();
      const end12   = endOfMonth(new Date()).toISOString();

      const { data, error } = await supabase
        .from('orders')
        .select('total, created_at')
        .gte('created_at', start12)
        .lte('created_at', end12)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Grouper par mois
      const byMonth: Record<string, { revenus: number; commandes: number }> = {};
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const key = format(d, 'MMM yyyy', { locale: fr });
        byMonth[key] = { revenus: 0, commandes: 0 };
      }

      (data ?? []).forEach((o) => {
        const key = format(parseISO(o.created_at), 'MMM yyyy', { locale: fr });
        if (byMonth[key]) {
          byMonth[key].revenus   += o.total ?? 0;
          byMonth[key].commandes += 1;
        }
      });

      setMonthlyRevenue(
        Object.entries(byMonth).map(([mois, v]) => ({ mois, ...v }))
      );
    } catch {
      toast.error('Erreur lors du chargement des revenus');
    } finally {
      setLoadingRevenue(false);
    }
  }, []);

  // ── Chargement classements restaurants ─────────────────────────────────────
  const loadRankings = useCallback(async () => {
    setLoadingRanks(true);
    try {
      const [ordersRes, restaurantsRes] = await Promise.all([
        supabase.from('orders')
          .select('restaurant_id, total')
          .gte('created_at', fromIso)
          .lte('created_at', toIso),
        supabase.from('restaurants')
          .select('id, name, cuisine_type, rating, total_reviews, logo_url')
          .eq('is_active', true),
      ]);

      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const rests  = Array.isArray(restaurantsRes.data) ? restaurantsRes.data : [];

      // Agréger commandes + revenus par restaurant
      const agg: Record<string, { order_count: number; revenue: number }> = {};
      orders.forEach((o) => {
        if (!o.restaurant_id) return;
        if (!agg[o.restaurant_id]) agg[o.restaurant_id] = { order_count: 0, revenue: 0 };
        agg[o.restaurant_id].order_count += 1;
        agg[o.restaurant_id].revenue     += o.total ?? 0;
      });

      const ranked: RestaurantRank[] = rests.map((r) => ({
        id:           r.id,
        name:         r.name,
        cuisine_type: r.cuisine_type,
        rating:       r.rating ?? 0,
        total_reviews: r.total_reviews ?? 0,
        logo_url:     r.logo_url,
        order_count:  agg[r.id]?.order_count ?? 0,
        revenue:      agg[r.id]?.revenue     ?? 0,
      }));

      setRestaurants(ranked);
    } catch {
      toast.error('Erreur lors du chargement des classements');
    } finally {
      setLoadingRanks(false);
    }
  }, [fromIso, toIso]);

  // ── Chargement top plats ────────────────────────────────────────────────────
  const loadTopDishes = useCallback(async () => {
    setLoadingDishes(true);
    try {
      // 1. Récupérer les order_ids dans la période
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id')
        .gte('created_at', fromIso)
        .lte('created_at', toIso);

      const orderIds = (ordersData ?? []).map((o) => o.id);
      if (orderIds.length === 0) { setTopDishes([]); setLoadingDishes(false); return; }

      // 2. Récupérer les order_items avec menu_item_id
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('menu_item_id, quantity, unit_price')
        .in('order_id', orderIds.slice(0, 500));  // limite de sécurité

      // 3. Récupérer tous les menu_items + restaurant name
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('id, name, price, restaurant_id, restaurants!inner(name)');

      const menuMap: Record<string, { name: string; restaurant_name: string; price: number }> = {};
      (menuData ?? []).forEach((m: any) => {
        menuMap[m.id] = {
          name:            m.name,
          restaurant_name: m.restaurants?.name ?? 'Inconnu',
          price:           m.price ?? 0,
        };
      });

      // 4. Agréger par menu_item_id
      const agg: Record<string, { qty: number; revenue: number }> = {};
      (itemsData ?? []).forEach((item) => {
        if (!item.menu_item_id) return;
        if (!agg[item.menu_item_id]) agg[item.menu_item_id] = { qty: 0, revenue: 0 };
        agg[item.menu_item_id].qty     += item.quantity ?? 0;
        agg[item.menu_item_id].revenue += (item.unit_price ?? 0) * (item.quantity ?? 0);
      });

      const dishes: TopDish[] = Object.entries(agg)
        .map(([id, v]) => ({
          menu_item_id:   id,
          name:           menuMap[id]?.name ?? 'Inconnu',
          restaurant_name: menuMap[id]?.restaurant_name ?? 'Inconnu',
          quantity_sold:  v.qty,
          total_revenue:  v.revenue,
          unit_price:     menuMap[id]?.price ?? 0,
        }))
        .sort((a, b) => b.quantity_sold - a.quantity_sold)
        .slice(0, 20);

      setTopDishes(dishes);
    } catch {
      toast.error('Erreur lors du chargement des plats');
    } finally {
      setLoadingDishes(false);
    }
  }, [fromIso, toIso]);

  useEffect(() => {
    loadKpi();
    loadRankings();
    loadTopDishes();
  }, [loadKpi, loadRankings, loadTopDishes]);

  useEffect(() => {
    loadMonthlyRevenue();
  }, [loadMonthlyRevenue]);

  // ── Chargement notes moyennes mensuelles ────────────────────────────────────
  const loadMonthlyRatings = useCallback(async () => {
    setLoadingRatings(true);
    try {
      // 12 derniers mois — indépendant du filtre de période pour montrer la tendance long terme
      const start12 = startOfMonth(subMonths(new Date(), 11)).toISOString();
      const end12   = endOfMonth(new Date()).toISOString();

      // Joindre menu_items pour pouvoir filtrer par restaurant
      let query = supabase
        .from('reviews')
        .select('rating, created_at, menu_item:menu_items!menu_item_id(restaurant_id)')
        .gte('created_at', start12)
        .lte('created_at', end12)
        .order('created_at', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      // Initialiser les 12 mois
      const byMonth: Record<string, { sum: number; count: number }> = {};
      for (let i = 11; i >= 0; i--) {
        const key = format(subMonths(new Date(), i), 'MMM yyyy', { locale: fr });
        byMonth[key] = { sum: 0, count: 0 };
      }

      (data ?? []).forEach((r: any) => {
        // Appliquer le filtre restaurant si nécessaire
        if (
          ratingsRestaurantFilter !== 'all' &&
          r.menu_item?.restaurant_id !== ratingsRestaurantFilter
        ) return;

        const key = format(parseISO(r.created_at), 'MMM yyyy', { locale: fr });
        if (byMonth[key]) {
          byMonth[key].sum   += r.rating;
          byMonth[key].count += 1;
        }
      });

      setMonthlyRatings(
        Object.entries(byMonth).map(([mois, v]) => ({
          mois,
          note:  v.count > 0 ? parseFloat((v.sum / v.count).toFixed(2)) : null,
          avis:  v.count,
        }))
      );
    } catch {
      toast.error('Erreur lors du chargement des notes mensuelles');
    } finally {
      setLoadingRatings(false);
    }
  }, [ratingsRestaurantFilter]);

  useEffect(() => {
    loadMonthlyRatings();
  }, [loadMonthlyRatings]);

  // ── Export PDF ──────────────────────────────────────────────────────────────
  const exportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const el = reportRef.current;
      const canvas = await html2canvas(el, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageWidth  = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin     = 10;
      const headerH    = 14;
      const usableW    = pageWidth - margin * 2;
      const usableH    = pageHeight - headerH - margin * 2;

      // Ratio px/mm
      const pxPerMm = canvas.width / usableW;
      const slicePx = Math.floor(usableH * pxPerMm);
      const totalSlices = Math.ceil(canvas.height / slicePx);

      const addHeader = (p: number) => {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(0, 0, pageWidth, headerH, 'F');
        pdf.setFontSize(9);
        pdf.setTextColor(107, 114, 128);
        pdf.text('KobeTii — Tableau de bord analytique avancé', margin, 9);
        pdf.text(
          `Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm')} — Page ${p + 1} / ${totalSlices}`,
          pageWidth - margin, 9, { align: 'right' }
        );
        pdf.setDrawColor(229, 231, 235);
        pdf.line(0, headerH, pageWidth, headerH);
      };

      for (let i = 0; i < totalSlices; i++) {
        if (i > 0) pdf.addPage();
        addHeader(i);

        const srcY   = i * slicePx;
        const srcH   = Math.min(slicePx, canvas.height - srcY);
        const dstH   = srcH / pxPerMm;

        // Découper la portion du canvas dans un canvas temporaire
        const tmp    = document.createElement('canvas');
        tmp.width    = canvas.width;
        tmp.height   = srcH;
        const ctx    = tmp.getContext('2d')!;
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

        pdf.addImage(
          tmp.toDataURL('image/png'), 'PNG',
          margin, headerH + margin,
          usableW, dstH,
          undefined, 'FAST'
        );
      }

      const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? 'rapport';
      pdf.save(`kobetii-rapport-${periodLabel.toLowerCase().replace(/\s/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Rapport PDF exporté avec succès');
    } catch {
      toast.error("Erreur lors de l'export PDF");
    } finally {
      setExporting(false);
    }
  };

  // ── Données triées ──────────────────────────────────────────────────────────
  const byRating  = [...restaurants].sort((a, b) => b.rating  - a.rating  || b.total_reviews - a.total_reviews).slice(0, 10);
  const byOrders  = [...restaurants].sort((a, b) => b.order_count - a.order_count).slice(0, 10);
  const byRevenue = [...restaurants].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  const uniqueRestaurants = [...new Set(topDishes.map((d) => d.restaurant_name))];
  const filteredDishes = dishRestaurantFilter === 'all'
    ? topDishes
    : topDishes.filter((d) => d.restaurant_name === dishRestaurantFilter);

  const isLoading = loadingKpi || loadingRevenue || loadingRanks || loadingDishes;

  // ── Tooltip personnalisé ─────────────────────────────────────────────────────
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-border bg-background p-3 text-sm shadow-sm">
        <p className="mb-1.5 font-medium text-foreground">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.dataKey} className="text-muted-foreground">
            {entry.name} :{' '}
            <span className="font-medium text-foreground">
              {entry.dataKey === 'revenus' ? fmt(entry.value) : entry.value}
            </span>
          </p>
        ))}
      </div>
    );
  };

  // ── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ─ En-tête ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground text-balance">
            Analytique avancée
          </h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            Classements, revenus et statistiques de la plateforme
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PeriodFilter
            period={period}
            customRange={customRange}
            onPeriodChange={setPeriod}
            onCustomChange={setCustomRange}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-sm"
            onClick={exportPDF}
            disabled={exporting || isLoading}
          >
            <FileDown className="h-4 w-4" />
            {exporting ? 'Export…' : 'Exporter PDF'}
          </Button>
        </div>
      </div>

      {/* ─ Zone capturée pour le PDF ─────────────────────────────────────── */}
      <div ref={reportRef} className="space-y-8 bg-background">

        {/* ─ KPIs ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard
            label="Revenus"
            value={kpi ? fmt(kpi.total_revenue) : '—'}
            sub={PERIOD_OPTIONS.find((o) => o.value === period)?.label}
            icon={CreditCard}
            loading={loadingKpi}
          />
          <KpiCard
            label="Commandes"
            value={kpi ? kpi.total_orders.toLocaleString('fr-FR') : '—'}
            sub="sur la période"
            icon={ShoppingBag}
            loading={loadingKpi}
          />
          <KpiCard
            label="Restaurants actifs"
            value={kpi ? kpi.active_restaurants.toLocaleString('fr-FR') : '—'}
            sub="sur la plateforme"
            icon={Store}
            loading={loadingKpi}
          />
          <KpiCard
            label="Panier moyen"
            value={kpi ? fmt(kpi.avg_order) : '—'}
            sub="par commande"
            icon={TrendingUp}
            loading={loadingKpi}
          />
        </div>

        {/* ─ Graphiques revenus ────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-base font-semibold text-balance">
                Revenus mensuels — 12 derniers mois
              </CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
                Évolution des revenus et du volume de commandes
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                size="sm"
                variant={chartType === 'area' ? 'default' : 'ghost'}
                className="h-8 px-3 text-xs"
                onClick={() => setChartType('area')}
              >
                <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                Courbe
              </Button>
              <Button
                size="sm"
                variant={chartType === 'bar' ? 'default' : 'ghost'}
                className="h-8 px-3 text-xs"
                onClick={() => setChartType('bar')}
              >
                <BarChart2 className="mr-1.5 h-3.5 w-3.5" />
                Barres
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingRevenue ? (
              <Skeleton className="h-56 w-full bg-muted" />
            ) : monthlyRevenue.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                Aucune donnée disponible
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                {chartType === 'area' ? (
                  <AreaChart data={monthlyRevenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradCmd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="hsl(var(--chart-3))" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="mois" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="rev" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <YAxis yAxisId="cmd" orientation="right" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                    <Area yAxisId="rev" type="monotone" dataKey="revenus" name="Revenus" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gradRev)" dot={false} activeDot={{ r: 4 }} />
                    <Area yAxisId="cmd" type="monotone" dataKey="commandes" name="Commandes" stroke="hsl(var(--chart-3))" strokeWidth={2} fill="url(#gradCmd)" dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                ) : (
                  <BarChart data={monthlyRevenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                    <XAxis dataKey="mois" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="rev" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <YAxis yAxisId="cmd" orientation="right" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                    <Bar yAxisId="rev" dataKey="revenus" name="Revenus" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={32} />
                    <Bar yAxisId="cmd" dataKey="commandes" name="Commandes" fill="hsl(var(--chart-3))" radius={[3, 3, 0, 0]} maxBarSize={32} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ─ Graphique évolution notes moyennes ───────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold text-balance">
                  Évolution des notes moyennes — 12 derniers mois
                </CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground text-pretty">
                  {ratingsRestaurantFilter === 'all'
                    ? 'Note moyenne des plats évalués par les clients sur la plateforme'
                    : `Note moyenne — ${restaurants.find((r) => r.id === ratingsRestaurantFilter)?.name ?? 'restaurant sélectionné'}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* ── Filtre restaurant ── */}
                <Select
                  value={ratingsRestaurantFilter}
                  onValueChange={(v) => setRatingsRestaurantFilter(v)}
                >
                  <SelectTrigger className="h-8 w-48 text-xs">
                    <SelectValue placeholder="Tous les restaurants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les restaurants</SelectItem>
                    {[...restaurants]
                      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
                      .map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {/* ── KPIs synthétiques ── */}
                {!loadingRatings && monthlyRatings.length > 0 && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      Moy. :{' '}
                      <span className="font-medium text-foreground">
                        {(() => {
                          const pts = monthlyRatings.filter((m) => m.note !== null);
                          return pts.length > 0
                            ? (pts.reduce((s, m) => s + (m.note ?? 0), 0) / pts.length).toFixed(2)
                            : '—';
                        })()}
                        {' '}/ 5
                      </span>
                    </span>
                    <span>
                      Avis :{' '}
                      <span className="font-medium text-foreground">
                        {monthlyRatings.reduce((s, m) => s + m.avis, 0).toLocaleString('fr-FR')}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingRatings ? (
              <Skeleton className="h-56 w-full bg-muted" />
            ) : monthlyRatings.every((m) => m.note === null) ? (
              <div className="flex h-56 flex-col items-center justify-center gap-2 text-center">
                <Star className="h-6 w-6 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Aucun avis enregistré pour le moment.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <LineChart
                  data={monthlyRatings}
                  margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradRating" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--chart-4))" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  {/* Lignes de référence discrètes à 3, 4 et 5 */}
                  <XAxis
                    dataKey="mois"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}★`}
                  />
                  <YAxis
                    yAxisId="avis"
                    orientation="right"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v} avis`}
                    width={56}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const note = payload.find((p) => p.dataKey === 'note');
                      const avis = payload.find((p) => p.dataKey === 'avis');
                      return (
                        <div className="rounded-md border border-border bg-background px-3 py-2 shadow-sm text-xs">
                          <p className="mb-1 font-medium text-foreground">{label}</p>
                          {note?.value != null && (
                            <p className="text-muted-foreground">
                              Note moyenne :{' '}
                              <span className="font-medium text-foreground">
                                {Number(note.value).toFixed(2)} / 5
                              </span>
                            </p>
                          )}
                          {avis?.value != null && (
                            <p className="text-muted-foreground">
                              Avis :{' '}
                              <span className="font-medium text-foreground">
                                {Number(avis.value).toLocaleString('fr-FR')}
                              </span>
                            </p>
                          )}
                          {note?.value == null && (
                            <p className="text-muted-foreground/60 italic">Aucun avis ce mois</p>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                    formatter={(value) =>
                      value === 'note' ? 'Note moyenne (/ 5)' : 'Nombre d\'avis'
                    }
                  />
                  {/* Note moyenne — ligne principale */}
                  <Line
                    type="monotone"
                    dataKey="note"
                    name="note"
                    stroke="hsl(var(--chart-4))"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: 'hsl(var(--chart-4))', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                  />
                  {/* Nb d'avis — ligne secondaire discrète */}
                  <Line
                    yAxisId="avis"
                    type="monotone"
                    dataKey="avis"
                    name="avis"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    dot={false}
                    activeDot={{ r: 3 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ─ Classements restaurants ───────────────────────────────────────── */}
        <div>
          <h2 className="mb-4 text-base font-semibold text-foreground text-balance">
            Classement des restaurants
          </h2>
          <Tabs defaultValue="revenue">
            <TabsList className="mb-4 h-9">
              <TabsTrigger value="revenue"  className="gap-1.5 text-xs"><CreditCard className="h-3.5 w-3.5" />Par revenus</TabsTrigger>
              <TabsTrigger value="orders"   className="gap-1.5 text-xs"><Hash        className="h-3.5 w-3.5" />Par commandes</TabsTrigger>
              <TabsTrigger value="rating"   className="gap-1.5 text-xs"><Star        className="h-3.5 w-3.5" />Par note</TabsTrigger>
            </TabsList>

            {/* ── Revenus ── */}
            <TabsContent value="revenue">
              <RankingTable
                rows={byRevenue}
                loading={loadingRanks}
                valueKey="revenue"
                valueLabel="Revenus"
                valueFormat={(v) => fmt(v)}
              />
            </TabsContent>

            {/* ── Commandes ── */}
            <TabsContent value="orders">
              <RankingTable
                rows={byOrders}
                loading={loadingRanks}
                valueKey="order_count"
                valueLabel="Commandes"
                valueFormat={(v) => v.toLocaleString('fr-FR')}
              />
            </TabsContent>

            {/* ── Note ── */}
            <TabsContent value="rating">
              <RankingTable
                rows={byRating}
                loading={loadingRanks}
                valueKey="rating"
                valueLabel="Note"
                valueFormat={(v) => `${v.toFixed(1)} / 5`}
                extraCol={(r) => (
                  <span className="text-xs text-muted-foreground">{r.total_reviews} avis</span>
                )}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* ─ Top plats ─────────────────────────────────────────────────────── */}
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground text-balance">
              Top des plats les plus vendus
            </h2>
            <Select value={dishRestaurantFilter} onValueChange={setDishRestaurantFilter}>
              <SelectTrigger className="h-8 w-56 text-sm">
                <SelectValue placeholder="Tous les restaurants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les restaurants</SelectItem>
                {uniqueRestaurants.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="border-b border-border">
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">#</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Plat</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Restaurant</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-muted-foreground">Vendus</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-muted-foreground">Prix unit.</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-muted-foreground">CA généré</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingDishes ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-full bg-muted" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filteredDishes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        Aucun plat vendu sur cette période
                      </td>
                    </tr>
                  ) : (
                    filteredDishes.map((dish, i) => (
                      <tr
                        key={dish.menu_item_id}
                        className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                      >
                        <td className="whitespace-nowrap px-4 py-3">
                          {i < 3
                            ? <span className="text-base">{MEDALS[i]}</span>
                            : <span className="text-sm text-muted-foreground">{i + 1}</span>
                          }
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
                          {dish.name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <Badge variant="secondary" className="text-xs font-normal">
                            {dish.restaurant_name}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-foreground">
                          {dish.quantity_sold.toLocaleString('fr-FR')}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-muted-foreground">
                          {dish.unit_price.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-foreground">
                          {fmt(dish.total_revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

      </div>{/* fin reportRef */}
    </div>
  );
}

// ─── Sous-composant tableau classement ───────────────────────────────────────

interface RankingTableProps {
  rows: RestaurantRank[];
  loading: boolean;
  valueKey: keyof RestaurantRank;
  valueLabel: string;
  valueFormat: (v: number) => string;
  extraCol?: (r: RestaurantRank) => React.ReactNode;
}

function RankingTable({ rows, loading, valueKey, valueLabel, valueFormat, extraCol }: RankingTableProps) {
  const maxVal = rows.length > 0 ? (rows[0][valueKey] as number) : 1;

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr className="border-b border-border">
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">#</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Restaurant</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Cuisine</th>
              <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-muted-foreground">{valueLabel}</th>
              {extraCol && <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-muted-foreground">Détail</th>}
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">Progression</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {Array.from({ length: extraCol ? 6 : 5 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full bg-muted" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={extraCol ? 6 : 5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Aucune donnée disponible pour cette période
                </td>
              </tr>
            ) : (
              rows.map((r, i) => {
                const val = r[valueKey] as number;
                const pct = maxVal > 0 ? Math.round((val / maxVal) * 100) : 0;
                return (
                  <tr key={r.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/40">
                    <td className="whitespace-nowrap px-4 py-3">
                      {i < 3
                        ? <span className="text-base">{MEDALS[i]}</span>
                        : <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">{i + 1}</span>
                      }
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        {r.logo_url ? (
                          <img src={r.logo_url} alt={r.name} className="h-7 w-7 shrink-0 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                            <Medal className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        )}
                        <span className="max-w-[160px] truncate text-sm font-medium text-foreground">{r.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {r.cuisine_type
                        ? <Badge variant="secondary" className="text-xs font-normal">{r.cuisine_type}</Badge>
                        : <span className="text-xs text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-foreground">
                      {valueFormat(val)}
                    </td>
                    {extraCol && (
                      <td className="whitespace-nowrap px-4 py-3 text-right">{extraCol(r)}</td>
                    )}
                    <td className="min-w-[120px] whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-full max-w-[100px] overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs text-muted-foreground">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

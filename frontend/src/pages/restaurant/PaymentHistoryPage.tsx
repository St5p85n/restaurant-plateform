import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Download,
  Search,
  TrendingUp,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  FileText,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { generateReceiptPDF, type ReceiptTransaction, type ReceiptOrderItem, type ReceiptRestaurant } from '@/utils/generateReceipt';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TransactionRow {
  id: string;
  order_number: string;
  order_type: string | null;
  created_at: string;
  paid_at: string | null;
  customer_name: string | null;
  customer_email: string | null;
  total: number;
  subtotal: number;
  tax: number;
  payment_method: string | null;
  payment_status: string;
  transaction_id: string | null;
  phone_number: string | null;
}

type Period = '7d' | '30d' | '90d' | 'all';
type MethodFilter = 'all' | 'card' | 'wave' | 'orange_money' | 'cash';
type StatusFilter = 'all' | 'paid' | 'unpaid' | 'pending' | 'failed';

const PAGE_SIZE = 15;

// ─── Helpers ────────────────────────────────────────────────────────────────

const METHOD_LABEL: Record<string, string> = {
  card: 'Carte',
  wave: 'Wave',
  orange_money: 'Orange Money',
  cash: 'Espèces',
};

const METHOD_ICON: Record<string, React.ReactNode> = {
  card: <CreditCard className="h-3.5 w-3.5" />,
  wave: <Smartphone className="h-3.5 w-3.5" />,
  orange_money: <Smartphone className="h-3.5 w-3.5" />,
  cash: <Banknote className="h-3.5 w-3.5" />,
};

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  paid: {
    label: 'Payé',
    className: 'text-green-700 bg-green-50 border-green-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  pending: {
    label: 'En attente',
    className: 'text-amber-700 bg-amber-50 border-amber-200',
    icon: <Clock className="h-3 w-3" />,
  },
  unpaid: {
    label: 'Non payé',
    className: 'text-muted-foreground bg-muted border-border',
    icon: <Clock className="h-3 w-3" />,
  },
  failed: {
    label: 'Échoué',
    className: 'text-red-700 bg-red-50 border-red-200',
    icon: <XCircle className="h-3 w-3" />,
  },
};

function periodToDate(p: Period): Date | null {
  if (p === 'all') return null;
  const d = new Date();
  if (p === '7d') d.setDate(d.getDate() - 7);
  else if (p === '30d') d.setDate(d.getDate() - 30);
  else if (p === '90d') d.setDate(d.getDate() - 90);
  return d;
}

// ─── Composant ──────────────────────────────────────────────────────────────

export default function PaymentHistoryPage() {
  const { profile } = useAuth();

  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);

  // Filtres
  const [period, setPeriod] = useState<Period>('30d');
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  // KPIs
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    txCount: 0,
    avgAmount: 0,
    successRate: 0,
  });

  // Données graphique
  const [chartData, setChartData] = useState<{ name: string; total: number; color: string }[]>([]);

  const restaurantId = profile?.restaurant_id;

  // ── Chargement des données ────────────────────────────────────────────────

  const loadTransactions = useCallback(async () => {
    if (!restaurantId) { setLoading(false); return; }

    setLoading(true);
    try {
      const since = periodToDate(period);

      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          order_type,
          created_at,
          paid_at,
          customer_name,
          customer_email,
          total,
          subtotal,
          tax,
          payment_method,
          payment_status,
          mobile_payments(transaction_id, phone_number)
        `, { count: 'exact' })
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (since) query = query.gte('created_at', since.toISOString());
      if (methodFilter !== 'all') query = query.eq('payment_method', methodFilter);
      if (statusFilter !== 'all') query = query.eq('payment_status', statusFilter);
      if (search.trim()) {
        query = query.or(
          `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`
        );
      }

      const { data, error, count } = await query;
      if (error) throw error;

      // Aplatir mobile_payments (tableau → premier élément)
      const rows: TransactionRow[] = (data || []).map((o: any) => {
        const mp = Array.isArray(o.mobile_payments) ? o.mobile_payments[0] : o.mobile_payments;
        return {
          id: o.id,
          order_number: o.order_number,
          order_type: o.order_type,
          created_at: o.created_at,
          paid_at: o.paid_at,
          customer_name: o.customer_name,
          customer_email: o.customer_email,
          total: o.total,
          subtotal: o.subtotal ?? o.total,
          tax: o.tax ?? 0,
          payment_method: o.payment_method,
          payment_status: o.payment_status,
          transaction_id: mp?.transaction_id ?? null,
          phone_number: mp?.phone_number ?? null,
        };
      });

      setTransactions(rows);
      setTotal(count ?? 0);
    } catch (e: any) {
      toast.error(`Erreur chargement transactions : ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, page, period, methodFilter, statusFilter, search]);

  const loadKpis = useCallback(async () => {
    if (!restaurantId) return;
    const since = periodToDate(period);

    let q = supabase
      .from('orders')
      .select('total, payment_status, payment_method')
      .eq('restaurant_id', restaurantId);

    if (since) q = q.gte('created_at', since.toISOString());

    const { data } = await q;
    if (!data) return;

    const paid = data.filter((o) => o.payment_status === 'paid');
    const totalRev = paid.reduce((s, o) => s + (o.total || 0), 0);
    const txCount = data.length;
    const avgAmt = txCount > 0 ? totalRev / paid.length || 0 : 0;
    const successRate = txCount > 0 ? (paid.length / txCount) * 100 : 0;

    setKpis({ totalRevenue: totalRev, txCount, avgAmount: avgAmt, successRate });

    // Graphique par méthode
    const methodMap: Record<string, number> = {};
    paid.forEach((o) => {
      const m = o.payment_method || 'cash';
      methodMap[m] = (methodMap[m] || 0) + (o.total || 0);
    });

    const colors: Record<string, string> = {
      card: 'hsl(var(--primary))',
      wave: 'hsl(220 85% 55%)',
      orange_money: 'hsl(28 96% 54%)',
      cash: 'hsl(var(--muted-foreground))',
    };

    setChartData(
      Object.entries(methodMap).map(([key, val]) => ({
        name: METHOD_LABEL[key] || key,
        total: val,
        color: colors[key] || 'hsl(var(--primary))',
      }))
    );
  }, [restaurantId, period]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);
  useEffect(() => { loadKpis(); }, [loadKpis]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [period, methodFilter, statusFilter, search]);

  // ── Export CSV ────────────────────────────────────────────────────────────

  const exportCSV = async () => {
    if (!restaurantId) return;
    const since = periodToDate(period);

    let q = supabase
      .from('orders')
      .select(`
        order_number, created_at, paid_at,
        customer_name, customer_email,
        total, payment_method, payment_status,
        order_type,
        mobile_payments(transaction_id, phone_number)
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (since) q = q.gte('created_at', since.toISOString());
    if (methodFilter !== 'all') q = q.eq('payment_method', methodFilter);
    if (statusFilter !== 'all') q = q.eq('payment_status', statusFilter);

    const { data, error } = await q;
    if (error || !data) { toast.error('Erreur export'); return; }

    const headers = ['N° Commande', 'Date', 'Client', 'Email', 'Montant (FCFA)', 'Méthode', 'Statut', 'Référence transaction', 'Téléphone'];
    const rows = data.map((o: any) => {
      const mp = Array.isArray(o.mobile_payments) ? o.mobile_payments[0] : null;
      return [
        o.order_number,
        format(new Date(o.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
        o.customer_name || '',
        o.customer_email || '',
        o.total,
        METHOD_LABEL[o.payment_method] || o.payment_method || '',
        STATUS_CONFIG[o.payment_status]?.label || o.payment_status,
        mp?.transaction_id || '',
        mp?.phone_number || '',
      ].join(';');
    });

    const csv = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV téléchargé');
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ── Génération reçu PDF ───────────────────────────────────────────────────

  const handleDownloadReceipt = async (tx: TransactionRow) => {
    setPdfLoadingId(tx.id);
    try {
      // Charger les articles de la commande avec le nom du menu
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          quantity,
          unit_price,
          subtotal,
          menu_item_id,
          menu_items!order_items_menu_item_id_fkey(name)
        `)
        .eq('order_id', tx.id);

      if (itemsError) throw itemsError;

      const items: ReceiptOrderItem[] = (itemsData || []).map((item: any) => ({
        name: item.menu_items?.name || 'Article',
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        subtotal: Number(item.subtotal),
      }));

      // Charger les infos du restaurant
      let restaurant: ReceiptRestaurant = { name: 'Restaurant' };
      if (restaurantId) {
        const { data: restData } = await supabase
          .from('restaurants')
          .select('name, address, phone, email, city')
          .eq('id', restaurantId)
          .maybeSingle();

        if (restData) {
          const addressParts = [restData.address, restData.city].filter(Boolean);
          restaurant = {
            name: restData.name || 'Restaurant',
            address: addressParts.join(', ') || null,
            phone: restData.phone || null,
            email: restData.email || null,
          };
        }
      }

      // Construire l'objet transaction pour le PDF
      const receiptTx: ReceiptTransaction = {
        id: tx.id,
        order_number: tx.order_number,
        order_type: tx.order_type,
        created_at: tx.created_at,
        paid_at: tx.paid_at,
        customer_name: tx.customer_name,
        customer_email: tx.customer_email,
        total: tx.total,
        subtotal: tx.subtotal,
        tax: tx.tax,
        payment_method: tx.payment_method,
        payment_status: tx.payment_status,
        transaction_id: tx.transaction_id,
        phone_number: tx.phone_number,
      };

      generateReceiptPDF(receiptTx, restaurant, items);
      toast.success(`Reçu téléchargé — commande #${tx.order_number}`);
    } catch (e: any) {
      toast.error(`Erreur génération reçu : ${e.message}`);
    } finally {
      setPdfLoadingId(null);
    }
  };



  // ─── Rendu ───────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">

      {/* ── En-tête ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-medium">Historique des transactions</h1>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide text-muted-foreground ml-1">
              Mode démo
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Toutes les transactions de paiement de votre restaurant
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={exportCSV}>
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Revenus encaissés',
            value: loading ? null : `${kpis.totalRevenue.toLocaleString('fr-FR')} FCFA`,
            icon: TrendingUp,
          },
          {
            label: 'Transactions',
            value: loading ? null : kpis.txCount.toString(),
            icon: ReceiptText,
          },
          {
            label: 'Montant moyen',
            value: loading ? null : `${Math.round(kpis.avgAmount).toLocaleString('fr-FR')} FCFA`,
            icon: CreditCard,
          },
          {
            label: 'Taux de succès',
            value: loading ? null : `${kpis.successRate.toFixed(0)} %`,
            icon: CheckCircle2,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="h-full">
            <CardContent className="p-4 md:p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground text-balance">{label}</p>
                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
              {loading ? (
                <Skeleton className="h-7 w-24 bg-muted" />
              ) : (
                <p className="text-xl font-medium tabular-nums">{value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Graphique + Filtres ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Graphique par méthode */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenus par méthode</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full bg-muted" />)}
              </div>
            ) : chartData.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Aucune donnée</p>
            ) : (
              <div className="w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip
                      formatter={(v: number) => [`${v.toLocaleString('fr-FR')} FCFA`, 'Total']}
                      contentStyle={{ fontSize: 12, border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="total" radius={3}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filtres */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Filtres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, nom, email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Période */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Période</p>
                <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 derniers jours</SelectItem>
                    <SelectItem value="30d">30 derniers jours</SelectItem>
                    <SelectItem value="90d">90 derniers jours</SelectItem>
                    <SelectItem value="all">Tout afficher</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Méthode */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Méthode</p>
                <Select value={methodFilter} onValueChange={(v) => setMethodFilter(v as MethodFilter)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="card">Carte</SelectItem>
                    <SelectItem value="wave">Wave</SelectItem>
                    <SelectItem value="orange_money">Orange Money</SelectItem>
                    <SelectItem value="cash">Espèces</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Statut */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Statut</p>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="paid">Payé</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="unpaid">Non payé</SelectItem>
                    <SelectItem value="failed">Échoué</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Compteur résultats */}
            <p className="text-xs text-muted-foreground">
              {loading ? 'Chargement…' : `${total} transaction${total > 1 ? 's' : ''} trouvée${total > 1 ? 's' : ''}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Tableau ── */}
      <Card>
        <CardContent className="p-0">
          <div className="w-full max-w-full overflow-x-auto">
            <Table className="[&>div]:max-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap pl-4 md:pl-6">N° Commande</TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Client</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Montant</TableHead>
                  <TableHead className="whitespace-nowrap">Méthode</TableHead>
                  <TableHead className="whitespace-nowrap">Statut</TableHead>
                  <TableHead className="whitespace-nowrap text-muted-foreground">Référence</TableHead>
                  <TableHead className="whitespace-nowrap w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                      Aucune transaction trouvée pour les filtres sélectionnés.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => {
                    const statusCfg = STATUS_CONFIG[tx.payment_status] || STATUS_CONFIG['pending'];
                    const method = tx.payment_method || 'cash';
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="pl-4 md:pl-6 whitespace-nowrap font-mono text-xs">
                          #{tx.order_number}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(tx.created_at), 'dd MMM yyyy', { locale: fr })}
                          <span className="ml-1 text-xs text-muted-foreground">
                            {format(new Date(tx.created_at), 'HH:mm')}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <div className="space-y-0.5">
                            <p className="font-medium">{tx.customer_name || '—'}</p>
                            {tx.phone_number && (
                              <p className="text-xs text-muted-foreground font-mono">{tx.phone_number}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-medium tabular-nums text-sm">
                          {tx.total.toLocaleString('fr-FR')}
                          <span className="ml-1 text-xs text-muted-foreground">FCFA</span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            {METHOD_ICON[method]}
                            {METHOD_LABEL[method] || method}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusCfg.className}`}>
                            {statusCfg.icon}
                            {statusCfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {tx.transaction_id ? (
                            <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[140px] block">
                              {tx.transaction_id}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            disabled={pdfLoadingId === tx.id}
                            onClick={() => handleDownloadReceipt(tx)}
                            title="Télécharger le reçu PDF"
                          >
                            {pdfLoadingId === tx.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <FileText className="h-3.5 w-3.5" />
                            }
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 md:px-6 py-3">
              <p className="text-xs text-muted-foreground">
                Page {page + 1} sur {totalPages} · {total} résultats
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

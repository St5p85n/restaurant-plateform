import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, CheckCircle, XCircle, Clock, MapPin, Phone, Mail, User } from 'lucide-react';
import type { Restaurant, ApprovalStatus } from '@/types';

interface RestaurantRequest extends Restaurant {
  owner: { full_name: string | null; email: string | null; phone: string | null } | null;
}

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: 'En attente',
  approved: 'Acceptée',
  rejected: 'Rejetée',
};

function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  if (status === 'approved') return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal">Acceptée</Badge>;
  if (status === 'rejected') return <Badge className="bg-red-50 text-red-700 border-red-200 font-normal">Rejetée</Badge>;
  return <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-normal">En attente</Badge>;
}

export default function AdminRegistrationRequestsPage() {
  const [requests, setRequests] = useState<RestaurantRequest[]>([]);
  const [filtered, setFiltered] = useState<RestaurantRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<RestaurantRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approved' | 'rejected' | null;
    restaurant: RestaurantRequest | null;
  }>({ open: false, action: null, restaurant: null });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadRequests(); }, []);

  useEffect(() => {
    let list = [...requests];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.address?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.owner?.full_name?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') list = list.filter(r => r.approval_status === statusFilter);
    setFiltered(list);
  }, [requests, search, statusFilter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`*, owner:profiles!restaurants_owner_id_fkey(full_name, email, phone)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRequests((data || []) as RestaurantRequest[]);
    } catch (e: any) {
      toast.error('Erreur chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (r: RestaurantRequest) => { setSelected(r); setDetailOpen(true); };

  const promptAction = (r: RestaurantRequest, action: 'approved' | 'rejected') => {
    setDetailOpen(false);
    setConfirmDialog({ open: true, action, restaurant: r });
  };

  const confirmAction = async () => {
    if (!confirmDialog.restaurant || !confirmDialog.action) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ approval_status: confirmDialog.action })
        .eq('id', confirmDialog.restaurant.id);
      if (error) throw error;
      toast.success(
        confirmDialog.action === 'approved'
          ? `« ${confirmDialog.restaurant.name} » a été accepté`
          : `« ${confirmDialog.restaurant.name} » a été rejeté`
      );
      await loadRequests();
    } catch (e: any) {
      toast.error("Erreur lors de l'action");
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false, action: null, restaurant: null });
    }
  };

  const pendingCount = requests.filter(r => r.approval_status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Demandes d'inscription</h2>
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5">
              {pendingCount} en attente
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Acceptez ou rejetez les demandes de création d'espace restaurant.
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un restaurant, un propriétaire…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="approved">Acceptées</SelectItem>
            <SelectItem value="rejected">Rejetées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Clock className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium">Aucune demande trouvée</p>
          <p className="text-xs text-muted-foreground mt-1">Modifiez vos filtres pour afficher d'autres résultats</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="whitespace-nowrap font-medium">Restaurant</TableHead>
                <TableHead className="whitespace-nowrap font-medium">Propriétaire</TableHead>
                <TableHead className="whitespace-nowrap font-medium">Cuisine</TableHead>
                <TableHead className="whitespace-nowrap font-medium">Date</TableHead>
                <TableHead className="whitespace-nowrap font-medium">Statut</TableHead>
                <TableHead className="whitespace-nowrap font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="whitespace-nowrap font-medium">{r.name}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {r.owner?.full_name || '—'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {r.cuisine_type || '—'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <ApprovalBadge status={r.approval_status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openDetail(r)}>
                        Voir
                      </Button>
                      {r.approval_status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => promptAction(r, 'approved')}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Accepter
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => promptAction(r, 'rejected')}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Rejeter
                          </Button>
                        </>
                      )}
                      {r.approval_status === 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => promptAction(r, 'rejected')}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Rejeter
                        </Button>
                      )}
                      {r.approval_status === 'rejected' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => promptAction(r, 'approved')}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Accepter
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog détail */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-balance">{selected.name}</DialogTitle>
                <DialogDescription>
                  Demande soumise le {new Date(selected.created_at).toLocaleDateString('fr-FR')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="flex items-center gap-2">
                  <ApprovalBadge status={selected.approval_status} />
                </div>

                {/* Infos restaurant */}
                <div className="space-y-2 text-sm">
                  {selected.cuisine_type && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Type de cuisine :</span>{' '}
                      {selected.cuisine_type}
                    </p>
                  )}
                  {selected.address && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{selected.address}</span>
                    </div>
                  )}
                  {selected.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{selected.phone}</span>
                    </div>
                  )}
                  {selected.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span>{selected.email}</span>
                    </div>
                  )}
                </div>

                {selected.description && (
                  <p className="text-sm text-muted-foreground border-t border-border pt-3 text-pretty">
                    {selected.description}
                  </p>
                )}

                {/* Propriétaire */}
                {selected.owner && (
                  <div className="border-t border-border pt-3 space-y-1.5 text-sm">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Propriétaire</p>
                    {selected.owner.full_name && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4 shrink-0" />
                        <span>{selected.owner.full_name}</span>
                      </div>
                    )}
                    {selected.owner.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span>{selected.owner.email}</span>
                      </div>
                    )}
                    {selected.owner.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4 shrink-0" />
                        <span>{selected.owner.phone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>Fermer</Button>
                {selected.approval_status !== 'approved' && (
                  <Button
                    className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    variant="outline"
                    onClick={() => promptAction(selected, 'approved')}
                  >
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    Accepter
                  </Button>
                )}
                {selected.approval_status !== 'rejected' && (
                  <Button
                    variant="outline"
                    className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    onClick={() => promptAction(selected, 'rejected')}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Rejeter
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog confirmation */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !actionLoading && setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === 'approved' ? 'Accepter la demande' : 'Rejeter la demande'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === 'approved'
                ? `Le restaurant « ${confirmDialog.restaurant?.name} » obtiendra accès à son espace.`
                : `Le restaurant « ${confirmDialog.restaurant?.name} » sera bloqué et ne pourra pas accéder à la plateforme.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, action: null, restaurant: null })} disabled={actionLoading}>
              Annuler
            </Button>
            <Button
              variant="outline"
              className={confirmDialog.action === 'approved'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'}
              onClick={confirmAction}
              disabled={actionLoading}
            >
              {confirmDialog.action === 'approved' ? 'Confirmer l\'acceptation' : 'Confirmer le rejet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

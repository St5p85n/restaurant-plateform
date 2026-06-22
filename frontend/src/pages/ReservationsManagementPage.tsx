import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Users, Phone, Mail, Search, Filter, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Reservation, Table } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ReservationsManagementPage() {
  const { profile } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadRestaurantId();
  }, [profile]);

  useEffect(() => {
    if (restaurantId) {
      loadData();
      setupRealtime();
    }
  }, [restaurantId]);

  useEffect(() => {
    filterReservations();
  }, [searchQuery, statusFilter, reservations]);

  const loadRestaurantId = async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', profile.id)
        .maybeSingle();

      if (error) throw error;
      if (data?.restaurant_id) {
        setRestaurantId(data.restaurant_id);
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      toast.error(`Erreur de chargement: ${error.message}`);
      setLoading(false);
    }
  };

  const loadData = async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);

      // Charger les réservations
      const { data: reservationsData, error: reservationsError } = await supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('reservation_date', { ascending: true });

      if (reservationsError) throw reservationsError;
      setReservations(reservationsData || []);

      // Charger les tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('table_number', { ascending: true });

      if (tablesError) throw tablesError;
      setTables(tablesData || []);
    } catch (error: any) {
      toast.error(`Erreur de chargement: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    if (!restaurantId) return;

    const channel = supabase
      .channel('reservations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filterReservations = () => {
    let filtered = [...reservations];

    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.customer_phone?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    setFilteredReservations(filtered);
  };

  const handleStatusChange = async (reservationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', reservationId);

      if (error) throw error;
      toast.success('Statut mis à jour');
      loadData();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const handleAssignTable = async (reservationId: string, tableId: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ table_id: tableId })
        .eq('id', reservationId);

      if (error) throw error;
      toast.success('Table attribuée');
      loadData();
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Confirmée</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Annulée</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Terminée</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (!restaurantId) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-warning" />
            <p className="text-lg font-medium mb-2">Restaurant non configuré</p>
            <p className="text-muted-foreground mb-6">
              Vous devez inscrire votre restaurant pour accéder aux réservations.
            </p>
            <Button onClick={() => window.location.href = '/register-restaurant'}>
              Inscrire mon restaurant
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === 'pending').length,
    confirmed: reservations.filter((r) => r.status === 'confirmed').length,
    today: reservations.filter((r) => {
      const today = new Date().toISOString().split('T')[0];
      return r.reservation_date?.startsWith(today);
    }).length,
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light mb-2">Réservations</h1>
        <p className="text-muted-foreground">Gérez les réservations de votre restaurant</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total</p>
                <p className="text-2xl font-light">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">En attente</p>
                <p className="text-2xl font-light">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Confirmées</p>
                <p className="text-2xl font-light">{stats.confirmed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Aujourd'hui</p>
                <p className="text-2xl font-light">{stats.today}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email ou téléphone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmées</SelectItem>
                <SelectItem value="cancelled">Annulées</SelectItem>
                <SelectItem value="completed">Terminées</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reservations List */}
      <div className="space-y-4">
        {filteredReservations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune réservation trouvée</p>
            </CardContent>
          </Card>
        ) : (
          filteredReservations.map((reservation) => (
            <Card key={reservation.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium">{reservation.customer_name}</h3>
                      {getStatusBadge(reservation.status)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {reservation.reservation_date
                          ? format(new Date(reservation.reservation_date), 'dd MMMM yyyy', { locale: fr })
                          : 'Date non définie'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {reservation.reservation_time || 'Heure non définie'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {reservation.party_size} personnes
                      </div>
                    </div>
                    {reservation.customer_phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {reservation.customer_phone}
                      </div>
                    )}
                    {reservation.customer_email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        {reservation.customer_email}
                      </div>
                    )}
                    {reservation.special_requests && (
                      <p className="text-sm text-muted-foreground italic">
                        Note: {reservation.special_requests}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {reservation.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                          className="w-full md:w-auto"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirmer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                          className="w-full md:w-auto"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Annuler
                        </Button>
                      </>
                    )}
                    {reservation.status === 'confirmed' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedReservation(reservation);
                            setDialogOpen(true);
                          }}
                          className="w-full md:w-auto"
                        >
                          Attribuer table
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(reservation.id, 'completed')}
                          className="w-full md:w-auto"
                        >
                          Marquer terminée
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Assign Table Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attribuer une table</DialogTitle>
            <DialogDescription>
              Sélectionnez une table pour la réservation de {selectedReservation?.customer_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              {tables
                .filter((t) => t.capacity >= (selectedReservation?.party_size || 0))
                .map((table) => (
                  <Button
                    key={table.id}
                    variant="outline"
                    onClick={() => handleAssignTable(selectedReservation!.id, table.id)}
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <span className="text-lg font-medium">Table {table.table_number}</span>
                    <span className="text-sm text-muted-foreground">{table.capacity} places</span>
                  </Button>
                ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

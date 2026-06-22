import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Search, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Complaint, ComplaintStatus } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ComplaintsManagementPage() {
  const { profile } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [response, setResponse] = useState('');

  useEffect(() => {
    loadRestaurantId();
  }, [profile]);

  useEffect(() => {
    if (restaurantId) {
      loadComplaints();
    }
  }, [restaurantId]);

  useEffect(() => {
    filterComplaints();
  }, [searchQuery, statusFilter, complaints]);

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
      toast.error(`Erreur: ${error.message}`);
      setLoading(false);
    }
  };

  const loadComplaints = async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterComplaints = () => {
    let filtered = [...complaints];

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    setFilteredComplaints(filtered);
  };

  const handleStatusChange = async (complaintId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ status: newStatus })
        .eq('id', complaintId);

      if (error) throw error;
      toast.success('Statut mis à jour');
      loadComplaints();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const handleSendResponse = async () => {
    if (!selectedComplaint || !response.trim()) return;

    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          admin_notes: response,
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', selectedComplaint.id);

      if (error) throw error;
      toast.success('Réponse envoyée');
      setDialogOpen(false);
      setResponse('');
      setSelectedComplaint(null);
      loadComplaints();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Nouvelle</Badge>;
      case 'in_review':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En cours</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Résolue</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Fermée</Badge>;
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
              Vous devez inscrire votre restaurant pour gérer les réclamations.
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
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'pending').length,
    inReview: complaints.filter((c) => c.status === 'in_review').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-light mb-2">Réclamations</h1>
        <p className="text-muted-foreground">Gérez les réclamations de vos clients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-3xl font-light">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Nouvelles</p>
              <AlertTriangle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-3xl font-light">{stats.pending}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">En cours</p>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-3xl font-light">{stats.inReview}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Résolues</p>
              <CheckCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-3xl font-light">{stats.resolved}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une réclamation..."
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
                <SelectItem value="pending">Nouvelles</SelectItem>
                <SelectItem value="in_review">En cours</SelectItem>
                <SelectItem value="resolved">Résolues</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredComplaints.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune réclamation trouvée</p>
            </CardContent>
          </Card>
        ) : (
          filteredComplaints.map((complaint) => (
            <Card key={complaint.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium">{complaint.subject}</h3>
                      {getStatusBadge(complaint.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{complaint.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {complaint.created_at
                          ? format(new Date(complaint.created_at), 'dd MMM yyyy', { locale: fr })
                          : ''}
                      </span>
                    </div>
                    {complaint.admin_notes && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-2">Réponse:</p>
                        <p className="text-sm text-muted-foreground">{complaint.admin_notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {complaint.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(complaint.id, 'in_review')}
                      >
                        Prendre en charge
                      </Button>
                    )}
                    {complaint.status === 'in_review' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setDialogOpen(true);
                        }}
                      >
                        Répondre
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Répondre à la réclamation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">{selectedComplaint?.subject}</p>
              <p className="text-sm text-muted-foreground">{selectedComplaint?.description}</p>
            </div>
            <Textarea
              placeholder="Votre réponse..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSendResponse}>Envoyer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

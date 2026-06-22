import React, { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Search, MessageSquare, AlertCircle } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import type { ComplaintWithDetails } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<ComplaintWithDetails[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<ComplaintWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintWithDetails | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    loadComplaints();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, searchQuery, statusFilter, sourceFilter]);

  const loadComplaints = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          restaurant:restaurants(
            id,
            name,
            email,
            phone
          ),
          submitted_by_profile:profiles!complaints_submitted_by_fkey(
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setComplaints(data || []);
    } catch (error: any) {
      console.error('Erreur chargement réclamations:', error);
      toast.error('Erreur lors du chargement des réclamations');
    } finally {
      setLoading(false);
    }
  };

  const filterComplaints = () => {
    let filtered = [...complaints];

    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.restaurant?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(c => c.source === sourceFilter);
    }

    setFilteredComplaints(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">En attente</Badge>;
      case 'in_review':
        return <Badge variant="secondary">En cours</Badge>;
      case 'resolved':
        return <Badge variant="default">Résolu</Badge>;
      case 'closed':
        return <Badge>Fermé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 4) {
      return <Badge variant="destructive">Urgent</Badge>;
    } else if (priority >= 3) {
      return <Badge variant="secondary">Élevée</Badge>;
    } else if (priority >= 2) {
      return <Badge variant="outline">Moyenne</Badge>;
    } else {
      return <Badge variant="outline">Faible</Badge>;
    }
  };

  const handleRespond = async () => {
    if (!selectedComplaint || !responseText.trim()) {
      toast.error('Veuillez saisir une réponse');
      return;
    }

    try {
      setResponding(true);

      // Mettre à jour le statut de la réclamation
      const { error: updateError } = await supabase
        .from('complaints')
        .update({ 
          status: 'in_review',
          admin_notes: responseText
        })
        .eq('id', selectedComplaint.id);

      if (updateError) throw updateError;

      toast.success('Réponse envoyée avec succès');
      setSelectedComplaint(null);
      setResponseText('');
      await loadComplaints();
    } catch (error: any) {
      console.error('Erreur envoi réponse:', error);
      toast.error('Erreur lors de l\'envoi de la réponse');
    } finally {
      setResponding(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Réclamation marquée comme résolue');
      await loadComplaints();
    } catch (error: any) {
      console.error('Erreur résolution réclamation:', error);
      toast.error('Erreur lors de la résolution');
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">Gestion des réclamations</h2>
          <p className="text-muted-foreground">
            {filteredComplaints.length} réclamation{filteredComplaints.length > 1 ? 's' : ''} trouvée{filteredComplaints.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Filtres */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par sujet, description, restaurant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="in_review">En cours</SelectItem>
              <SelectItem value="resolved">Résolues</SelectItem>
              <SelectItem value="closed">Fermées</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les sources</SelectItem>
              <SelectItem value="customer">Clients</SelectItem>
              <SelectItem value="restaurant">Restaurants</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liste des réclamations */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Aucune réclamation trouvée</p>
            <p className="text-sm text-muted-foreground mt-2">
              Essayez de modifier vos filtres de recherche
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((complaint) => (
              <Card key={complaint.id} className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg truncate">{complaint.subject}</CardTitle>
                        {complaint.priority >= 3 && (
                          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Restaurant: {complaint.restaurant?.name || 'Inconnu'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Source: {complaint.source === 'customer' ? 'Client' : 'Restaurant'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {getStatusBadge(complaint.status)}
                      {getPriorityBadge(complaint.priority)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{complaint.description}</p>
                  
                  {complaint.admin_notes && (
                    <div className="mb-4 p-3 rounded-lg bg-muted">
                      <p className="text-sm font-medium mb-1">Note admin:</p>
                      <p className="text-sm text-muted-foreground">{complaint.admin_notes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span>Créée le {new Date(complaint.created_at).toLocaleDateString('fr-FR')}</span>
                    {complaint.resolved_at && (
                      <span>Résolue le {new Date(complaint.resolved_at).toLocaleDateString('fr-FR')}</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedComplaint(complaint)}
                    >
                      Répondre
                    </Button>
                    {complaint.status !== 'resolved' && complaint.status !== 'closed' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResolve(complaint.id)}
                      >
                        Marquer comme résolu
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de réponse */}
      <Dialog open={!!selectedComplaint} onOpenChange={(open) => !open && setSelectedComplaint(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Répondre à la réclamation</DialogTitle>
            <DialogDescription>
              {selectedComplaint?.subject}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Description:</p>
              <p className="text-sm text-muted-foreground">{selectedComplaint?.description}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Votre réponse:</p>
              <Textarea
                placeholder="Saisissez votre réponse..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedComplaint(null)}>
              Annuler
            </Button>
            <Button onClick={handleRespond} disabled={responding}>
              {responding ? 'Envoi...' : 'Envoyer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

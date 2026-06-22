import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Edit, Trash2, Search, AlertTriangle, Mail, Phone } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile } from '@/types';
import { toast } from 'sonner';

export default function StaffManagementPage() {
  const { profile } = useAuth();
  const [staff, setStaff] = useState<Profile[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Profile | null>(null);

  const [staffForm, setStaffForm] = useState({
    email: '',
    full_name: '',
    role: 'server',
    phone: '',
  });

  useEffect(() => {
    loadRestaurantId();
  }, [profile]);

  useEffect(() => {
    if (restaurantId) {
      loadStaff();
    }
  }, [restaurantId]);

  useEffect(() => {
    filterStaff();
  }, [searchQuery, roleFilter, staff]);

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

  const loadStaff = async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setStaff(data || []);
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterStaff = () => {
    let filtered = [...staff];

    if (searchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((s) => s.role === roleFilter);
    }

    setFilteredStaff(filtered);
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-purple-100 text-purple-800 border-purple-200',
      manager: 'bg-blue-100 text-blue-800 border-blue-200',
      chef: 'bg-orange-100 text-orange-800 border-orange-200',
      server: 'bg-green-100 text-green-800 border-green-200',
      accountant: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };

    const labels: Record<string, string> = {
      owner: 'Propriétaire',
      manager: 'Gérant',
      chef: 'Chef',
      server: 'Serveur',
      accountant: 'Comptable',
    };

    return (
      <Badge className={colors[role] || ''}>
        {labels[role] || role}
      </Badge>
    );
  };

  if (!restaurantId) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-warning" />
            <p className="text-lg font-medium mb-2">Restaurant non configuré</p>
            <p className="text-muted-foreground mb-6">
              Vous devez inscrire votre restaurant pour gérer le personnel.
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
    total: staff.length,
    managers: staff.filter((s) => s.role === 'manager').length,
    chefs: staff.filter((s) => s.role === 'chef').length,
    servers: staff.filter((s) => s.role === 'server').length,
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-light mb-2">Personnel</h1>
        <p className="text-muted-foreground">Gérez les employés de votre restaurant</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total</p>
                <p className="text-2xl font-light">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Gérants</p>
            <p className="text-2xl font-light">{stats.managers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Chefs</p>
            <p className="text-2xl font-light">{stats.chefs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Serveurs</p>
            <p className="text-2xl font-light">{stats.servers}</p>
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
                  placeholder="Rechercher un employé..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="manager">Gérant</SelectItem>
                <SelectItem value="chef">Chef</SelectItem>
                <SelectItem value="server">Serveur</SelectItem>
                <SelectItem value="accountant">Comptable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun employé trouvé</p>
            </CardContent>
          </Card>
        ) : (
          filteredStaff.map((member) => (
            <Card key={member.id}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium mb-2">{member.full_name || member.email}</h3>
                    {getRoleBadge(member.role)}
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {member.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {member.email}
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {member.phone}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  Plus,
  Minus,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Search,
  Edit,
  Trash2,
  FileText,
  Calendar,
  BarChart3,
  Download,
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { StockItem, StockMovement } from '@/types';
import { toast } from 'sonner';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
}

interface InventoryItem {
  stockItem: StockItem;
  physicalCount: number;
  difference: number;
}

export default function StockManagementPage() {
  const { profile } = useAuth();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Stock items
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Movements
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementFilter, setMovementFilter] = useState<'all' | 'in' | 'out' | 'adjustment'>('all');

  // Suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Inventory
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryMode, setInventoryMode] = useState(false);

  // Reports
  const [reportPeriod, setReportPeriod] = useState<7 | 30 | 90>(30);
  const [consumptionData, setConsumptionData] = useState<{
    dates: string[];
    items: { name: string; quantities: number[] }[];
  }>({ dates: [], items: [] });

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form states
  const [itemForm, setItemForm] = useState({
    name: '',
    unit: '',
    quantity: 0,
    min_quantity: 0,
    unit_cost: 0,
    supplier: '',
  });

  const [movementForm, setMovementForm] = useState({
    stock_item_id: '',
    movement_type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 0,
    notes: '',
  });

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
  });

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRestaurantId();
  }, [profile]);

  useEffect(() => {
    if (restaurantId) {
      loadAllData();
      setupRealtime();
    }
  }, [restaurantId]);

  useEffect(() => {
    filterStockItems();
  }, [searchQuery, showLowStockOnly, stockItems]);

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

  const loadAllData = async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);
      await Promise.all([
        loadStockItems(),
        loadMovements(),
        loadSuppliers(),
      ]);
    } catch (error: any) {
      toast.error(`Erreur de chargement: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadStockItems = async () => {
    if (!restaurantId) return;

    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('name', { ascending: true });

    if (error) throw error;
    setStockItems(data || []);
  };

  const loadMovements = async () => {
    if (!restaurantId) return;

    const { data: movementsData, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        stock_item:stock_items(name, unit)
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    setMovements(movementsData || []);
  };

  const loadSuppliers = async () => {
    // Simuler des fournisseurs (à remplacer par une vraie table si nécessaire)
    const uniqueSuppliers = [...new Set(stockItems.map(item => item.supplier).filter(Boolean))];
    const suppliersData = uniqueSuppliers.map((name, index) => ({
      id: `supplier-${index}`,
      name: name || '',
      contact: '',
      email: '',
      phone: '',
    }));
    setSuppliers(suppliersData);
  };

  const setupRealtime = () => {
    if (!restaurantId) return;

    const channel = supabase
      .channel('stock-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_items',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          loadStockItems();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_movements',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          loadMovements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filterStockItems = () => {
    let filtered = stockItems;

    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (showLowStockOnly) {
      filtered = filtered.filter((item) => item.quantity <= item.min_quantity);
    }

    setFilteredItems(filtered);
  };

  const handleCreateItem = async () => {
    if (!restaurantId) return;

    try {
      setProcessing(true);

      const { error } = await supabase.from('stock_items').insert({
        restaurant_id: restaurantId,
        name: itemForm.name,
        unit: itemForm.unit,
        quantity: itemForm.quantity,
        min_quantity: itemForm.min_quantity,
        unit_cost: itemForm.unit_cost || null,
        supplier: itemForm.supplier || null,
      });

      if (error) throw error;

      toast.success('Produit créé avec succès');
      setShowItemModal(false);
      resetItemForm();
      loadStockItems();
    } catch (error: any) {
      toast.error(`Erreur de création: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!restaurantId || !editingItem) return;

    try {
      setProcessing(true);

      const { error } = await supabase
        .from('stock_items')
        .update({
          name: itemForm.name,
          unit: itemForm.unit,
          min_quantity: itemForm.min_quantity,
          unit_cost: itemForm.unit_cost || null,
          supplier: itemForm.supplier || null,
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      toast.success('Produit mis à jour');
      setShowItemModal(false);
      setEditingItem(null);
      resetItemForm();
      loadStockItems();
    } catch (error: any) {
      toast.error(`Erreur de mise à jour: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    try {
      const { error } = await supabase.from('stock_items').delete().eq('id', id);

      if (error) throw error;

      toast.success('Produit supprimé');
      loadStockItems();
    } catch (error: any) {
      toast.error(`Erreur de suppression: ${error.message}`);
    }
  };

  const handleAddMovement = async () => {
    if (!restaurantId) return;

    try {
      setProcessing(true);

      // Créer le mouvement
      const { error: movementError } = await supabase.from('stock_movements').insert({
        restaurant_id: restaurantId,
        stock_item_id: movementForm.stock_item_id,
        movement_type: movementForm.movement_type,
        quantity: movementForm.quantity,
        notes: movementForm.notes || null,
        created_by: profile?.id || null,
      });

      if (movementError) throw movementError;

      // Mettre à jour la quantité du stock
      const stockItem = stockItems.find((item) => item.id === movementForm.stock_item_id);
      if (stockItem) {
        let newQuantity = stockItem.quantity;
        if (movementForm.movement_type === 'in') {
          newQuantity += movementForm.quantity;
        } else if (movementForm.movement_type === 'out') {
          newQuantity -= movementForm.quantity;
        } else {
          newQuantity = movementForm.quantity;
        }

        const { error: updateError } = await supabase
          .from('stock_items')
          .update({ quantity: newQuantity })
          .eq('id', movementForm.stock_item_id);

        if (updateError) throw updateError;
      }

      toast.success('Mouvement enregistré');
      setShowMovementModal(false);
      resetMovementForm();
      loadStockItems();
      loadMovements();
    } catch (error: any) {
      toast.error(`Erreur d'enregistrement: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleStartInventory = () => {
    setInventoryMode(true);
    setInventoryItems(
      stockItems.map((item) => ({
        stockItem: item,
        physicalCount: item.quantity,
        difference: 0,
      }))
    );
    setActiveTab('inventory');
  };

  const handleUpdateInventoryCount = (index: number, count: number) => {
    const newItems = [...inventoryItems];
    newItems[index].physicalCount = count;
    newItems[index].difference = count - newItems[index].stockItem.quantity;
    setInventoryItems(newItems);
  };

  const handleSaveInventory = async () => {
    if (!restaurantId) return;

    try {
      setProcessing(true);

      // Créer des mouvements d'ajustement pour chaque écart
      const adjustments = inventoryItems
        .filter((item) => item.difference !== 0)
        .map((item) => ({
          restaurant_id: restaurantId,
          stock_item_id: item.stockItem.id,
          movement_type: 'adjustment',
          quantity: Math.abs(item.difference),
          notes: `Inventaire: ${item.difference > 0 ? 'Surplus' : 'Manquant'} de ${Math.abs(item.difference)} ${item.stockItem.unit}`,
          created_by: profile?.id || null,
        }));

      if (adjustments.length > 0) {
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert(adjustments);

        if (movementError) throw movementError;

        // Mettre à jour les quantités
        for (const item of inventoryItems.filter((i) => i.difference !== 0)) {
          const { error: updateError } = await supabase
            .from('stock_items')
            .update({ quantity: item.physicalCount })
            .eq('id', item.stockItem.id);

          if (updateError) throw updateError;
        }
      }

      toast.success('Inventaire enregistré avec succès');
      setInventoryMode(false);
      setInventoryItems([]);
      loadStockItems();
      loadMovements();
    } catch (error: any) {
      toast.error(`Erreur d'enregistrement: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const loadConsumptionReport = async () => {
    if (!restaurantId) return;

    try {
      const dates: string[] = [];
      const itemsMap = new Map<string, number[]>();

      // Charger les mouvements de sortie sur la période
      for (let i = reportPeriod - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const startOfDate = startOfDay(date).toISOString();
        const endOfDate = endOfDay(date).toISOString();

        dates.push(format(date, 'dd/MM'));

        const { data: movementsData } = await supabase
          .from('stock_movements')
          .select(`
            *,
            stock_item:stock_items(name)
          `)
          .eq('restaurant_id', restaurantId)
          .eq('movement_type', 'out')
          .gte('created_at', startOfDate)
          .lte('created_at', endOfDate);

        // Agréger par produit
        movementsData?.forEach((movement: any) => {
          const itemName = movement.stock_item?.name || 'Inconnu';
          if (!itemsMap.has(itemName)) {
            itemsMap.set(itemName, new Array(reportPeriod).fill(0));
          }
          const quantities = itemsMap.get(itemName)!;
          quantities[reportPeriod - 1 - i] += movement.quantity;
        });
      }

      // Convertir en format pour affichage
      const items = Array.from(itemsMap.entries())
        .map(([name, quantities]) => ({ name, quantities }))
        .sort((a, b) => {
          const sumA = a.quantities.reduce((s, q) => s + q, 0);
          const sumB = b.quantities.reduce((s, q) => s + q, 0);
          return sumB - sumA;
        })
        .slice(0, 10); // Top 10

      setConsumptionData({ dates, items });
    } catch (error: any) {
      toast.error(`Erreur de chargement du rapport: ${error.message}`);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports' && restaurantId) {
      loadConsumptionReport();
    }
  }, [activeTab, reportPeriod, restaurantId]);

  const resetItemForm = () => {
    setItemForm({
      name: '',
      unit: '',
      quantity: 0,
      min_quantity: 0,
      unit_cost: 0,
      supplier: '',
    });
  };

  const resetMovementForm = () => {
    setMovementForm({
      stock_item_id: '',
      movement_type: 'in',
      quantity: 0,
      notes: '',
    });
  };

  const openEditItem = (item: StockItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      min_quantity: item.min_quantity,
      unit_cost: item.unit_cost || 0,
      supplier: item.supplier || '',
    });
    setShowItemModal(true);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-warning" />
            <p className="text-lg font-medium mb-2">Restaurant non configuré</p>
            <p className="text-muted-foreground mb-6">
              Vous devez inscrire votre restaurant pour accéder à la gestion des stocks.
            </p>
            <Button onClick={() => window.location.href = '/register-restaurant'}>
              Inscrire mon restaurant
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lowStockCount = stockItems.filter((item) => item.quantity <= item.min_quantity).length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion des Stocks</h1>
          <p className="text-muted-foreground">
            Gérez vos produits, mouvements et inventaires
          </p>
        </div>
        {lowStockCount > 0 && (
          <Badge variant="destructive" className="text-lg px-4 py-2">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {lowStockCount} alerte{lowStockCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <Package className="w-4 h-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="movements">
            <TrendingUp className="w-4 h-4 mr-2" />
            Mouvements
          </TabsTrigger>
          <TabsTrigger value="suppliers">
            <FileText className="w-4 h-4 mr-2" />
            Fournisseurs
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Calendar className="w-4 h-4 mr-2" />
            Inventaire
          </TabsTrigger>
          <TabsTrigger value="reports">
            <BarChart3 className="w-4 h-4 mr-2" />
            Rapports
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant={showLowStockOnly ? 'default' : 'outline'}
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Stocks faibles
              </Button>
            </div>
            <Button onClick={() => setShowItemModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau produit
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Produits en stock ({filteredItems.length})</CardTitle>
              <CardDescription>Liste de tous vos produits</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3 pr-4">
                  {filteredItems.map((item) => {
                    const isLow = item.quantity <= item.min_quantity;
                    const percentage = (item.quantity / item.min_quantity) * 100;

                    return (
                      <div
                        key={item.id}
                        className={`border rounded-lg p-4 ${isLow ? 'border-destructive bg-destructive/5' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{item.name}</h3>
                              {isLow && (
                                <Badge variant="destructive">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Stock faible
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Unité: {item.unit}</span>
                              {item.supplier && <span>Fournisseur: {item.supplier}</span>}
                              {item.unit_cost && <span>Coût: {item.unit_cost.toFixed(2)}FCFA</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="ghost" onClick={() => openEditItem(item)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Stock actuel</span>
                            <span className="font-bold">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${isLow ? 'bg-destructive' : 'bg-primary'}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Minimum: {item.min_quantity} {item.unit}</span>
                            <span>{percentage.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movements Tab */}
        <TabsContent value="movements" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Select value={movementFilter} onValueChange={(value: any) => setMovementFilter(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les mouvements</SelectItem>
                <SelectItem value="in">Entrées</SelectItem>
                <SelectItem value="out">Sorties</SelectItem>
                <SelectItem value="adjustment">Ajustements</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowMovementModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau mouvement
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historique des mouvements</CardTitle>
              <CardDescription>100 derniers mouvements</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3 pr-4">
                  {movements
                    .filter((m) => movementFilter === 'all' || m.movement_type === movementFilter)
                    .map((movement: any) => (
                      <div key={movement.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{movement.stock_item?.name}</h3>
                              <Badge
                                variant={
                                  movement.movement_type === 'in'
                                    ? 'default'
                                    : movement.movement_type === 'out'
                                      ? 'destructive'
                                      : 'secondary'
                                }
                              >
                                {movement.movement_type === 'in' && (
                                  <>
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    Entrée
                                  </>
                                )}
                                {movement.movement_type === 'out' && (
                                  <>
                                    <TrendingDown className="w-3 h-3 mr-1" />
                                    Sortie
                                  </>
                                )}
                                {movement.movement_type === 'adjustment' && 'Ajustement'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(movement.created_at), 'PPP à HH:mm', { locale: fr })}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {movement.movement_type === 'out' && '-'}
                              {movement.quantity} {movement.stock_item?.unit}
                            </div>
                          </div>
                        </div>
                        {movement.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{movement.notes}</p>
                        )}
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowSupplierModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau fournisseur
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Fournisseurs</CardTitle>
              <CardDescription>Liste de vos fournisseurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map((supplier) => (
                  <Card key={supplier.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {supplier.contact && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Contact:</span> {supplier.contact}
                        </p>
                      )}
                      {supplier.email && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Email:</span> {supplier.email}
                        </p>
                      )}
                      {supplier.phone && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Tél:</span> {supplier.phone}
                        </p>
                      )}
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground">
                          {stockItems.filter((item) => item.supplier === supplier.name).length}{' '}
                          produit(s)
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          {!inventoryMode ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Inventaire périodique</h3>
                <p className="text-muted-foreground mb-6">
                  Lancez un inventaire pour compter physiquement vos stocks et détecter les écarts
                </p>
                <Button onClick={handleStartInventory}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Démarrer un inventaire
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Inventaire en cours</h3>
                  <p className="text-sm text-muted-foreground">
                    Saisissez les quantités physiques comptées
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setInventoryMode(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSaveInventory} disabled={processing}>
                    {processing ? 'Enregistrement...' : 'Enregistrer l\'inventaire'}
                  </Button>
                </div>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4 pr-4">
                      {inventoryItems.map((item, index) => (
                        <div key={item.stockItem.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{item.stockItem.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Stock système: {item.stockItem.quantity} {item.stockItem.unit}
                              </p>
                            </div>
                            {item.difference !== 0 && (
                              <Badge
                                variant={item.difference > 0 ? 'default' : 'destructive'}
                              >
                                {item.difference > 0 ? '+' : ''}
                                {item.difference} {item.stockItem.unit}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <Label>Quantité physique</Label>
                              <Input
                                type="number"
                                value={item.physicalCount}
                                onChange={(e) =>
                                  handleUpdateInventoryCount(index, parseFloat(e.target.value) || 0)
                                }
                                className="mt-1"
                              />
                            </div>
                            <div className="text-right">
                              <Label>Écart</Label>
                              <div
                                className={`text-lg font-bold mt-1 ${item.difference > 0 ? 'text-success' : item.difference < 0 ? 'text-destructive' : ''}`}
                              >
                                {item.difference > 0 ? '+' : ''}
                                {item.difference} {item.stockItem.unit}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select
              value={reportPeriod.toString()}
              onValueChange={(value) => setReportPeriod(parseInt(value) as 7 | 30 | 90)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 derniers jours</SelectItem>
                <SelectItem value="30">30 derniers jours</SelectItem>
                <SelectItem value="90">90 derniers jours</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => toast.info('Fonctionnalité d\'export à venir')}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Consommation par produit</CardTitle>
              <CardDescription>Top 10 des produits les plus consommés</CardDescription>
            </CardHeader>
            <CardContent>
              {consumptionData.items.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Aucune donnée de consommation sur cette période
                </p>
              ) : (
                <div className="space-y-6">
                  {consumptionData.items.map((item, index) => {
                    const total = item.quantities.reduce((sum, q) => sum + q, 0);
                    const max = Math.max(...item.quantities, 1);

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground">
                            Total: {total.toFixed(1)} unités
                          </span>
                        </div>
                        <div className="space-y-1">
                          {item.quantities.map((qty, qIndex) => (
                            <div key={qIndex} className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-12">
                                {consumptionData.dates[qIndex]}
                              </span>
                              <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${(qty / max) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium w-12 text-right">
                                {qty.toFixed(1)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Item Modal */}
      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Modifiez les informations du produit'
                : 'Ajoutez un nouveau produit à votre stock'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom du produit *</Label>
              <Input
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="Ex: Tomates"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unité *</Label>
                <Input
                  value={itemForm.unit}
                  onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                  placeholder="Ex: kg, L, pièces"
                />
              </div>

              {!editingItem && (
                <div className="space-y-2">
                  <Label>Quantité initiale</Label>
                  <Input
                    type="number"
                    value={itemForm.quantity}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, quantity: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Stock minimum *</Label>
                <Input
                  type="number"
                  value={itemForm.min_quantity}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, min_quantity: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Coût unitaire (FCFA)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={itemForm.unit_cost}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, unit_cost: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fournisseur</Label>
              <Input
                value={itemForm.supplier}
                onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value })}
                placeholder="Nom du fournisseur"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={editingItem ? handleUpdateItem : handleCreateItem}
              disabled={processing || !itemForm.name || !itemForm.unit}
            >
              {processing ? 'Enregistrement...' : editingItem ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement Modal */}
      <Dialog open={showMovementModal} onOpenChange={setShowMovementModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau mouvement de stock</DialogTitle>
            <DialogDescription>Enregistrez une entrée ou sortie de stock</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Produit *</Label>
              <Select
                value={movementForm.stock_item_id}
                onValueChange={(value) =>
                  setMovementForm({ ...movementForm, stock_item_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un produit" />
                </SelectTrigger>
                <SelectContent>
                  {stockItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.quantity} {item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type de mouvement *</Label>
              <Select
                value={movementForm.movement_type}
                onValueChange={(value: any) =>
                  setMovementForm({ ...movementForm, movement_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Entrée (réception)
                    </div>
                  </SelectItem>
                  <SelectItem value="out">
                    <div className="flex items-center">
                      <TrendingDown className="w-4 h-4 mr-2" />
                      Sortie (utilisation)
                    </div>
                  </SelectItem>
                  <SelectItem value="adjustment">Ajustement manuel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Quantité * {movementForm.movement_type === 'adjustment' && '(nouvelle quantité)'}
              </Label>
              <Input
                type="number"
                value={movementForm.quantity}
                onChange={(e) =>
                  setMovementForm({ ...movementForm, quantity: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={movementForm.notes}
                onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                placeholder="Ex: Livraison du 27/04, Utilisé pour service du midi..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovementModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAddMovement}
              disabled={processing || !movementForm.stock_item_id || movementForm.quantity <= 0}
            >
              {processing ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supplier Modal */}
      <Dialog open={showSupplierModal} onOpenChange={setShowSupplierModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau fournisseur</DialogTitle>
            <DialogDescription>Ajoutez un nouveau fournisseur</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                placeholder="Nom du fournisseur"
              />
            </div>

            <div className="space-y-2">
              <Label>Contact</Label>
              <Input
                value={supplierForm.contact}
                onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })}
                placeholder="Nom du contact"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                placeholder="email@exemple.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                placeholder="+33 1 23 45 67 89"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSupplierModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                toast.info('Fonctionnalité à venir');
                setShowSupplierModal(false);
              }}
              disabled={!supplierForm.name}
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

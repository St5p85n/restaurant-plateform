import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  Check,
  X,
  ChefHat,
  Clock,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Table, MenuItem, MenuCategory, Order, OrderItem } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
  subtotal: number;
}

type PaymentMethod = 'card' | 'cash' | 'wave' | 'orange_money';

export default function POSPage() {
  const { profile } = useAuth();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [step, setStep] = useState<'table' | 'order' | 'payment'>('table');
  
  // Table selection
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  
  // Menu
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  
  // Order
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  
  // Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cashReceived, setCashReceived] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Item modification
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurantId();
  }, [profile]);

  useEffect(() => {
    if (restaurantId) {
      loadInitialData();
    }
  }, [restaurantId]);

  useEffect(() => {
    filterMenuItems();
  }, [searchQuery, selectedCategory, menuItems]);

  useEffect(() => {
    calculateTotal();
  }, [cart]);

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

  const loadInitialData = async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);

      // Charger les tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('table_number', { ascending: true });

      if (tablesError) throw tablesError;
      setTables(tablesData || []);

      // Charger les catégories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Charger les items du menu
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .order('name', { ascending: true });

      if (itemsError) throw itemsError;
      setMenuItems(itemsData || []);
    } catch (error: any) {
      toast.error(`Erreur de chargement: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterMenuItems = () => {
    let filtered = menuItems;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.category_id === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  const calculateTotal = () => {
    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
    setCartTotal(total);
  };

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    setStep('order');
  };

  const handleAddToCart = (menuItem: MenuItem) => {
    setEditingItem(menuItem);
    setItemQuantity(1);
    setItemNotes('');
    setShowItemModal(true);
  };

  const confirmAddToCart = () => {
    if (!editingItem) return;

    const existingIndex = cart.findIndex(
      (item) => item.menuItem.id === editingItem.id && item.notes === itemNotes
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += itemQuantity;
      newCart[existingIndex].subtotal = newCart[existingIndex].quantity * editingItem.price;
      setCart(newCart);
    } else {
      setCart([
        ...cart,
        {
          menuItem: editingItem,
          quantity: itemQuantity,
          notes: itemNotes,
          subtotal: itemQuantity * editingItem.price,
        },
      ]);
    }

    setShowItemModal(false);
    setEditingItem(null);
    toast.success('Article ajouté au panier');
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantity += delta;

    if (newCart[index].quantity <= 0) {
      newCart.splice(index, 1);
    } else {
      newCart[index].subtotal = newCart[index].quantity * newCart[index].menuItem.price;
    }

    setCart(newCart);
  };

  const handleRemoveFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
    toast.success('Article retiré du panier');
  };

  const handleSendToKitchen = async () => {
    if (!restaurantId || !selectedTable || cart.length === 0) return;

    try {
      setProcessing(true);

      // Créer la commande
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurantId,
          table_id: selectedTable.id,
          status: 'pending',
          payment_status: 'pending',
          total: cartTotal,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Créer les items de commande
      const orderItems = cart.map((item) => ({
        order_id: orderData.id,
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        unit_price: item.menuItem.price,
        subtotal: item.subtotal,
        special_instructions: item.notes || null,
        status: 'pending',
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Mettre à jour le statut de la table
      const { error: tableError } = await supabase
        .from('tables')
        .update({ status: 'occupied' })
        .eq('id', selectedTable.id);

      if (tableError) throw tableError;

      setCurrentOrder(orderData);
      toast.success('Commande envoyée en cuisine!');
      setStep('payment');
    } catch (error: any) {
      toast.error(`Erreur d'envoi: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!currentOrder || !restaurantId) return;

    try {
      setProcessing(true);

      if (paymentMethod === 'card') {
        // Paiement par carte via Stripe
        const orderItems = cart.map((item) => ({
          name: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity,
          image_url: item.menuItem.image_url || '',
        }));

        const { data, error } = await supabase.functions.invoke('create_stripe_checkout', {
          body: {
            items: orderItems,
            currency: 'eur',
            payment_method_types: ['card'],
          },
        });

        if (error) throw error;

        // Ouvrir Stripe Checkout dans un nouvel onglet
        if (data?.url) {
          window.open(data.url, '_blank');
          toast.success('Redirection vers le paiement...');
        }
      } else {
        // Paiement cash, Wave, Orange Money
        const { error } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            payment_method: paymentMethod,
            status: 'completed',
          })
          .eq('id', currentOrder.id);

        if (error) throw error;

        // Libérer la table
        if (selectedTable) {
          await supabase
            .from('tables')
            .update({ status: 'available' })
            .eq('id', selectedTable.id);
        }

        toast.success('Paiement enregistré avec succès!');
        handlePrintReceipt();
        resetPOS();
      }
    } catch (error: any) {
      toast.error(`Erreur de paiement: ${error.message}`);
    } finally {
      setProcessing(false);
      setShowPaymentModal(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!currentOrder || !selectedTable) return;

    // Générer le contenu du ticket
    const receiptContent = `
      ========================================
      RESTAURANT - TICKET DE CAISSE
      ========================================
      
      Date: ${format(new Date(), 'PPP à HH:mm', { locale: fr })}
      Table: ${selectedTable.table_number}
      Commande: ${currentOrder.order_number}
      
      ----------------------------------------
      ARTICLES
      ----------------------------------------
      ${cart
        .map(
          (item) =>
            `${item.quantity}x ${item.menuItem.name}\n   ${item.menuItem.price.toFixed(2)}FCFA x ${item.quantity} = ${item.subtotal.toFixed(2)}FCFA${item.notes ? `\n   Note: ${item.notes}` : ''}`
        )
        .join('\n\n')}
      
      ----------------------------------------
      TOTAL: ${cartTotal.toFixed(2)}FCFA
      ----------------------------------------
      
      Mode de paiement: ${paymentMethod === 'card' ? 'Carte bancaire' : paymentMethod === 'cash' ? 'Espèces' : paymentMethod === 'wave' ? 'Wave' : 'Orange Money'}
      ${paymentMethod === 'cash' && cashReceived ? `\nReçu: ${parseFloat(cashReceived).toFixed(2)}FCFA\nRendu: ${(parseFloat(cashReceived) - cartTotal).toFixed(2)}FCFA` : ''}
      
      ========================================
      Merci de votre visite!
      ========================================
    `;

    // Créer une fenêtre d'impression
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket de caisse</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.4;
                white-space: pre-wrap;
                margin: 20px;
              }
            </style>
          </head>
          <body>${receiptContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }

    toast.success('Ticket imprimé!');
  };

  const resetPOS = () => {
    setStep('table');
    setSelectedTable(null);
    setCart([]);
    setCartTotal(0);
    setCurrentOrder(null);
    setSearchQuery('');
    setSelectedCategory('all');
    setCashReceived('');
    loadInitialData();
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
              Vous devez inscrire votre restaurant pour accéder au système de caisse.
            </p>
            <Button onClick={() => window.location.href = '/register-restaurant'}>
              Inscrire mon restaurant
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Les Tables</h1>
          <p className="text-muted-foreground">
            {step === 'table' && 'Sélectionnez une table'}
            {step === 'order' && `Table ${selectedTable?.table_number} - Prise de commande`}
            {step === 'payment' && `Table ${selectedTable?.table_number} - Encaissement`}
          </p>
        </div>
        {step !== 'table' && (
          <Button variant="outline" onClick={() => setStep(step === 'payment' ? 'order' : 'table')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        )}
      </div>

      {/* Step 1: Table Selection */}
      {step === 'table' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tables.map((table) => (
            <Card
              key={table.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                table.status === 'occupied' ? 'border-warning' : 'border-border'
              }`}
              onClick={() => table.status === 'available' && handleTableSelect(table)}
            >
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold mb-2">Table {table.table_number}</div>
                <Badge
                  variant={
                    table.status === 'available'
                      ? 'default'
                      : table.status === 'occupied'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {table.status === 'available' ? 'Libre' : table.status === 'occupied' ? 'Occupée' : 'Réservée'}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">{table.capacity} places</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Step 2: Order Taking */}
      {step === 'order' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher un plat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Categories */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="all">Tous</TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Menu Items */}
            <ScrollArea className="h-[600px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="cursor-pointer hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.name}</h3>
                          {item.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-primary">{item.price.toFixed(2)} FCFA</span>
                        <Button size="sm" onClick={() => handleAddToCart(item)}>
                          <Plus className="w-4 h-4 mr-1" />
                          Ajouter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Cart */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Panier ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Panier vide</p>
                ) : (
                  <>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-3">
                        {cart.map((item, index) => (
                          <div key={index} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium">{item.menuItem.name}</p>
                                {item.notes && (
                                  <p className="text-xs text-muted-foreground mt-1">Note: {item.notes}</p>
                                )}
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemoveFromCart(index)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => handleUpdateQuantity(index, -1)}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => handleUpdateQuantity(index, 1)}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                              <span className="font-bold">{item.subtotal.toFixed(2)} FCFA</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">{cartTotal.toFixed(2)} FCFA</span>
                      </div>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleSendToKitchen}
                        disabled={processing}
                      >
                        <ChefHat className="w-5 h-5 mr-2" />
                        {processing ? 'Envoi...' : 'Envoyer en cuisine'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 'payment' && currentOrder && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Récapitulatif de la commande</CardTitle>
              <CardDescription>
                Commande #{currentOrder.order_number} - Table {selectedTable?.table_number}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                {cart.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">
                        {item.quantity}x {item.menuItem.name}
                      </p>
                      {item.notes && <p className="text-sm text-muted-foreground">Note: {item.notes}</p>}
                    </div>
                    <span className="font-bold">{item.subtotal.toFixed(2)} FCFA</span>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between text-xl font-bold mb-6">
                <span>Total à payer</span>
                <span className="text-primary">{cartTotal.toFixed(2)} FCFA</span>
              </div>

              <Button className="w-full" size="lg" onClick={() => setShowPaymentModal(true)}>
                <CreditCard className="w-5 h-5 mr-2" />
                Procéder au paiement
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Item Modification Modal */}
      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter au panier</DialogTitle>
            <DialogDescription>{editingItem?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quantité</Label>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setItemQuantity(itemQuantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes spéciales (optionnel)</Label>
              <Textarea
                placeholder="Ex: Sans oignons, bien cuit..."
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">Sous-total</span>
              <span className="text-lg font-bold text-primary">
                {editingItem ? (editingItem.price * itemQuantity).toFixed(2) : '0.00'} FCFA
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemModal(false)}>
              Annuler
            </Button>
            <Button onClick={confirmAddToCart}>
              <Check className="w-4 h-4 mr-2" />
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mode de paiement</DialogTitle>
            <DialogDescription>Sélectionnez le mode de paiement</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                className="h-24 flex-col"
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard className="w-8 h-8 mb-2" />
                <span>Carte bancaire</span>
              </Button>

              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                className="h-24 flex-col"
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote className="w-8 h-8 mb-2" />
                <span>Espèces</span>
              </Button>

              <Button
                variant={paymentMethod === 'wave' ? 'default' : 'outline'}
                className="h-24 flex-col"
                onClick={() => setPaymentMethod('wave')}
              >
                <Smartphone className="w-8 h-8 mb-2" />
                <span>Wave</span>
              </Button>

              <Button
                variant={paymentMethod === 'orange_money' ? 'default' : 'outline'}
                className="h-24 flex-col"
                onClick={() => setPaymentMethod('orange_money')}
              >
                <Smartphone className="w-8 h-8 mb-2" />
                <span>Orange Money</span>
              </Button>
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <Label>Montant reçu</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                />
                {cashReceived && parseFloat(cashReceived) >= cartTotal && (
                  <p className="text-sm text-success">
                    Rendu: {(parseFloat(cashReceived) - cartTotal).toFixed(2)} FCFA
                  </p>
                )}
              </div>
            )}

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total à payer</span>
                <span className="text-primary">{cartTotal.toFixed(2)} FCFA</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={handlePayment}
              disabled={
                processing ||
                (paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < cartTotal))
              }
            >
              {processing ? 'Traitement...' : 'Confirmer le paiement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

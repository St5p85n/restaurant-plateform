import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Smartphone, Banknote, Check } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import DemoPaymentModal from '@/components/payment/DemoPaymentModal';
import type { DemoPaymentMethod } from '@/components/payment/DemoPaymentModal';

type PaymentMethod = DemoPaymentMethod | 'cash';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    delivery_notes: '',
    payment_method: 'card' as PaymentMethod,
  });

  useEffect(() => {
    if (cart.items.length === 0) {
      toast.error('Votre panier est vide');
      navigate('/restaurants');
    }
  }, [cart.items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Empêcher la double soumission si une commande est déjà en cours/créée
    if (loading || pendingOrderId) return;

    if (!cart.restaurantId) {
      toast.error('Restaurant non sélectionné');
      return;
    }

    setLoading(true);

    try {
      // 1. Créer l'adresse de livraison
      const { data: addressData, error: addressError } = await supabase
        .from('delivery_addresses')
        .insert({
          customer_id: user?.id || null,
          full_name: formData.full_name,
          phone: formData.phone,
          address_line1: formData.address_line1,
          address_line2: formData.address_line2 || null,
          city: formData.city,
          postal_code: formData.postal_code || null,
        })
        .select()
        .single();

      if (addressError) {
        toast.error(`Erreur lors de la création de l'adresse : ${addressError.message}`);
        setLoading(false);
        return;
      }
      if (!addressData) {
        toast.error("Impossible de créer l'adresse de livraison");
        setLoading(false);
        return;
      }

      // 2. Calculer les montants
      const subtotal = cart.getTotal();
      const tax = subtotal * 0.1;
      const total = subtotal + tax;

      // 3. Créer la commande (statut pending jusqu'au paiement)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: cart.restaurantId,
          customer_id: user?.id || null,
          order_type: 'delivery',
          status: 'pending',
          delivery_status: 'pending',
          delivery_address_id: addressData.id,
          delivery_notes: formData.delivery_notes || null,
          payment_method: formData.payment_method,
          payment_status: formData.payment_method === 'cash' ? 'pending' : 'unpaid',
          subtotal,
          tax,
          total,
          estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (orderError) {
        toast.error(`Erreur lors de la création de la commande : ${orderError.message}`);
        setLoading(false);
        return;
      }
      if (!orderData) {
        toast.error('Impossible de créer la commande');
        setLoading(false);
        return;
      }

      // 4. Créer les articles de commande
      const orderItems = cart.items.map((item) => ({
        order_id: orderData.id,
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        unit_price: item.menuItem.price,
        subtotal: item.menuItem.price * item.quantity,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) {
        toast.error(`Erreur lors de l'ajout des articles : ${itemsError.message}`);
        setLoading(false);
        return;
      }

      // 5. Paiement en espèces → directement confirmé
      if (formData.payment_method === 'cash') {
        cart.clearCart();
        toast.success('Commande passée avec succès !');
        navigate(`/order/${orderData.id}`);
        return;
      }

      // 6. Paiement électronique → ouvrir le modal démo
      // Le loading reste true pour bloquer le bouton tant que le modal est ouvert
      setPendingOrderId(orderData.id);
      setShowPaymentModal(true);
    } catch (error: any) {
      console.error('Erreur lors de la commande:', error);
      // Détecter les erreurs réseau (Load failed, AbortError, connexion coupée)
      const isNetworkError =
        error?.name === 'AbortError' ||
        error?.message === 'Load failed' ||
        error?.message === 'Failed to fetch' ||
        error?.message?.toLowerCase().includes('network') ||
        error?.message?.toLowerCase().includes('load failed');

      if (isNetworkError) {
        toast.error('Connexion interrompue. Vérifiez votre réseau et réessayez.');
      } else {
        toast.error('Une erreur est survenue lors de la commande. Veuillez réessayer.');
      }
      setLoading(false);
    }
    // Pas de finally setLoading(false) ici : le loading reste true
    // tant que le modal de paiement est ouvert (bloque le double-clic)
  };

  const handlePaymentSuccess = (orderId: string) => {
    cart.clearCart();
    toast.success('Paiement confirmé — commande en cours de préparation !');
    navigate(`/order/${orderId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-medium">Finaliser la commande</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations de livraison */}
              <Card>
                <CardHeader>
                  <CardTitle>Adresse de livraison</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nom complet *</Label>
                      <Input
                        id="full_name"
                        required
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address_line1">Adresse *</Label>
                    <Input
                      id="address_line1"
                      required
                      value={formData.address_line1}
                      onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address_line2">Complément d'adresse</Label>
                    <Input
                      id="address_line2"
                      value={formData.address_line2}
                      onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Ville *</Label>
                      <Input
                        id="city"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Code postal</Label>
                      <Input
                        id="postal_code"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_notes">Instructions de livraison</Label>
                    <Textarea
                      id="delivery_notes"
                      value={formData.delivery_notes}
                      onChange={(e) => setFormData({ ...formData, delivery_notes: e.target.value })}
                      placeholder="Ex: Sonner à l'interphone, 2ème étage..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Mode de paiement */}
              <Card>
                <CardHeader>
                  <CardTitle>Mode de paiement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Bandeau démo */}
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">Démo</Badge>
                    <span>Aucun débit réel — simulation de paiement uniquement.</span>
                  </div>

                  {(
                    [
                      { id: 'card', label: 'Carte bancaire', sub: 'Visa, Mastercard (Démo)', icon: CreditCard },
                      { id: 'wave', label: 'Wave', sub: 'Paiement mobile (Démo)', icon: Smartphone },
                      { id: 'orange_money', label: 'Orange Money', sub: 'Paiement mobile (Démo)', icon: Smartphone },
                      { id: 'cash', label: 'Espèces', sub: 'Paiement à la livraison', icon: Banknote },
                    ] as const
                  ).map(({ id, label, sub, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_method: id })}
                      className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                        formData.payment_method === id
                          ? 'border-foreground bg-muted/30'
                          : 'border-border hover:border-foreground/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                          formData.payment_method === id ? 'border-foreground' : 'border-muted-foreground'
                        }`}>
                          {formData.payment_method === id && (
                            <div className="h-2 w-2 rounded-full bg-foreground" />
                          )}
                        </div>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">{sub}</p>
                        </div>
                        {formData.payment_method === id && (
                          <Check className="h-4 w-4 text-foreground shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Button type="submit" className="w-full" disabled={loading || !!pendingOrderId}>
                {loading ? 'Commande en cours...' : 'Valider la commande'}
              </Button>
            </form>
          </div>

          {/* Récapitulatif */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div key={item.menuItem.id} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.menuItem.name}
                      </span>
                      <span>{(item.menuItem.price * item.quantity).toFixed(2)} FCFA</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total</span>
                    <span>{cart.getTotal().toFixed(2)} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>TVA (10%)</span>
                    <span>{(cart.getTotal() * 0.1).toFixed(2)} FCFA</span>
                  </div>
                  <div className="flex justify-between text-lg font-medium pt-2 border-t border-border">
                    <span>Total</span>
                    <span>{(cart.getTotal() * 1.1).toFixed(2)} FCFA</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border text-sm text-muted-foreground">
                  <p>Livraison estimée: 45 minutes</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de paiement démo */}
      {pendingOrderId && formData.payment_method !== 'cash' && (
        <DemoPaymentModal
          open={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setLoading(false);
          }}
          onSuccess={handlePaymentSuccess}
          orderId={pendingOrderId}
          amount={cart.getTotal() * 1.1}
          paymentMethod={formData.payment_method as DemoPaymentMethod}
        />
      )}
    </div>
  );
}

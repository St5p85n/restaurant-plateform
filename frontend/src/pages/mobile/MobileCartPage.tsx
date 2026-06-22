import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import CartItemCard from '@/components/mobile/CartItemCard';
import AddressSelector from '@/components/mobile/AddressSelector';
import PaymentMethodSelector from '@/components/mobile/PaymentMethodSelector';
import DemoPaymentModal from '@/components/payment/DemoPaymentModal';
import type { DemoPaymentMethod } from '@/components/payment/DemoPaymentModal';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image_url?: string;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  special_instructions?: string;
}

interface Restaurant {
  id: string;
  name: string;
}

interface DeliveryAddress {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code?: string;
  is_default: boolean;
}

type PaymentMethod = 'card' | 'wave' | 'orange_money' | 'cash';

export default function MobileCartPage() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | undefined>();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('card');
  const [processing, setProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const deliveryFee = 1000; // Frais de livraison fixes
  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const total = subtotal + deliveryFee;

  useEffect(() => {
    // Récupérer le panier et le restaurant depuis l'état de navigation
    if (location.state) {
      const { cart: stateCart, restaurant: stateRestaurant } = location.state as {
        cart: CartItem[];
        restaurant: Restaurant;
      };
      setCart(stateCart || []);
      setRestaurant(stateRestaurant || null);
    }

    // Si pas de données dans l'état, rediriger
    if (!location.state || !location.state.cart || location.state.cart.length === 0) {
      toast.error('Votre panier est vide');
      navigate(`/mobile/restaurant/${restaurantId}`);
    }
  }, [location.state, restaurantId, navigate]);

  const handleIncreaseQuantity = (menuItemId: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.menuItem.id === menuItemId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const handleDecreaseQuantity = (menuItemId: string) => {
    setCart((prev) => {
      const item = prev.find((i) => i.menuItem.id === menuItemId);
      if (item && item.quantity > 1) {
        return prev.map((i) =>
          i.menuItem.id === menuItemId
            ? { ...i, quantity: i.quantity - 1 }
            : i
        );
      }
      return prev.filter((i) => i.menuItem.id !== menuItemId);
    });
  };

  const handleRemoveItem = (menuItemId: string) => {
    setCart((prev) => prev.filter((item) => item.menuItem.id !== menuItemId));
    if (cart.length === 1) {
      toast.info('Panier vide');
      navigate(`/mobile/restaurant/${restaurantId}`);
    }
  };

  const handleAddNewAddress = () => {
    toast.info('Fonctionnalité à venir : Ajouter une adresse');
    // TODO: Naviguer vers la page d'ajout d'adresse
    // navigate('/mobile/profile/addresses/new');
  };

  const handlePlaceOrder = async () => {
    if (processing || pendingOrderId) return; // garde double-soumission

    if (!profile) {
      toast.error('Vous devez être connecté pour passer commande');
      navigate('/login');
      return;
    }
    if (!selectedAddress) {
      toast.error('Veuillez sélectionner une adresse de livraison');
      return;
    }
    if (cart.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }

    setProcessing(true);
    try {
      // Créer la commande en DB
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurantId,
          customer_id: profile.id,
          order_type: 'delivery',
          subtotal,
          tax: 0,
          total,
          payment_method: selectedPaymentMethod,
          payment_status: selectedPaymentMethod === 'cash' ? 'pending' : 'unpaid',
          delivery_status: 'pending',
          delivery_address_id: selectedAddress.id,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map((item) => ({
        order_id: orderData.id,
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        unit_price: item.menuItem.price,
        subtotal: item.menuItem.price * item.quantity,
        special_instructions: item.special_instructions,
        status: 'pending',
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      if (selectedPaymentMethod === 'cash') {
        toast.success('Commande passée avec succès !');
        navigate(`/mobile/order-confirmation/${orderData.id}`);
        return;
      }

      // Ouvrir le modal de paiement démo
      // processing reste true pour bloquer le bouton tant que le modal est ouvert
      setPendingOrderId(orderData.id);
      setShowPaymentModal(true);
    } catch (error: any) {
      console.error('Erreur création commande:', error);
      const isNetworkError =
        error?.name === 'AbortError' ||
        error?.message === 'Load failed' ||
        error?.message === 'Failed to fetch' ||
        error?.message?.toLowerCase().includes('network') ||
        error?.message?.toLowerCase().includes('load failed');
      if (isNetworkError) {
        toast.error('Connexion interrompue. Vérifiez votre réseau et réessayez.');
      } else {
        toast.error(`Erreur : ${error.message}`);
      }
      setProcessing(false);
    }
    // Pas de finally setProcessing(false) : le bouton reste bloqué tant que le modal est ouvert
  };

  const handlePaymentSuccess = (orderId: string) => {
    toast.success('Paiement confirmé — commande en cours de préparation !');
    navigate(`/mobile/order-confirmation/${orderId}`);
  };

  if (!restaurant || cart.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* En-tête */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => navigate(`/mobile/restaurant/${restaurantId}`)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Panier</h1>
            <p className="text-sm text-muted-foreground">{restaurant.name}</p>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="space-y-4 p-4">
        {/* Articles du panier */}
        <div className="space-y-3">
          <h2 className="font-semibold">
            Vos articles ({cart.length})
          </h2>
          {cart.map((item) => (
            <CartItemCard
              key={item.menuItem.id}
              id={item.menuItem.id}
              name={item.menuItem.name}
              price={item.menuItem.price}
              quantity={item.quantity}
              image_url={item.menuItem.image_url}
              special_instructions={item.special_instructions}
              onIncrease={() => handleIncreaseQuantity(item.menuItem.id)}
              onDecrease={() => handleDecreaseQuantity(item.menuItem.id)}
              onRemove={() => handleRemoveItem(item.menuItem.id)}
            />
          ))}
        </div>

        {/* Sélection de l'adresse */}
        <AddressSelector
          selectedAddressId={selectedAddress?.id}
          onSelectAddress={setSelectedAddress}
          onAddNew={handleAddNewAddress}
        />

        {/* Sélection du mode de paiement */}
        <PaymentMethodSelector
          selectedMethod={selectedPaymentMethod}
          onSelectMethod={setSelectedPaymentMethod}
        />

        {/* Récapitulatif des coûts */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <h3 className="font-semibold">Récapitulatif</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{subtotal.toLocaleString()} FCFA</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Frais de livraison</span>
                <span>{deliveryFee.toLocaleString()} FCFA</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span className="text-primary">{total.toLocaleString()} FCFA</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Note pour paiement cash */}
        {selectedPaymentMethod === 'cash' && (
          <Card className="border-border/60">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                💡 Vous paierez en espèces à la livraison. Préparez le montant exact si possible.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Bandeau mode démo */}
        {selectedPaymentMethod !== 'cash' && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide shrink-0">Démo</Badge>
            <span>Aucun débit réel — simulation de paiement uniquement.</span>
          </div>
        )}
      </div>

      {/* Bouton de validation fixe */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background p-4">
        <Button
          size="lg"
          className="w-full"
          onClick={handlePlaceOrder}
          disabled={processing || !!pendingOrderId || !selectedAddress}
        >
          {processing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
              Traitement...
            </>
          ) : (
            <>
              <ShoppingBag className="mr-2 h-5 w-5" />
              Commander • {total.toLocaleString()} FCFA
            </>
          )}
        </Button>
      </div>

      {/* Modal de paiement démo */}
      {pendingOrderId && selectedPaymentMethod !== 'cash' && (
        <DemoPaymentModal
          open={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setProcessing(false);
          }}
          onSuccess={handlePaymentSuccess}
          orderId={pendingOrderId}
          amount={total}
          paymentMethod={selectedPaymentMethod as DemoPaymentMethod}
        />
      )}
    </div>
  );
}

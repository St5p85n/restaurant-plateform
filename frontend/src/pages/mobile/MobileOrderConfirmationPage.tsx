import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Home, Package } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  restaurant: {
    name: string;
  };
}

export default function MobileOrderConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant:restaurants(name)
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
      navigate('/mobile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Contenu */}
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Icône de succès */}
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Commande confirmée !</h1>
              <p className="text-muted-foreground">
                Votre commande a été passée avec succès
              </p>
            </div>
          </div>

          {/* Détails de la commande */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Numéro de commande
                  </span>
                  <span className="font-mono font-semibold">
                    #{order.order_number}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Restaurant
                  </span>
                  <span className="font-medium">{order.restaurant?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Montant</span>
                  <span className="text-lg font-semibold text-primary">
                    {order.total.toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="space-y-2 text-sm">
                <p className="font-medium">📱 Que se passe-t-il maintenant ?</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Le restaurant prépare votre commande</li>
                  <li>• Un livreur sera assigné sous peu</li>
                  <li>• Vous recevrez des notifications à chaque étape</li>
                  <li>• Temps de livraison estimé : 30-45 min</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate(`/mobile/orders/${order.id}`)}
            >
              <Package className="mr-2 h-5 w-5" />
              Suivre ma commande
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => navigate('/mobile')}
            >
              <Home className="mr-2 h-5 w-5" />
              Retour à l'accueil
            </Button>
          </div>

          {/* Message de remerciement */}
          <p className="text-center text-sm text-muted-foreground">
            Merci pour votre commande ! 🎉
          </p>
        </div>
      </div>
    </div>
  );
}

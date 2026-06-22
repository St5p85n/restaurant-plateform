import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Home, Package } from 'lucide-react';

export default function MobilePaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      verifyPayment(sessionId);
    } else {
      setError('ID de session manquant');
      setVerifying(false);
    }
  }, [searchParams]);

  const verifyPayment = async (sessionId: string) => {
    try {
      setVerifying(true);

      // Appeler l'Edge Function pour vérifier le paiement
      const { data, error } = await supabase.functions.invoke('verify_stripe_payment', {
        body: { sessionId },
      });

      if (error) {
        const errorMsg = await error?.context?.text?.();
        throw new Error(errorMsg || error.message);
      }

      if (data?.code === 'SUCCESS' && data?.data?.verified) {
        setVerified(true);

        // Récupérer l'ID de commande depuis la session
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('id')
          .eq('stripe_session_id', sessionId)
          .single();

        if (orderError) throw orderError;
        setOrderId(orderData.id);

        toast.success('Paiement confirmé !');
      } else {
        setError('Le paiement n\'a pas été confirmé');
      }
    } catch (error: any) {
      console.error('Erreur vérification paiement:', error);
      setError(error.message || 'Erreur lors de la vérification du paiement');
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">
            Vérification du paiement...
          </p>
        </div>
      </div>
    );
  }

  if (error || !verified) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold">Paiement échoué</h1>
                <p className="text-muted-foreground">
                  {error || 'Une erreur est survenue lors du paiement'}
                </p>
              </div>
            </div>

            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  💡 Votre commande n'a pas été validée. Vous pouvez réessayer ou contacter le support.
                </p>
              </CardContent>
            </Card>

            <div className="space-y-3">
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Paiement réussi !</h1>
              <p className="text-muted-foreground">
                Votre paiement a été confirmé avec succès
              </p>
            </div>
          </div>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="space-y-2 text-sm">
                <p className="font-medium">✅ Paiement confirmé</p>
                <p className="text-muted-foreground">
                  Votre commande est maintenant en cours de préparation. Vous recevrez des notifications à chaque étape.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {orderId && (
              <Button
                size="lg"
                className="w-full"
                onClick={() => navigate(`/mobile/order-confirmation/${orderId}`)}
              >
                <Package className="mr-2 h-5 w-5" />
                Voir ma commande
              </Button>
            )}
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
        </div>
      </div>
    </div>
  );
}

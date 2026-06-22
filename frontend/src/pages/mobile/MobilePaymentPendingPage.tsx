import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Smartphone, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface MobilePayment {
  id: string;
  order_id: string;
  payment_method: string;
  phone_number: string;
  amount: number;
  status: string;
  transaction_id: string;
  expires_at: string;
}

export default function MobilePaymentPendingPage() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<MobilePayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (paymentId) {
      loadPayment();
      
      // Polling toutes les 3 secondes
      const pollInterval = setInterval(() => {
        if (polling) {
          checkPaymentStatus();
        }
      }, 3000);

      return () => clearInterval(pollInterval);
    }
  }, [paymentId, polling]);

  useEffect(() => {
    if (payment?.expires_at) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(payment.expires_at).getTime();
        const diff = Math.max(0, expiry - now);
        
        setTimeLeft(Math.floor(diff / 1000));
        
        if (diff <= 0) {
          setPolling(false);
          handleExpired();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [payment?.expires_at]);

  const loadPayment = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mobile_payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error) throw error;
      setPayment(data);

      // Si déjà payé ou échoué, arrêter le polling
      if (data.status === 'paid' || data.status === 'failed' || data.status === 'cancelled') {
        setPolling(false);
        if (data.status === 'paid') {
          handleSuccess(data.order_id);
        }
      }
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
      navigate('/mobile');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!payment) return;

    try {
      const functionName = payment.payment_method === 'wave' 
        ? 'verify_wave_payment' 
        : 'verify_orange_money_payment';

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { paymentId: payment.id },
      });

      if (error) {
        const errorMsg = await error?.context?.text?.();
        console.error('Erreur vérification:', errorMsg || error.message);
        return;
      }

      if (data?.code === 'SUCCESS') {
        const status = data.data.status;
        
        if (status === 'paid') {
          setPolling(false);
          handleSuccess(payment.order_id);
        } else if (status === 'failed') {
          setPolling(false);
          setPayment({ ...payment, status: 'failed' });
        } else if (status === 'expired') {
          setPolling(false);
          handleExpired();
        }
      }
    } catch (error: any) {
      console.error('Erreur polling:', error);
    }
  };

  const handleSuccess = (orderId: string) => {
    toast.success('Paiement confirmé !');
    navigate(`/mobile/order-confirmation/${orderId}`);
  };

  const handleExpired = () => {
    toast.error('Le paiement a expiré');
    setPayment(prev => prev ? { ...prev, status: 'expired' } : null);
  };

  const handleCancel = async () => {
    if (!payment) return;

    try {
      await supabase
        .from('mobile_payments')
        .update({ status: 'cancelled' })
        .eq('id', payment.id);

      toast.info('Paiement annulé');
      navigate('/mobile');
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPaymentMethodName = () => {
    return payment?.payment_method === 'wave' ? 'Wave' : 'Orange Money';
  };

  const getPaymentMethodIcon = () => {
    return payment?.payment_method === 'wave' ? '📱' : '🍊';
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

  if (!payment) {
    return null;
  }

  // Affichage selon le statut
  if (payment.status === 'paid') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Paiement réussi !</h1>
              <p className="text-muted-foreground">
                Votre paiement {getPaymentMethodName()} a été confirmé
              </p>
            </div>
          </div>
          <Button
            size="lg"
            className="w-full"
            onClick={() => navigate(`/mobile/order-confirmation/${payment.order_id}`)}
          >
            Voir ma commande
          </Button>
        </div>
      </div>
    );
  }

  if (payment.status === 'failed' || payment.status === 'expired') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">
                {payment.status === 'expired' ? 'Paiement expiré' : 'Paiement échoué'}
              </h1>
              <p className="text-muted-foreground">
                {payment.status === 'expired' 
                  ? 'Le délai de paiement a expiré'
                  : 'Une erreur est survenue lors du paiement'}
              </p>
            </div>
          </div>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => navigate('/mobile')}
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  // Affichage en attente
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Animation d'attente */}
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Smartphone className="h-10 w-10 text-primary animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-semibold">
                {getPaymentMethodIcon()}
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">En attente de paiement</h1>
              <p className="text-muted-foreground">
                Confirmez le paiement sur votre téléphone
              </p>
            </div>
          </div>

          {/* Détails du paiement */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Méthode</span>
                <span className="font-medium">{getPaymentMethodName()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Numéro</span>
                <span className="font-medium font-mono">{payment.phone_number}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Montant</span>
                <span className="text-lg font-semibold text-primary">
                  {payment.amount.toLocaleString()} FCFA
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Temps restant */}
          {timeLeft > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-center justify-center gap-2 p-4">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  Temps restant : {formatTime(timeLeft)}
                </span>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="font-medium">Instructions :</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Vérifiez votre téléphone</li>
                    <li>Vous devriez recevoir une notification</li>
                    <li>Entrez votre code PIN pour confirmer</li>
                    <li>Le paiement sera validé automatiquement</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bouton annuler */}
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleCancel}
          >
            Annuler le paiement
          </Button>

          {/* Indicateur de vérification */}
          <p className="text-center text-xs text-muted-foreground">
            Vérification automatique en cours...
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CreditCard, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import PricingCard from '@/components/restaurant/PricingCard';

interface Plan {
  plan_name: string;
  plan_type: 'monthly' | 'annual' | 'per_user';
  monthly_price: number;
  annual_price: number;
  features: string[];
  recommended: boolean;
}

interface CurrentSubscription {
  id: string;
  plan: 'monthly' | 'annual' | 'per_user';
  status: 'active' | 'suspended' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string | null;
  amount: number;
  currency: string;
}

export default function SubscriptionPage() {
  const { profile } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<{
    planName: string;
    billingCycle: 'monthly' | 'annual';
    amount: number;
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les plans disponibles
      const { data: plansData, error: plansError } = await supabase.rpc('get_available_plans');
      if (plansError) throw plansError;
      setPlans(plansData || []);

      // Charger l'abonnement actuel si le restaurant existe
      if (profile?.restaurant_id) {
        const { data: subData, error: subError } = await supabase.rpc(
          'get_restaurant_subscription',
          { p_restaurant_id: profile.restaurant_id }
        );

        if (subError && !subError.message.includes('no rows')) {
          throw subError;
        }

        if (subData && subData.length > 0) {
          setCurrentSubscription(subData[0]);
        }
      }
    } catch (error: any) {
      toast.error(`Erreur lors du chargement: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planName: string, billingCycle: 'monthly' | 'annual', amount: number) => {
    setSelectedPlan({ planName, billingCycle, amount });
    setShowConfirmDialog(true);
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlan || !profile?.restaurant_id) return;

    try {
      setProcessing(true);

      // Calculer la date de fin
      const endDate = new Date();
      if (selectedPlan.billingCycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Créer l'abonnement
      const { data, error } = await supabase.rpc('create_restaurant_subscription', {
        p_restaurant_id: profile.restaurant_id,
        p_plan: selectedPlan.billingCycle,
        p_amount: selectedPlan.amount,
        p_currency: 'FCFA',
        p_end_date: endDate.toISOString(),
      });

      if (error) throw error;

      if (data && !data.success) {
        toast.error(data.error || 'Erreur lors de la création de l\'abonnement');
        return;
      }

      toast.success('Abonnement activé avec succès!');
      setShowConfirmDialog(false);
      setSelectedPlan(null);
      loadData();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      active: { variant: 'default', label: 'Actif' },
      suspended: { variant: 'secondary', label: 'Suspendu' },
      cancelled: { variant: 'destructive', label: 'Annulé' },
      expired: { variant: 'outline', label: 'Expiré' },
    };
    const config = variants[status] || variants.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Chargement des abonnements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Abonnement</h1>
            <p className="text-sm text-muted-foreground">
              Choisissez le plan qui correspond à vos besoins
            </p>
          </div>
        </div>
      </div>

      {/* Abonnement actuel */}
      {currentSubscription && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Abonnement actuel</CardTitle>
              {getStatusBadge(currentSubscription.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Plan</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {currentSubscription.plan === 'monthly' ? 'Mensuel' : 'Annuel'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Montant</p>
                  <p className="text-sm text-muted-foreground">
                    {currentSubscription.amount.toLocaleString()} {currentSubscription.currency}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Date de début</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(currentSubscription.start_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              {currentSubscription.end_date && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                    <AlertCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date de fin</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(currentSubscription.end_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans disponibles */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Plans disponibles</h2>
          <p className="text-sm text-muted-foreground">
            Changez de plan à tout moment selon vos besoins
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard
              key={plan.plan_name}
              planName={plan.plan_name}
              planType={plan.plan_type}
              monthlyPrice={plan.monthly_price}
              annualPrice={plan.annual_price}
              features={plan.features}
              recommended={plan.recommended}
              currentPlan={
                currentSubscription?.status === 'active' &&
                plan.plan_name.toLowerCase() === 'professional' // Simplification pour l'exemple
              }
              onSelect={(billingCycle, amount) =>
                handleSelectPlan(plan.plan_name, billingCycle, amount)
              }
              loading={processing}
            />
          ))}
        </div>
      </div>

      {/* Dialog de confirmation */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'abonnement</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Vous êtes sur le point de souscrire au plan <strong>{selectedPlan?.planName}</strong>{' '}
                avec facturation <strong>{selectedPlan?.billingCycle === 'monthly' ? 'mensuelle' : 'annuelle'}</strong>.
              </p>
              <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium">Montant à payer</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold">
                      {selectedPlan?.amount.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">FCFA</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Note: Dans cette version de démonstration, l'abonnement sera activé immédiatement sans paiement réel.
                L'intégration complète avec Stripe sera disponible prochainement.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubscription} disabled={processing}>
              {processing ? 'Activation...' : 'Confirmer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

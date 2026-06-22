import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

interface PricingCardProps {
  planName: string;
  planType: 'monthly' | 'annual' | 'per_user';
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  recommended?: boolean;
  currentPlan?: boolean;
  onSelect: (planType: 'monthly' | 'annual', amount: number) => void;
  loading?: boolean;
}

export default function PricingCard({
  planName,
  planType,
  monthlyPrice,
  annualPrice,
  features,
  recommended = false,
  currentPlan = false,
  onSelect,
  loading = false,
}: PricingCardProps) {
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'annual'>('monthly');
  const price = billingCycle === 'monthly' ? monthlyPrice : annualPrice;
  const savings = billingCycle === 'annual' ? Math.round(((monthlyPrice * 12 - annualPrice) / (monthlyPrice * 12)) * 100) : 0;

  return (
    <Card className={`relative ${recommended ? 'border-primary shadow-sm' : 'border-border/40'}`}>
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">Recommandé</Badge>
        </div>
      )}

      <CardHeader className="pb-6">
        <CardTitle className="text-xl">{planName}</CardTitle>
        <div className="mt-4 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold">{price.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">FCFA</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {billingCycle === 'monthly' ? 'par mois' : 'par an'}
          </p>
          {billingCycle === 'annual' && savings > 0 && (
            <Badge variant="secondary" className="text-xs">
              Économisez {savings}%
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Sélecteur de cycle de facturation */}
        <div className="flex gap-2 rounded-lg bg-muted/30 p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              billingCycle === 'annual'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Annuel
          </button>
        </div>

        {/* Liste des fonctionnalités */}
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {currentPlan ? (
          <Button variant="outline" className="w-full" disabled onClick={() => {}}>
            Plan actuel
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={recommended ? 'default' : 'outline'}
            onClick={() => onSelect(billingCycle, price)}
            disabled={loading}
          >
            {loading ? 'Chargement...' : 'Choisir ce plan'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

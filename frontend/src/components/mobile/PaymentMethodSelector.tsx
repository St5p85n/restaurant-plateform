import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, CreditCard, Smartphone, Wallet, Banknote } from 'lucide-react';

type PaymentMethod = 'card' | 'wave' | 'orange_money' | 'cash';

interface PaymentMethodSelectorProps {
  selectedMethod?: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
}

export default function PaymentMethodSelector({
  selectedMethod,
  onSelectMethod,
}: PaymentMethodSelectorProps) {
  const paymentMethods = [
    {
      id: 'card' as PaymentMethod,
      name: 'Carte bancaire',
      icon: CreditCard,
      description: 'Visa, Mastercard',
    },
    {
      id: 'wave' as PaymentMethod,
      name: 'Wave',
      icon: Smartphone,
      description: 'Paiement mobile',
    },
    {
      id: 'orange_money' as PaymentMethod,
      name: 'Orange Money',
      icon: Wallet,
      description: 'Paiement mobile',
    },
    {
      id: 'cash' as PaymentMethod,
      name: 'Espèces',
      icon: Banknote,
      description: 'Paiement à la livraison',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mode de paiement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = method.id === selectedMethod;

          return (
            <button
              key={method.id}
              onClick={() => onSelectMethod(method.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-primary">
                  {isSelected && <Check className="h-3 w-3 text-primary" />}
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{method.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {method.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

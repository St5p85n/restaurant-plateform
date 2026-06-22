import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Smartphone } from 'lucide-react';

interface MobilePaymentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (phoneNumber: string) => void;
  paymentMethod: 'wave' | 'orange_money';
  amount: number;
  processing?: boolean;
}

export default function MobilePaymentModal({
  open,
  onClose,
  onConfirm,
  paymentMethod,
  amount,
  processing = false,
}: MobilePaymentModalProps) {
  const [countryCode, setCountryCode] = useState('+221'); // Sénégal par défaut
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  const countryCodes = [
    { code: '+221', country: 'Sénégal', flag: '🇸🇳' },
    { code: '+225', country: 'Côte d\'Ivoire', flag: '🇨🇮' },
    { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
    { code: '+223', country: 'Mali', flag: '🇲🇱' },
    { code: '+227', country: 'Niger', flag: '🇳🇪' },
  ];

  const validatePhoneNumber = (number: string): boolean => {
    // Supprimer les espaces et les tirets
    const cleaned = number.replace(/[\s-]/g, '');
    
    // Vérifier que c'est uniquement des chiffres
    if (!/^\d+$/.test(cleaned)) {
      setError('Le numéro ne doit contenir que des chiffres');
      return false;
    }

    // Vérifier la longueur (généralement 9 chiffres pour le Sénégal)
    if (cleaned.length < 8 || cleaned.length > 10) {
      setError('Le numéro doit contenir entre 8 et 10 chiffres');
      return false;
    }

    setError('');
    return true;
  };

  const handleConfirm = () => {
    if (!phoneNumber.trim()) {
      setError('Veuillez saisir un numéro de téléphone');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }

    const fullNumber = `${countryCode}${phoneNumber.replace(/[\s-]/g, '')}`;
    onConfirm(fullNumber);
  };

  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value);
    if (error) {
      setError('');
    }
  };

  const getPaymentMethodName = () => {
    return paymentMethod === 'wave' ? 'Wave' : 'Orange Money';
  };

  const getPaymentMethodIcon = () => {
    return paymentMethod === 'wave' ? '📱' : '🍊';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{getPaymentMethodIcon()}</span>
            Paiement {getPaymentMethodName()}
          </DialogTitle>
          <DialogDescription>
            Entrez votre numéro de téléphone pour recevoir la demande de paiement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Montant */}
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">Montant à payer</p>
            <p className="text-2xl font-semibold text-primary">
              {amount.toLocaleString()} FCFA
            </p>
          </div>

          {/* Sélection du code pays */}
          <div className="space-y-2">
            <Label htmlFor="country-code">Pays</Label>
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger id="country-code">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countryCodes.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.flag} {item.country} ({item.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Numéro de téléphone */}
          <div className="space-y-2">
            <Label htmlFor="phone-number">Numéro de téléphone</Label>
            <div className="flex gap-2">
              <div className="flex h-10 w-20 items-center justify-center rounded-md border border-border bg-muted px-3 text-sm">
                {countryCode}
              </div>
              <Input
                id="phone-number"
                type="tel"
                placeholder="77 123 45 67"
                value={phoneNumber}
                onChange={(e) => handlePhoneNumberChange(e.target.value)}
                disabled={processing}
                className="flex-1"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          {/* Instructions */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-start gap-2 text-sm">
              <Smartphone className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <div className="space-y-1">
                <p className="font-medium">Comment ça marche ?</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Vous recevrez une notification sur votre téléphone</li>
                  <li>Entrez votre code PIN pour confirmer</li>
                  <li>Le paiement sera validé automatiquement</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={processing}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={processing || !phoneNumber.trim()}
            className="flex-1"
          >
            {processing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                Traitement...
              </>
            ) : (
              'Confirmer'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

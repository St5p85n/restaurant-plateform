import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CreditCard,
  Smartphone,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DemoPaymentMethod = 'card' | 'wave' | 'orange_money';

export interface DemoPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (orderId: string, transactionId: string) => void;
  /** Identifiant de la commande déjà créée côté DB */
  orderId: string;
  amount: number;
  paymentMethod: DemoPaymentMethod;
}

type Step = 'form' | 'processing' | 'success' | 'failure';

// ─── Données démo ────────────────────────────────────────────────────────────

const DEMO_CARDS = [
  { label: 'Visa – Succès', number: '4242 4242 4242 4242', expiry: '12/28', cvv: '123', type: 'visa' },
  { label: 'Mastercard – Succès', number: '5555 5555 5555 4444', expiry: '06/27', cvv: '321', type: 'mc' },
  { label: 'Refus – Fonds insuff.', number: '4000 0000 0000 0002', expiry: '01/26', cvv: '000', type: 'fail' },
];

const COUNTRY_CODES = [
  { code: '+221', country: 'Sénégal', flag: '🇸🇳' },
  { code: '+225', country: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
  { code: '+223', country: 'Mali', flag: '🇲🇱' },
  { code: '+227', country: 'Niger', flag: '🇳🇪' },
];

// ─── Formatage carte ──────────────────────────────────────────────────────────

function formatCardNumber(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}
function detectCardBrand(n: string): string {
  const raw = n.replace(/\s/g, '');
  if (raw.startsWith('4')) return 'VISA';
  if (raw.startsWith('5')) return 'MC';
  return '';
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function DemoPaymentModal({
  open,
  onClose,
  onSuccess,
  orderId,
  amount,
  paymentMethod,
}: DemoPaymentModalProps) {
  const [step, setStep] = useState<Step>('form');
  const [errorMsg, setErrorMsg] = useState('');

  // Carte
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // Mobile
  const [countryCode, setCountryCode] = useState('+221');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Transaction
  const [transactionId, setTransactionId] = useState('');

  // Reset à l'ouverture
  useEffect(() => {
    if (open) {
      setStep('form');
      setErrorMsg('');
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setCardName('');
      setPhoneNumber('');
      setTransactionId('');
    }
  }, [open]);

  // ── Simulation mobile : auto-confirm après 3s ────────────────────────────
  useEffect(() => {
    if (step === 'processing' && paymentMethod !== 'card') {
      const t = setTimeout(() => confirmMobilePayment(), 3000);
      return () => clearTimeout(t);
    }
  }, [step, paymentMethod]);

  // ── Validation carte ────────────────────────────────────────────────────
  const validateCard = (): string | null => {
    if (cardName.trim().length < 2) return 'Nom du titulaire requis';
    if (cardNumber.replace(/\s/g, '').length !== 16) return 'Numéro de carte invalide (16 chiffres)';
    const [mm, yy] = expiry.split('/');
    if (!mm || !yy || parseInt(mm) < 1 || parseInt(mm) > 12) return "Date d'expiration invalide";
    if (cvv.length < 3) return 'CVV invalide (3 chiffres minimum)';
    return null;
  };

  const validatePhone = (): string | null => {
    const cleaned = phoneNumber.replace(/[\s-]/g, '');
    if (!cleaned) return 'Numéro de téléphone requis';
    if (!/^\d+$/.test(cleaned)) return 'Le numéro ne doit contenir que des chiffres';
    if (cleaned.length < 8 || cleaned.length > 10) return 'Numéro entre 8 et 10 chiffres';
    return null;
  };

  // ── Soumission ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setErrorMsg('');

    if (paymentMethod === 'card') {
      const err = validateCard();
      if (err) { setErrorMsg(err); return; }
    } else {
      const err = validatePhone();
      if (err) { setErrorMsg(err); return; }
    }

    setStep('processing');

    if (paymentMethod === 'card') {
      await processCardPayment();
    }
    // Pour mobile, le useEffect prend le relais
  };

  const isFailCard = () => cardNumber.replace(/\s/g, '').startsWith('4000');

  const processCardPayment = async () => {
    // Petite pause visuelle 1.8s
    await new Promise((r) => setTimeout(r, 1800));

    if (isFailCard()) {
      setErrorMsg('Paiement refusé — fonds insuffisants.');
      setStep('failure');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('process_demo_payment', {
        body: { orderId, paymentMethod: 'card' },
      });
      if (error) throw new Error((await error.context?.text?.()) || error.message);
      if (data?.code !== 'SUCCESS') throw new Error(data?.message || 'Erreur de paiement');

      setTransactionId(data.data.transactionId);
      setStep('success');
    } catch (e: any) {
      setErrorMsg(e.message || 'Erreur lors du paiement');
      setStep('failure');
    }
  };

  const confirmMobilePayment = async () => {
    try {
      const fullPhone = `${countryCode}${phoneNumber.replace(/[\s-]/g, '')}`;
      const { data, error } = await supabase.functions.invoke('process_demo_payment', {
        body: { orderId, paymentMethod, phoneNumber: fullPhone },
      });
      if (error) throw new Error((await error.context?.text?.()) || error.message);
      if (data?.code !== 'SUCCESS') throw new Error(data?.message || 'Erreur de paiement');

      setTransactionId(data.data.transactionId);
      setStep('success');
    } catch (e: any) {
      setErrorMsg(e.message || 'Erreur lors du paiement mobile');
      setStep('failure');
    }
  };

  const handleSuccess = () => {
    onSuccess(orderId, transactionId);
    onClose();
  };

  // ── Labels méthode ──────────────────────────────────────────────────────
  const methodLabel = paymentMethod === 'card' ? 'Carte bancaire'
    : paymentMethod === 'wave' ? 'Wave' : 'Orange Money';

  const methodIcon = paymentMethod === 'card' ? <CreditCard className="h-4 w-4" />
    : <Smartphone className="h-4 w-4" />;

  // ─── Rendu ──────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && step !== 'processing') onClose(); }}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {step === 'form' && (
              <div className="flex items-center gap-2">
                {methodIcon}
                <DialogTitle className="text-base font-medium">
                  Paiement {methodLabel}
                </DialogTitle>
              </div>
            )}
            {step === 'processing' && (
              <DialogTitle className="text-base font-medium">
                Traitement en cours…
              </DialogTitle>
            )}
            {step === 'success' && (
              <DialogTitle className="text-base font-medium">
                Paiement confirmé
              </DialogTitle>
            )}
            {step === 'failure' && (
              <DialogTitle className="text-base font-medium">
                Paiement refusé
              </DialogTitle>
            )}
            <Badge variant="outline" className="ml-auto text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
              Mode démo
            </Badge>
          </div>
        </DialogHeader>

        {/* ── Montant ── */}
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">Montant</p>
          <p className="text-2xl font-medium tabular-nums">
            {amount.toLocaleString('fr-FR')} <span className="text-sm font-normal">FCFA</span>
          </p>
        </div>

        {/* ───────────── ÉTAPE : FORMULAIRE ─────────────────────────────────── */}
        {step === 'form' && (
          <div className="space-y-5">
            {/* Bandeau info démo */}
            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                Environnement de démonstration. Aucune transaction réelle ne sera effectuée.
              </p>
            </div>

            {/* ─ CARTE ─ */}
            {paymentMethod === 'card' && (
              <div className="space-y-4">
                {/* Cartes de test */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Cartes de test
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {DEMO_CARDS.map((c) => (
                      <button
                        key={c.number}
                        type="button"
                        onClick={() => {
                          setCardNumber(c.number);
                          setExpiry(c.expiry);
                          setCvv(c.cvv);
                          setCardName('Client Test');
                        }}
                        className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs transition-colors hover:border-foreground/30 ${
                          c.type === 'fail'
                            ? 'border-destructive/30 text-destructive hover:border-destructive/60'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        <span className="font-mono">{c.number}</span>
                        <span className="text-[10px] text-muted-foreground">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Formulaire carte */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Titulaire</Label>
                    <Input
                      placeholder="Nom sur la carte"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="h-9 px-3 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Numéro de carte
                      {cardNumber && (
                        <span className="ml-2 font-mono text-[10px] text-primary">
                          {detectCardBrand(cardNumber)}
                        </span>
                      )}
                    </Label>
                    <Input
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      className="h-9 px-3 font-mono text-sm tracking-widest"
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Expiration</Label>
                      <Input
                        placeholder="MM/AA"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        className="h-9 px-3 text-sm"
                        maxLength={5}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">CVV</Label>
                      <Input
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="h-9 px-3 text-sm"
                        maxLength={4}
                        type="password"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─ WAVE / ORANGE MONEY ─ */}
            {(paymentMethod === 'wave' || paymentMethod === 'orange_money') && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Pays</Label>
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.flag} {c.country} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Numéro de téléphone</Label>
                  <div className="flex gap-2">
                    <div className="flex h-9 items-center justify-center rounded-md border border-border bg-muted px-3 text-xs font-mono shrink-0">
                      {countryCode}
                    </div>
                    <Input
                      type="tel"
                      placeholder="77 123 45 67"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="h-9 px-3 text-sm"
                    />
                  </div>
                </div>

                <div className="rounded-md border border-border bg-muted/20 p-3">
                  <p className="mb-1.5 text-xs font-medium">Simulation du flux</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-xs text-muted-foreground">
                    <li>Vous recevrez une confirmation fictive</li>
                    <li>Le paiement est validé automatiquement après 3 secondes</li>
                    <li>Aucun vrai débit n'est effectué</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Erreur */}
            {errorMsg && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {errorMsg}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1 h-9" onClick={onClose}>
                Annuler
              </Button>
              <Button className="flex-1 h-9" onClick={handleSubmit}>
                {paymentMethod === 'card' ? 'Payer' : 'Envoyer la demande'}
              </Button>
            </div>
          </div>
        )}

        {/* ───────────── ÉTAPE : TRAITEMENT ─────────────────────────────────── */}
        {step === 'processing' && (
          <div className="flex flex-col items-center gap-6 py-8 text-center">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-border">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">
                {paymentMethod === 'card' ? 'Vérification du paiement…' : `Attente de confirmation ${methodLabel}…`}
              </p>
              <p className="text-sm text-muted-foreground">
                {paymentMethod !== 'card'
                  ? 'Le paiement sera validé automatiquement dans quelques secondes.'
                  : 'Traitement sécurisé en cours.'}
              </p>
            </div>
          </div>
        )}

        {/* ───────────── ÉTAPE : SUCCÈS ─────────────────────────────────────── */}
        {step === 'success' && (
          <div className="flex flex-col items-center gap-6 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/8">
              <CheckCircle2 className="h-9 w-9 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Paiement confirmé</p>
              <p className="text-sm text-muted-foreground">
                Votre commande est maintenant en cours de préparation.
              </p>
              {transactionId && (
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  Réf : {transactionId}
                </p>
              )}
            </div>
            <Button className="w-full h-9" onClick={handleSuccess}>
              Voir ma commande
            </Button>
          </div>
        )}

        {/* ───────────── ÉTAPE : ÉCHEC ──────────────────────────────────────── */}
        {step === 'failure' && (
          <div className="flex flex-col items-center gap-6 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/8">
              <XCircle className="h-9 w-9 text-destructive" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Paiement refusé</p>
              <p className="text-sm text-muted-foreground">
                {errorMsg || 'Une erreur est survenue lors du paiement.'}
              </p>
            </div>
            <div className="flex w-full gap-3">
              <Button variant="outline" className="flex-1 h-9" onClick={onClose}>
                Annuler
              </Button>
              <Button
                className="flex-1 h-9 gap-1.5"
                onClick={() => { setStep('form'); setErrorMsg(''); }}
              >
                <ArrowLeft className="h-4 w-4" />
                Réessayer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

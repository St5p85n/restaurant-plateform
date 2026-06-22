-- Changer la devise par défaut de USD à FCFA
ALTER TABLE subscriptions 
ALTER COLUMN currency SET DEFAULT 'FCFA';

-- Mettre à jour les abonnements existants qui ont USD ou EUR vers FCFA
UPDATE subscriptions 
SET currency = 'FCFA' 
WHERE currency IN ('USD', 'EUR') OR currency IS NULL;

-- Commentaire pour documentation
COMMENT ON COLUMN subscriptions.currency IS 
'Devise de l''abonnement. Par défaut FCFA (Franc CFA).';

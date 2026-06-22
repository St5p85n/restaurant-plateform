-- Ajouter les champs Stripe à la table orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Créer un index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);

-- Commentaires
COMMENT ON COLUMN orders.stripe_session_id IS 'ID de session Stripe Checkout';
COMMENT ON COLUMN orders.stripe_payment_intent_id IS 'ID de PaymentIntent Stripe';
COMMENT ON COLUMN orders.customer_email IS 'Email du client depuis Stripe';
COMMENT ON COLUMN orders.customer_name IS 'Nom du client depuis Stripe';
COMMENT ON COLUMN orders.paid_at IS 'Date et heure du paiement confirmé';

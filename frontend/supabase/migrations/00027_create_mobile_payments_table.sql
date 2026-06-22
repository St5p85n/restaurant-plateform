-- Type enum pour les méthodes de paiement mobile
CREATE TYPE mobile_payment_method AS ENUM ('wave', 'orange_money');

-- Type enum pour les statuts de paiement mobile
CREATE TYPE mobile_payment_status AS ENUM ('pending', 'processing', 'paid', 'failed', 'cancelled', 'expired');

-- Table pour suivre les transactions de paiement mobile
CREATE TABLE mobile_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method mobile_payment_method NOT NULL,
    phone_number TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'XOF',
    status mobile_payment_status NOT NULL DEFAULT 'pending',
    transaction_id TEXT UNIQUE,
    provider_reference TEXT,
    provider_response JSONB,
    error_message TEXT,
    initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les recherches rapides
CREATE INDEX idx_mobile_payments_order_id ON mobile_payments(order_id);
CREATE INDEX idx_mobile_payments_transaction_id ON mobile_payments(transaction_id);
CREATE INDEX idx_mobile_payments_status ON mobile_payments(status);
CREATE INDEX idx_mobile_payments_phone_number ON mobile_payments(phone_number);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_mobile_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mobile_payments_updated_at
    BEFORE UPDATE ON mobile_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_mobile_payments_updated_at();

-- RLS Policies
ALTER TABLE mobile_payments ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres paiements
CREATE POLICY "Users can view own mobile payments"
    ON mobile_payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = mobile_payments.order_id
            AND orders.customer_id = auth.uid()
        )
    );

-- Seules les Edge Functions peuvent créer/modifier les paiements
CREATE POLICY "Service role can manage mobile payments"
    ON mobile_payments FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Commentaires
COMMENT ON TABLE mobile_payments IS 'Transactions de paiement mobile (Wave, Orange Money)';
COMMENT ON COLUMN mobile_payments.order_id IS 'Reference a la commande';
COMMENT ON COLUMN mobile_payments.payment_method IS 'Methode de paiement (wave, orange_money)';
COMMENT ON COLUMN mobile_payments.phone_number IS 'Numero de telephone du payeur';
COMMENT ON COLUMN mobile_payments.amount IS 'Montant de la transaction';
COMMENT ON COLUMN mobile_payments.status IS 'Statut du paiement';
COMMENT ON COLUMN mobile_payments.transaction_id IS 'ID de transaction unique';
COMMENT ON COLUMN mobile_payments.provider_reference IS 'Reference du fournisseur de paiement';
COMMENT ON COLUMN mobile_payments.provider_response IS 'Reponse complete du fournisseur';
COMMENT ON COLUMN mobile_payments.expires_at IS 'Date expiration de la demande de paiement';

-- Type enum pour les fournisseurs de paiement
CREATE TYPE payment_provider AS ENUM ('wave', 'orange_money', 'stripe');

-- Type enum pour les statuts de webhook
CREATE TYPE webhook_status AS ENUM ('received', 'processed', 'failed', 'ignored');

-- Table pour logger toutes les notifications webhook
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES mobile_payments(id) ON DELETE SET NULL,
    provider payment_provider NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    signature TEXT,
    signature_valid BOOLEAN,
    status webhook_status NOT NULL DEFAULT 'received',
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Index pour les recherches rapides
CREATE INDEX idx_webhook_logs_payment_id ON webhook_logs(payment_id);
CREATE INDEX idx_webhook_logs_provider ON webhook_logs(provider);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- RLS Policies
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Seuls les super_admins peuvent voir les logs de webhook
CREATE POLICY "Super admins can view webhook logs"
    ON webhook_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Seules les Edge Functions peuvent créer des logs
CREATE POLICY "Service role can create webhook logs"
    ON webhook_logs FOR INSERT
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Commentaires
COMMENT ON TABLE webhook_logs IS 'Logs de toutes les notifications webhook recues';
COMMENT ON COLUMN webhook_logs.payment_id IS 'Reference au paiement mobile (peut etre NULL si non trouve)';
COMMENT ON COLUMN webhook_logs.provider IS 'Fournisseur de paiement (wave, orange_money, stripe)';
COMMENT ON COLUMN webhook_logs.event_type IS 'Type evenement (payment.success, payment.failed, etc.)';
COMMENT ON COLUMN webhook_logs.payload IS 'Payload JSON complet recu';
COMMENT ON COLUMN webhook_logs.signature IS 'Signature recue dans les headers';
COMMENT ON COLUMN webhook_logs.signature_valid IS 'Signature valide ou non';
COMMENT ON COLUMN webhook_logs.status IS 'Statut du traitement du webhook';
COMMENT ON COLUMN webhook_logs.processing_time_ms IS 'Temps de traitement en millisecondes';

-- Créer la table pour les logs d'authentification
CREATE TABLE IF NOT EXISTS auth_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  action text NOT NULL CHECK (action IN ('login', 'logout', 'signup', 'password_reset')),
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON auth_logs(action);

-- Activer RLS
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Politique : Seuls les super admins peuvent voir les logs
CREATE POLICY "Super admin peut voir tous les logs" ON auth_logs
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

-- Politique : Tout le monde peut insérer des logs (pour le tracking)
CREATE POLICY "Permettre insertion des logs" ON auth_logs
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Commentaire pour documentation
COMMENT ON TABLE auth_logs IS 
'Table pour tracer l''historique des connexions et actions d''authentification des utilisateurs';

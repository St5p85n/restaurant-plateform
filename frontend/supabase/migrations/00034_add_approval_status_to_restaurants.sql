
-- Ajouter la colonne approval_status à la table restaurants
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved'
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Les restaurants existants sont approuvés par défaut
UPDATE restaurants SET approval_status = 'approved' WHERE approval_status IS NULL OR approval_status = '';

-- Index pour faciliter les filtres
CREATE INDEX IF NOT EXISTS idx_restaurants_approval_status ON restaurants(approval_status);

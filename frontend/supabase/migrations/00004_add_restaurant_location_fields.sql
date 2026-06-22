
-- Ajouter les champs city et postal_code à la table restaurants
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Créer un index sur city pour les recherches
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city);

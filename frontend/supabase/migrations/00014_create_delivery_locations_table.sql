-- Table pour stocker les positions GPS des livreurs
CREATE TABLE IF NOT EXISTS delivery_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_person_id UUID NOT NULL REFERENCES delivery_personnel(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_delivery_locations_person ON delivery_locations(delivery_person_id);
CREATE INDEX IF NOT EXISTS idx_delivery_locations_order ON delivery_locations(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_locations_recorded_at ON delivery_locations(recorded_at DESC);

-- Politique RLS pour sécuriser l'accès
ALTER TABLE delivery_locations ENABLE ROW LEVEL SECURITY;

-- Fonction helper pour vérifier si l'utilisateur peut voir les positions
CREATE OR REPLACE FUNCTION can_view_delivery_location(location_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = location_order_id
    AND (
      -- Le client propriétaire de la commande
      o.customer_id = auth.uid()
      -- Ou un membre du restaurant
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.restaurant_id = o.restaurant_id
      )
    )
  );
$$;

-- Politique pour SELECT: clients et personnel du restaurant peuvent voir
CREATE POLICY "Clients et restaurant peuvent voir positions"
  ON delivery_locations
  FOR SELECT
  TO authenticated
  USING (can_view_delivery_location(order_id));

-- Politique pour INSERT: seuls les livreurs et le restaurant peuvent ajouter
CREATE POLICY "Livreurs et restaurant peuvent ajouter positions"
  ON delivery_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery_personnel dp
      WHERE dp.id = delivery_person_id
      AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.restaurant_id = dp.restaurant_id
      )
    )
  );

-- Vue pour obtenir la dernière position de chaque livreur
CREATE OR REPLACE VIEW latest_delivery_locations AS
SELECT DISTINCT ON (delivery_person_id)
  id,
  delivery_person_id,
  order_id,
  latitude,
  longitude,
  recorded_at
FROM delivery_locations
ORDER BY delivery_person_id, recorded_at DESC;
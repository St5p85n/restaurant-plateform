-- Table pour mettre en cache les trajets calculés
CREATE TABLE IF NOT EXISTS delivery_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  start_lat DECIMAL(10, 8) NOT NULL,
  start_lng DECIMAL(11, 8) NOT NULL,
  end_lat DECIMAL(10, 8) NOT NULL,
  end_lng DECIMAL(11, 8) NOT NULL,
  geometry JSONB NOT NULL, -- Géométrie du trajet (format GeoJSON)
  distance_meters INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  instructions JSONB, -- Instructions de navigation
  profile VARCHAR(50) DEFAULT 'driving-car',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_delivery_routes_order ON delivery_routes(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_routes_coordinates ON delivery_routes(start_lat, start_lng, end_lat, end_lng);

-- Politique RLS pour sécuriser l'accès
ALTER TABLE delivery_routes ENABLE ROW LEVEL SECURITY;

-- Fonction helper pour vérifier si l'utilisateur peut voir le trajet
CREATE OR REPLACE FUNCTION can_view_delivery_route(route_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = route_order_id
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
CREATE POLICY "Clients et restaurant peuvent voir trajets"
  ON delivery_routes
  FOR SELECT
  TO authenticated
  USING (can_view_delivery_route(order_id));

-- Politique pour INSERT: seul le restaurant peut ajouter
CREATE POLICY "Restaurant peut ajouter trajets"
  ON delivery_routes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE o.id = order_id
      AND p.restaurant_id = o.restaurant_id
    )
  );

-- Politique pour UPDATE: seul le restaurant peut modifier
CREATE POLICY "Restaurant peut modifier trajets"
  ON delivery_routes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE o.id = order_id
      AND p.restaurant_id = o.restaurant_id
    )
  );

-- Commentaires pour documentation
COMMENT ON TABLE delivery_routes IS 'Cache des trajets routiers calculés pour optimiser les appels API';
COMMENT ON COLUMN delivery_routes.geometry IS 'Géométrie du trajet au format GeoJSON LineString';
COMMENT ON COLUMN delivery_routes.instructions IS 'Instructions de navigation turn-by-turn au format JSON';
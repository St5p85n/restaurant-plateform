
-- Table des évaluations de plats
CREATE TABLE reviews (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id   uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  customer_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating         smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_unique_order_item UNIQUE (order_id, menu_item_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX reviews_menu_item_id_idx ON reviews (menu_item_id);
CREATE INDEX reviews_order_id_idx ON reviews (order_id);
CREATE INDEX reviews_customer_id_idx ON reviews (customer_id);

-- Activer RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les avis (affichage public dans le menu)
CREATE POLICY "reviews_read_all" ON reviews
  FOR SELECT USING (true);

-- Les utilisateurs authentifiés peuvent insérer leurs propres avis
CREATE POLICY "reviews_insert_own" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);

-- Activer Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;

-- Créer une table pour les livreurs
CREATE TABLE delivery_personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  vehicle_type text, -- 'bike', 'motorcycle', 'car', 'scooter'
  vehicle_number text,
  status text DEFAULT 'available', -- 'available', 'busy', 'offline'
  current_location jsonb, -- {lat, lng}
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ajouter un champ delivery_person_id dans orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_person_id uuid REFERENCES delivery_personnel(id);

-- Index pour améliorer les performances (vérifier s'ils n'existent pas déjà)
CREATE INDEX IF NOT EXISTS idx_delivery_personnel_restaurant ON delivery_personnel(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_delivery_personnel_status ON delivery_personnel(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_person ON orders(delivery_person_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Politiques RLS pour delivery_personnel
ALTER TABLE delivery_personnel ENABLE ROW LEVEL SECURITY;

-- Personnel du restaurant peut voir les livreurs de leur restaurant
CREATE POLICY "Restaurant staff can view their delivery personnel"
ON delivery_personnel
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.restaurant_id = delivery_personnel.restaurant_id
  )
);

-- Personnel du restaurant peut gérer les livreurs
CREATE POLICY "Restaurant staff can manage delivery personnel"
ON delivery_personnel
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.restaurant_id = delivery_personnel.restaurant_id
    AND profiles.role IN ('owner', 'manager')
  )
);

-- Super admin a accès complet
CREATE POLICY "Super admin has full access to delivery personnel"
ON delivery_personnel
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()));

-- Politique pour permettre aux clients d'annuler leurs commandes pending
CREATE POLICY "Customers can cancel their pending orders"
ON orders
FOR UPDATE
TO authenticated
USING (
  customer_id = auth.uid() 
  AND status = 'pending'
)
WITH CHECK (
  customer_id = auth.uid() 
  AND status IN ('pending', 'cancelled')
);

-- Politique pour permettre au personnel restaurant de mettre à jour les commandes
CREATE POLICY "Restaurant staff can update orders"
ON orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.restaurant_id = orders.restaurant_id
  )
);

-- Commentaires
COMMENT ON TABLE delivery_personnel IS 'Table pour gérer les livreurs des restaurants';
COMMENT ON COLUMN delivery_personnel.status IS 'Statut du livreur: available, busy, offline';
COMMENT ON COLUMN delivery_personnel.vehicle_type IS 'Type de véhicule: bike, motorcycle, car, scooter';
COMMENT ON COLUMN orders.delivery_person_id IS 'Livreur assigné à la commande';

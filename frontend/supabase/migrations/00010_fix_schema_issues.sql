-- 1. Ajouter la colonne 'notes' à order_items (alias de special_instructions)
-- On garde special_instructions et on ajoute notes pour compatibilité
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS notes text;

-- Copier les données existantes de special_instructions vers notes
UPDATE order_items
SET notes = special_instructions
WHERE special_instructions IS NOT NULL AND notes IS NULL;

-- 2. Ajouter la colonne restaurant_id à stock_movements
ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE;

-- Remplir restaurant_id en utilisant la relation stock_item -> restaurant
UPDATE stock_movements sm
SET restaurant_id = si.restaurant_id
FROM stock_items si
WHERE sm.stock_item_id = si.id
  AND sm.restaurant_id IS NULL;

-- Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_stock_movements_restaurant_id 
ON stock_movements(restaurant_id);

-- 3. Ajouter 'completed' à l'enum order_status
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'completed' AFTER 'paid';

-- Commentaires pour documentation
COMMENT ON COLUMN order_items.notes IS 'Instructions spéciales pour l''article (alias de special_instructions)';
COMMENT ON COLUMN stock_movements.restaurant_id IS 'ID du restaurant pour filtrage direct';

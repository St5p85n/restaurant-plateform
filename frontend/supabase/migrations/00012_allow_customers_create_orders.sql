-- Permettre aux clients authentifiés de créer leurs propres commandes
CREATE POLICY "Authenticated users can create orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (
  -- L'utilisateur peut créer une commande avec son propre customer_id
  customer_id = auth.uid()
  OR
  -- Ou une commande sans customer_id (guest order pour compatibilité)
  customer_id IS NULL
);

-- Permettre aux clients authentifiés de créer des order_items pour leurs commandes
CREATE POLICY "Customers can create order items for their orders"
ON order_items
FOR INSERT
TO authenticated
WITH CHECK (
  -- L'utilisateur peut créer des items pour ses propres commandes
  EXISTS (
    SELECT 1
    FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.customer_id = auth.uid()
  )
  OR
  -- Ou pour des commandes sans customer_id (guest orders)
  EXISTS (
    SELECT 1
    FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.customer_id IS NULL
  )
);

-- Commentaires pour documentation
COMMENT ON POLICY "Authenticated users can create orders" ON orders IS 
'Permet aux clients authentifiés de créer des commandes avec leur customer_id ou des commandes invitées (customer_id NULL).';

COMMENT ON POLICY "Customers can create order items for their orders" ON order_items IS 
'Permet aux clients authentifiés de créer des items pour leurs propres commandes ou pour des commandes invitées.';

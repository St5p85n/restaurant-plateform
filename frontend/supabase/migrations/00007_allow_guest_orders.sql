-- Permettre aux invités de créer des adresses de livraison
CREATE POLICY "Guests can create delivery addresses"
ON delivery_addresses FOR INSERT
TO anon
WITH CHECK (true);

-- Permettre aux invités de créer des commandes
CREATE POLICY "Guests can create orders"
ON orders FOR INSERT
TO anon
WITH CHECK (true);

-- Permettre aux invités de voir leurs commandes via l'ID
CREATE POLICY "Anyone can view orders by ID"
ON orders FOR SELECT
TO anon
USING (true);

-- Permettre aux invités de créer des order_items
CREATE POLICY "Guests can create order items"
ON order_items FOR INSERT
TO anon
WITH CHECK (true);

-- Permettre aux invités de voir les order_items
CREATE POLICY "Anyone can view order items"
ON order_items FOR SELECT
TO anon
USING (true);

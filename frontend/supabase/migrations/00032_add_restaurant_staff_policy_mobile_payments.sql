-- Permettre au personnel du restaurant de voir les paiements mobiles liés à leurs commandes
CREATE POLICY "Restaurant staff can view mobile payments"
  ON mobile_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM orders o
      JOIN profiles p ON p.id = auth.uid()
      WHERE o.id = mobile_payments.order_id
        AND o.restaurant_id = p.restaurant_id
    )
  );


-- Ajouter les colonnes de réponse restaurant
ALTER TABLE reviews
  ADD COLUMN restaurant_reply text,
  ADD COLUMN replied_at       timestamptz;

-- Politique : le propriétaire du restaurant peut mettre à jour sa réponse
-- (helper function : vérifie que l'utilisateur est owner du restaurant lié au plat)
CREATE OR REPLACE FUNCTION can_reply_review(review_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM reviews r
    JOIN menu_items mi ON mi.id = r.menu_item_id
    JOIN restaurants res ON res.id = mi.restaurant_id
    WHERE r.id = review_id
      AND res.owner_id = auth.uid()
  );
$$;

CREATE POLICY "reviews_update_reply" ON reviews
  FOR UPDATE TO authenticated
  USING (can_reply_review(id))
  WITH CHECK (can_reply_review(id));

-- Créer le bucket pour les images
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-images', 'restaurant-images', true);

-- Politiques pour le bucket
CREATE POLICY "Tout le monde peut voir les images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'restaurant-images');

CREATE POLICY "Utilisateurs authentifiés peuvent uploader des images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'restaurant-images');

CREATE POLICY "Utilisateurs peuvent modifier leurs images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'restaurant-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Utilisateurs peuvent supprimer leurs images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'restaurant-images' AND auth.uid()::text = (storage.foldername(name))[1]);
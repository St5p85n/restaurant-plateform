
-- Mettre à jour le bucket existant
UPDATE storage.buckets
SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/gif','image/webp','image/avif']
WHERE id = 'restaurant-images';

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Public read restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can update images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can delete images" ON storage.objects;

-- Recréer les politiques
CREATE POLICY "Public read restaurant images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Restaurant owners can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'restaurant-images');

CREATE POLICY "Restaurant owners can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Restaurant owners can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'restaurant-images');

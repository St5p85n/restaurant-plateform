-- Ajouter les coordonnées GPS aux restaurants
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Ajouter les coordonnées GPS aux adresses de livraison
ALTER TABLE delivery_addresses
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Ajouter un index pour améliorer les performances des requêtes géospatiales
CREATE INDEX IF NOT EXISTS idx_restaurants_coordinates ON restaurants(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_delivery_addresses_coordinates ON delivery_addresses(latitude, longitude);

-- Commentaires pour documentation
COMMENT ON COLUMN restaurants.latitude IS 'Latitude du restaurant pour affichage sur carte';
COMMENT ON COLUMN restaurants.longitude IS 'Longitude du restaurant pour affichage sur carte';
COMMENT ON COLUMN delivery_addresses.latitude IS 'Latitude de l''adresse de livraison';
COMMENT ON COLUMN delivery_addresses.longitude IS 'Longitude de l''adresse de livraison';
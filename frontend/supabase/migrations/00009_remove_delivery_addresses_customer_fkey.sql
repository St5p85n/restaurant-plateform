-- Supprimer complètement la contrainte de clé étrangère
-- pour permettre les commandes invitées sans customer_id
ALTER TABLE delivery_addresses
DROP CONSTRAINT IF EXISTS delivery_addresses_customer_id_fkey;

-- Ajouter un commentaire pour expliquer
COMMENT ON COLUMN delivery_addresses.customer_id IS 
'ID du client (customers.id) si disponible. Peut être NULL pour les commandes invitées.';

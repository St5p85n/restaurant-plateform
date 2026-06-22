-- Supprimer la contrainte de clé étrangère existante
ALTER TABLE delivery_addresses
DROP CONSTRAINT IF EXISTS delivery_addresses_customer_id_fkey;

-- Recréer la contrainte sans validation stricte pour permettre NULL
-- La contrainte vérifie uniquement si customer_id n'est pas NULL
ALTER TABLE delivery_addresses
ADD CONSTRAINT delivery_addresses_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES customers(id)
ON DELETE SET NULL
NOT VALID;

-- Valider la contrainte (permet les NULL)
ALTER TABLE delivery_addresses
VALIDATE CONSTRAINT delivery_addresses_customer_id_fkey;

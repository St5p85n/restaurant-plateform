-- Ajouter la colonne username à la table profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Commentaire pour documentation
COMMENT ON COLUMN profiles.username IS 'Nom d''utilisateur unique pour la connexion (optionnel)';

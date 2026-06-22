-- Supprimer l'ancien trigger
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- Recréer la fonction handle_new_user avec vérification d'existence
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  profile_exists boolean;
BEGIN
  -- Vérifier si le profil existe déjà
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = NEW.id) INTO profile_exists;
  
  -- Si le profil existe déjà, ne rien faire
  IF profile_exists THEN
    RETURN NEW;
  END IF;
  
  -- Compter le nombre de profils existants
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- Créer le profil avec les données de user_metadata si disponibles
  INSERT INTO public.profiles (id, email, phone, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN user_count = 0 THEN 'super_admin'::user_role ELSE 'customer'::user_role END
  )
  ON CONFLICT (id) DO NOTHING; -- Ignorer si le profil existe déjà
  
  RETURN NEW;
END;
$$;

-- Recréer le trigger sur INSERT au lieu de UPDATE
-- Cela permet de créer le profil immédiatement lors de l'inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Commentaire pour documentation
COMMENT ON FUNCTION handle_new_user() IS 
'Crée automatiquement un profil pour chaque nouvel utilisateur. Utilise les données de user_metadata si disponibles. Vérifie l''existence du profil avant insertion pour éviter les doublons.';
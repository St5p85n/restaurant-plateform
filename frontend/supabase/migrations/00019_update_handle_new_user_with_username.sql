-- Mettre à jour la fonction handle_new_user pour inclure username
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
  INSERT INTO public.profiles (id, email, phone, full_name, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', NULL),
    CASE WHEN user_count = 0 THEN 'super_admin'::user_role ELSE 'customer'::user_role END
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Commentaire pour documentation
COMMENT ON FUNCTION handle_new_user() IS 
'Crée automatiquement un profil pour chaque nouvel utilisateur. Utilise les données de user_metadata (full_name, phone, username) si disponibles. Vérifie l''existence du profil avant insertion pour éviter les doublons.';

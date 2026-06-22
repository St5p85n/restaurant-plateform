-- Fonction pour créer un super admin avec code secret
CREATE OR REPLACE FUNCTION create_super_admin(
  p_user_id uuid,
  p_email text,
  p_username text,
  p_full_name text,
  p_secret_code text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
  v_expected_code text := 'KOBETII_ADMIN_2024';
BEGIN
  -- Vérifier le code secret
  IF p_secret_code != v_expected_code THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Code secret invalide'
    );
  END IF;

  -- Vérifier si l'email existe déjà
  IF EXISTS (SELECT 1 FROM profiles WHERE email = p_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Un compte avec cet email existe déjà'
    );
  END IF;

  -- Vérifier si le username existe déjà
  IF p_username IS NOT NULL AND EXISTS (SELECT 1 FROM profiles WHERE username = p_username) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ce nom d''utilisateur est déjà utilisé'
    );
  END IF;

  -- Créer ou mettre à jour le profil avec le rôle super_admin
  INSERT INTO profiles (id, email, username, full_name, role)
  VALUES (p_user_id, p_email, p_username, p_full_name, 'super_admin')
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    role = 'super_admin',
    updated_at = now();

  RETURN json_build_object(
    'success', true,
    'message', 'Compte super administrateur créé avec succès'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Commentaire pour documentation
COMMENT ON FUNCTION create_super_admin IS 
'Crée un compte super administrateur avec validation du code secret. Utilise SECURITY DEFINER pour contourner les RLS.';

-- Permettre l'exécution par les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION create_super_admin TO authenticated;
GRANT EXECUTE ON FUNCTION create_super_admin TO anon;

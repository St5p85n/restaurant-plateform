-- Fonction pour révoquer un super admin
CREATE OR REPLACE FUNCTION revoke_super_admin(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'appelant est un super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Permission refusée'
    );
  END IF;

  -- Vérifier que l'utilisateur ne se révoque pas lui-même
  IF p_user_id = auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Vous ne pouvez pas révoquer votre propre accès'
    );
  END IF;

  -- Mettre à jour le rôle vers customer
  UPDATE profiles
  SET role = 'customer', updated_at = now()
  WHERE id = p_user_id AND role = 'super_admin';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé ou n''est pas un super admin'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Accès super admin révoqué avec succès'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Fonction pour obtenir la liste des super admins avec statistiques
CREATE OR REPLACE FUNCTION get_super_admins_with_stats()
RETURNS TABLE (
  id uuid,
  email text,
  username text,
  full_name text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz,
  last_login timestamptz,
  login_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'appelant est un super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permission refusée';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.username,
    p.full_name,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    (SELECT MAX(al.created_at) FROM auth_logs al WHERE al.user_id = p.id AND al.action = 'login') as last_login,
    (SELECT COUNT(*) FROM auth_logs al WHERE al.user_id = p.id AND al.action = 'login') as login_count
  FROM profiles p
  WHERE p.role = 'super_admin'
  ORDER BY p.created_at DESC;
END;
$$;

-- Fonction pour obtenir l'historique des connexions d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_auth_logs(p_user_id uuid, p_limit int DEFAULT 50)
RETURNS TABLE (
  id uuid,
  action text,
  ip_address text,
  user_agent text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'appelant est un super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permission refusée';
  END IF;

  RETURN QUERY
  SELECT 
    al.id,
    al.action,
    al.ip_address,
    al.user_agent,
    al.created_at
  FROM auth_logs al
  WHERE al.user_id = p_user_id
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION revoke_super_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_super_admins_with_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_auth_logs TO authenticated;

-- Commentaires pour documentation
COMMENT ON FUNCTION revoke_super_admin IS 
'Révoque les privilèges super admin d''un utilisateur. Nécessite d''être super admin. Ne peut pas se révoquer soi-même.';

COMMENT ON FUNCTION get_super_admins_with_stats IS 
'Retourne la liste de tous les super admins avec leurs statistiques de connexion. Nécessite d''être super admin.';

COMMENT ON FUNCTION get_user_auth_logs IS 
'Retourne l''historique des connexions d''un utilisateur spécifique. Nécessite d''être super admin.';

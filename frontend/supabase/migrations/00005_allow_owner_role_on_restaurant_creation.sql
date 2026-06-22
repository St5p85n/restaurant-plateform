
-- Créer une fonction pour permettre à un utilisateur de devenir owner lors de la création d'un restaurant
CREATE OR REPLACE FUNCTION set_user_as_restaurant_owner(
  p_user_id UUID,
  p_restaurant_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur qui appelle la fonction est bien celui qui sera owner
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Vous ne pouvez pas modifier le profil d''un autre utilisateur';
  END IF;

  -- Vérifier que le restaurant existe et appartient à l'utilisateur
  IF NOT EXISTS (
    SELECT 1 FROM restaurants 
    WHERE id = p_restaurant_id 
    AND owner_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Restaurant non trouvé ou vous n''êtes pas le propriétaire';
  END IF;

  -- Mettre à jour le profil avec le restaurant_id et le rôle owner
  UPDATE profiles
  SET 
    restaurant_id = p_restaurant_id,
    role = 'owner'
  WHERE id = p_user_id;
END;
$$;

-- Accorder les permissions d'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION set_user_as_restaurant_owner(UUID, UUID) TO authenticated;

-- Fonction pour obtenir les plans d'abonnement disponibles
CREATE OR REPLACE FUNCTION get_available_plans()
RETURNS TABLE (
  plan_name text,
  plan_type subscription_plan,
  monthly_price numeric,
  annual_price numeric,
  features jsonb,
  recommended boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Starter'::text as plan_name,
    'monthly'::subscription_plan as plan_type,
    15000::numeric as monthly_price,
    150000::numeric as annual_price,
    jsonb_build_array(
      'Jusqu''à 5 utilisateurs',
      'Gestion des commandes',
      'Gestion des tables',
      'Rapports basiques',
      'Support email'
    ) as features,
    false as recommended
  UNION ALL
  SELECT 
    'Professional'::text,
    'monthly'::subscription_plan,
    35000::numeric,
    350000::numeric,
    jsonb_build_array(
      'Jusqu''à 20 utilisateurs',
      'Gestion des commandes',
      'Gestion des tables',
      'Gestion des stocks',
      'Rapports avancés',
      'Programme de fidélité',
      'Support prioritaire'
    ),
    true
  UNION ALL
  SELECT 
    'Enterprise'::text,
    'monthly'::subscription_plan,
    75000::numeric,
    750000::numeric,
    jsonb_build_array(
      'Utilisateurs illimités',
      'Toutes les fonctionnalités',
      'Gestion multi-restaurants',
      'API personnalisée',
      'Rapports personnalisés',
      'Support 24/7',
      'Formation dédiée'
    ),
    false;
END;
$$;

-- Fonction pour obtenir l'abonnement actuel d'un restaurant
CREATE OR REPLACE FUNCTION get_restaurant_subscription(p_restaurant_id uuid)
RETURNS TABLE (
  id uuid,
  plan subscription_plan,
  status subscription_status,
  start_date timestamptz,
  end_date timestamptz,
  amount numeric,
  currency text,
  stripe_subscription_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur a accès à ce restaurant
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.restaurant_id = p_restaurant_id OR profiles.role = 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Permission refusée';
  END IF;

  RETURN QUERY
  SELECT 
    s.id,
    s.plan,
    s.status,
    s.start_date,
    s.end_date,
    s.amount,
    s.currency,
    s.stripe_subscription_id
  FROM subscriptions s
  WHERE s.restaurant_id = p_restaurant_id
  AND s.status IN ('active', 'suspended')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

-- Fonction pour créer un abonnement
CREATE OR REPLACE FUNCTION create_restaurant_subscription(
  p_restaurant_id uuid,
  p_plan subscription_plan,
  p_amount numeric,
  p_currency text DEFAULT 'FCFA',
  p_stripe_subscription_id text DEFAULT NULL,
  p_stripe_customer_id text DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription_id uuid;
BEGIN
  -- Vérifier que l'utilisateur a accès à ce restaurant
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.restaurant_id = p_restaurant_id OR profiles.role = 'super_admin')
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Permission refusée'
    );
  END IF;

  -- Désactiver les anciens abonnements
  UPDATE subscriptions
  SET status = 'cancelled', updated_at = now()
  WHERE restaurant_id = p_restaurant_id
  AND status IN ('active', 'suspended');

  -- Créer le nouvel abonnement
  INSERT INTO subscriptions (
    restaurant_id,
    plan,
    status,
    amount,
    currency,
    stripe_subscription_id,
    stripe_customer_id,
    end_date
  )
  VALUES (
    p_restaurant_id,
    p_plan,
    'active',
    p_amount,
    p_currency,
    p_stripe_subscription_id,
    p_stripe_customer_id,
    p_end_date
  )
  RETURNING id INTO v_subscription_id;

  RETURN json_build_object(
    'success', true,
    'subscription_id', v_subscription_id,
    'message', 'Abonnement créé avec succès'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_available_plans TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_restaurant_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION create_restaurant_subscription TO authenticated;

-- Commentaires pour documentation
COMMENT ON FUNCTION get_available_plans IS 
'Retourne la liste des plans d''abonnement disponibles avec leurs prix et fonctionnalités.';

COMMENT ON FUNCTION get_restaurant_subscription IS 
'Retourne l''abonnement actuel d''un restaurant. Nécessite d''avoir accès au restaurant.';

COMMENT ON FUNCTION create_restaurant_subscription IS 
'Crée un nouvel abonnement pour un restaurant. Désactive les anciens abonnements. Nécessite d''avoir accès au restaurant.';

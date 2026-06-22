-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_register ENABLE ROW LEVEL SECURITY;

-- Fonctions helper pour vérification des rôles
CREATE OR REPLACE FUNCTION has_role(uid uuid, role_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role::text = role_name
  );
$$;

CREATE OR REPLACE FUNCTION is_super_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT has_role(uid, 'super_admin');
$$;

CREATE OR REPLACE FUNCTION get_user_restaurant_id(uid uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT restaurant_id FROM profiles WHERE id = uid;
$$;

CREATE OR REPLACE FUNCTION is_restaurant_staff(uid uuid, rest_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid 
    AND p.restaurant_id = rest_id
    AND p.role IN ('owner', 'manager', 'chef', 'server', 'accountant')
  );
$$;

CREATE OR REPLACE FUNCTION is_restaurant_owner(uid uuid, rest_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid 
    AND p.restaurant_id = rest_id
    AND p.role = 'owner'
  );
$$;

-- Politiques pour profiles
CREATE POLICY "Super admin a accès complet aux profils" ON profiles
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Utilisateurs peuvent voir leur propre profil" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Utilisateurs peuvent modifier leur profil (sauf role)" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (role = (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Propriétaires peuvent voir le personnel de leur restaurant" ON profiles
  FOR SELECT TO authenticated
  USING (
    restaurant_id = get_user_restaurant_id(auth.uid())
    AND has_role(auth.uid(), 'owner')
  );

-- Vue publique pour profils
CREATE VIEW public_profiles AS
  SELECT id, full_name, role, restaurant_id, avatar_url
  FROM profiles;

-- Politiques pour restaurants
CREATE POLICY "Super admin a accès complet aux restaurants" ON restaurants
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Tout le monde peut voir les restaurants actifs" ON restaurants
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Tout le monde peut voir les restaurants actifs (anonyme)" ON restaurants
  FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "Propriétaires peuvent modifier leur restaurant" ON restaurants
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Utilisateurs authentifiés peuvent créer un restaurant" ON restaurants
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Politiques pour subscriptions
CREATE POLICY "Super admin a accès complet aux abonnements" ON subscriptions
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Propriétaires peuvent voir leur abonnement" ON subscriptions
  FOR SELECT TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

-- Politiques pour tables
CREATE POLICY "Super admin a accès complet aux tables" ON tables
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Personnel du restaurant peut gérer les tables" ON tables
  FOR ALL TO authenticated
  USING (is_restaurant_staff(auth.uid(), restaurant_id));

CREATE POLICY "Clients peuvent voir les tables disponibles" ON tables
  FOR SELECT TO authenticated
  USING (status = 'available');

-- Politiques pour reservations
CREATE POLICY "Super admin a accès complet aux réservations" ON reservations
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Personnel du restaurant peut gérer les réservations" ON reservations
  FOR ALL TO authenticated
  USING (is_restaurant_staff(auth.uid(), restaurant_id));

CREATE POLICY "Clients peuvent créer des réservations" ON reservations
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Clients peuvent créer des réservations (anonyme)" ON reservations
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Clients peuvent voir leurs réservations" ON reservations
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

-- Politiques pour menu_categories
CREATE POLICY "Super admin a accès complet aux catégories" ON menu_categories
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Personnel du restaurant peut gérer les catégories" ON menu_categories
  FOR ALL TO authenticated
  USING (is_restaurant_staff(auth.uid(), restaurant_id));

CREATE POLICY "Tout le monde peut voir les catégories actives" ON menu_categories
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Tout le monde peut voir les catégories actives (anonyme)" ON menu_categories
  FOR SELECT TO anon
  USING (is_active = true);

-- Politiques pour menu_items
CREATE POLICY "Super admin a accès complet aux plats" ON menu_items
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Personnel du restaurant peut gérer les plats" ON menu_items
  FOR ALL TO authenticated
  USING (is_restaurant_staff(auth.uid(), restaurant_id));

CREATE POLICY "Tout le monde peut voir les plats disponibles" ON menu_items
  FOR SELECT TO authenticated
  USING (is_available = true);

CREATE POLICY "Tout le monde peut voir les plats disponibles (anonyme)" ON menu_items
  FOR SELECT TO anon
  USING (is_available = true);

-- Politiques pour orders
CREATE POLICY "Super admin a accès complet aux commandes" ON orders
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Personnel du restaurant peut gérer les commandes" ON orders
  FOR ALL TO authenticated
  USING (is_restaurant_staff(auth.uid(), restaurant_id));

CREATE POLICY "Clients peuvent voir leurs commandes" ON orders
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

-- Politiques pour order_items
CREATE POLICY "Super admin a accès complet aux items de commande" ON order_items
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Personnel du restaurant peut gérer les items" ON order_items
  FOR ALL TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE is_restaurant_staff(auth.uid(), restaurant_id)
    )
  );

-- Politiques pour stock_items
CREATE POLICY "Super admin a accès complet aux stocks" ON stock_items
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Personnel du restaurant peut gérer les stocks" ON stock_items
  FOR ALL TO authenticated
  USING (is_restaurant_staff(auth.uid(), restaurant_id));

-- Politiques pour stock_movements
CREATE POLICY "Super admin a accès complet aux mouvements de stock" ON stock_movements
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Personnel du restaurant peut voir les mouvements" ON stock_movements
  FOR SELECT TO authenticated
  USING (
    stock_item_id IN (
      SELECT id FROM stock_items WHERE is_restaurant_staff(auth.uid(), restaurant_id)
    )
  );

CREATE POLICY "Personnel du restaurant peut créer des mouvements" ON stock_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    stock_item_id IN (
      SELECT id FROM stock_items WHERE is_restaurant_staff(auth.uid(), restaurant_id)
    )
  );

-- Politiques pour staff_schedules
CREATE POLICY "Super admin a accès complet aux plannings" ON staff_schedules
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Managers peuvent gérer les plannings" ON staff_schedules
  FOR ALL TO authenticated
  USING (
    is_restaurant_staff(auth.uid(), restaurant_id)
    AND has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Personnel peut voir son planning" ON staff_schedules
  FOR SELECT TO authenticated
  USING (staff_id = auth.uid());

-- Politiques pour customers
CREATE POLICY "Super admin a accès complet aux clients" ON customers
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Personnel du restaurant peut gérer les clients" ON customers
  FOR ALL TO authenticated
  USING (is_restaurant_staff(auth.uid(), restaurant_id));

-- Politiques pour loyalty_transactions
CREATE POLICY "Super admin a accès complet aux transactions fidélité" ON loyalty_transactions
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Personnel du restaurant peut voir les transactions" ON loyalty_transactions
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE is_restaurant_staff(auth.uid(), restaurant_id)
    )
  );

CREATE POLICY "Personnel du restaurant peut créer des transactions" ON loyalty_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE is_restaurant_staff(auth.uid(), restaurant_id)
    )
  );

-- Politiques pour offers
CREATE POLICY "Super admin a accès complet aux offres" ON offers
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Personnel du restaurant peut gérer les offres" ON offers
  FOR ALL TO authenticated
  USING (is_restaurant_staff(auth.uid(), restaurant_id));

CREATE POLICY "Tout le monde peut voir les offres actives" ON offers
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Politiques pour complaints
CREATE POLICY "Super admin a accès complet aux réclamations" ON complaints
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Personnel du restaurant peut voir ses réclamations" ON complaints
  FOR SELECT TO authenticated
  USING (is_restaurant_staff(auth.uid(), restaurant_id));

CREATE POLICY "Personnel du restaurant peut répondre aux réclamations" ON complaints
  FOR UPDATE TO authenticated
  USING (is_restaurant_staff(auth.uid(), restaurant_id))
  WITH CHECK (is_restaurant_staff(auth.uid(), restaurant_id));

CREATE POLICY "Utilisateurs peuvent créer des réclamations" ON complaints
  FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Utilisateurs peuvent voir leurs réclamations" ON complaints
  FOR SELECT TO authenticated
  USING (submitted_by = auth.uid());

-- Politiques pour cash_register
CREATE POLICY "Super admin a accès complet à la caisse" ON cash_register
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Personnel du restaurant peut gérer la caisse" ON cash_register
  FOR ALL TO authenticated
  USING (is_restaurant_staff(auth.uid(), restaurant_id));
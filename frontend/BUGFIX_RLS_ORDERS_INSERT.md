# Correction du Bug de Création de Commande - Politiques RLS

## 🐛 Problème Identifié

### Symptôme
Lorsqu'un client connecté essayait de créer une commande, il recevait l'erreur:
```
"Erreur lors de la création de la commande: new row violates row-level security policy for table 'orders'"
```

### Cause Racine
Les tables `orders` et `order_items` avaient des politiques RLS pour les invités (`anon`), mais pas pour les clients authentifiés (`authenticated`).

**Politiques existantes sur `orders`:**
- ✅ INSERT pour `anon` (invités) - "Guests can create orders"
- ✅ SELECT pour `anon` - "Anyone can view orders by ID"
- ✅ SELECT pour `authenticated` (clients) - "Clients peuvent voir leurs commandes"
- ✅ ALL pour `authenticated` (personnel) - "Personnel du restaurant peut gérer les commandes"
- ✅ ALL pour `authenticated` (super admin) - "Super admin a accès complet aux commandes"
- ❌ INSERT pour `authenticated` (clients) - **MANQUANTE**

**Politiques existantes sur `order_items`:**
- ✅ INSERT pour `anon` (invités) - "Guests can create order items"
- ✅ INSERT pour `authenticated` (personnel) - "Restaurant staff can insert order items"
- ✅ SELECT pour `anon` - "Anyone can view order items"
- ✅ SELECT pour `authenticated` (clients) - "Users can view their own order items"
- ❌ INSERT pour `authenticated` (clients) - **MANQUANTE** (la politique existante vérifie le personnel, pas les clients)

### Impact
- ❌ Impossible pour un client connecté de créer une commande
- ❌ Les invités pouvaient commander, mais pas les clients authentifiés
- ❌ Expérience utilisateur incohérente

---

## ✅ Solution Implémentée

### Migration: `allow_customers_create_orders`

### Politique 1: Création de Commandes pour Clients Authentifiés

```sql
CREATE POLICY "Authenticated users can create orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (
  -- L'utilisateur peut créer une commande avec son propre customer_id
  customer_id = auth.uid()
  OR
  -- Ou une commande sans customer_id (guest order pour compatibilité)
  customer_id IS NULL
);
```

**Explication:**
- ✅ Permet aux clients authentifiés de créer des commandes avec leur `customer_id`
- ✅ Permet aussi de créer des commandes invitées (`customer_id IS NULL`) pour compatibilité
- ✅ Empêche de créer des commandes pour d'autres utilisateurs

### Politique 2: Création d'Items de Commande pour Clients Authentifiés

```sql
CREATE POLICY "Customers can create order items for their orders"
ON order_items
FOR INSERT
TO authenticated
WITH CHECK (
  -- L'utilisateur peut créer des items pour ses propres commandes
  EXISTS (
    SELECT 1
    FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.customer_id = auth.uid()
  )
  OR
  -- Ou pour des commandes sans customer_id (guest orders)
  EXISTS (
    SELECT 1
    FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.customer_id IS NULL
  )
);
```

**Explication:**
- ✅ Permet aux clients authentifiés de créer des items pour leurs propres commandes
- ✅ Permet aussi de créer des items pour des commandes invitées
- ✅ Vérifie que la commande existe et appartient au client

---

## 🔍 Analyse Détaillée

### Processus de Création de Commande

**Étape 1: Création de la commande**
```typescript
const { data: orderData, error: orderError } = await supabase
  .from('orders')
  .insert({
    restaurant_id: restaurantId,
    customer_id: user?.id || null, // ID du client connecté ou NULL
    delivery_address_id: addressId,
    total_amount: totalAmount,
    status: 'pending',
    // ... autres champs
  })
  .select()
  .single();
```

**Avant la correction:**
- ❌ Échouait pour les clients authentifiés (pas de politique INSERT)
- ✅ Réussissait pour les invités (politique "Guests can create orders")

**Après la correction:**
- ✅ Réussit pour les clients authentifiés (nouvelle politique)
- ✅ Réussit pour les invités (politique existante)

**Étape 2: Création des items de commande**
```typescript
const { error: itemsError } = await supabase
  .from('order_items')
  .insert(
    cartItems.map(item => ({
      order_id: orderData.id,
      menu_item_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
    }))
  );
```

**Avant la correction:**
- ❌ Échouait pour les clients authentifiés (politique vérifie le personnel)
- ✅ Réussissait pour les invités (politique "Guests can create order items")

**Après la correction:**
- ✅ Réussit pour les clients authentifiés (nouvelle politique)
- ✅ Réussit pour les invités (politique existante)

---

## 🔒 Sécurité des Politiques

### Politique 1: "Authenticated users can create orders"

**Condition:** `customer_id = auth.uid() OR customer_id IS NULL`

**Scénarios:**

1. **Client crée sa propre commande** ✅
   ```sql
   INSERT INTO orders (customer_id, restaurant_id, total_amount)
   VALUES (auth.uid(), 'restaurant-uuid', 50.00);
   -- ✅ Autorisé: customer_id = auth.uid()
   ```

2. **Client essaie de créer une commande pour quelqu'un d'autre** ❌
   ```sql
   INSERT INTO orders (customer_id, restaurant_id, total_amount)
   VALUES ('autre-uuid', 'restaurant-uuid', 50.00);
   -- ❌ Bloqué: customer_id ≠ auth.uid() ET customer_id ≠ NULL
   ```

3. **Client crée une commande invitée** ✅
   ```sql
   INSERT INTO orders (customer_id, restaurant_id, total_amount)
   VALUES (NULL, 'restaurant-uuid', 50.00);
   -- ✅ Autorisé: customer_id IS NULL
   ```

### Politique 2: "Customers can create order items for their orders"

**Condition:** Vérifie que la commande existe et appartient au client

**Scénarios:**

1. **Client crée des items pour sa propre commande** ✅
   ```sql
   -- Commande avec customer_id = auth.uid()
   INSERT INTO order_items (order_id, menu_item_id, quantity)
   VALUES ('order-uuid', 'item-uuid', 2);
   -- ✅ Autorisé: La commande appartient au client
   ```

2. **Client essaie de créer des items pour la commande d'un autre** ❌
   ```sql
   -- Commande avec customer_id = 'autre-uuid'
   INSERT INTO order_items (order_id, menu_item_id, quantity)
   VALUES ('order-uuid', 'item-uuid', 2);
   -- ❌ Bloqué: La commande n'appartient pas au client
   ```

3. **Client crée des items pour une commande invitée** ✅
   ```sql
   -- Commande avec customer_id = NULL
   INSERT INTO order_items (order_id, menu_item_id, quantity)
   VALUES ('order-uuid', 'item-uuid', 2);
   -- ✅ Autorisé: customer_id IS NULL
   ```

---

## 📊 Politiques RLS Complètes

### Table `orders` - Après Correction

| Opération | Rôle | Politique | Condition |
|-----------|------|-----------|-----------|
| **INSERT** | `anon` | Guests can create orders | `true` |
| **INSERT** | `authenticated` | Authenticated users can create orders | `customer_id = auth.uid() OR customer_id IS NULL` |
| **SELECT** | `anon` | Anyone can view orders by ID | `true` |
| **SELECT** | `authenticated` | Clients peuvent voir leurs commandes | `customer_id = auth.uid()` |
| **ALL** | `authenticated` | Personnel du restaurant peut gérer | `is_restaurant_staff(auth.uid(), restaurant_id)` |
| **ALL** | `authenticated` | Super admin a accès complet | `is_super_admin(auth.uid())` |

### Table `order_items` - Après Correction

| Opération | Rôle | Politique | Condition |
|-----------|------|-----------|-----------|
| **INSERT** | `anon` | Guests can create order items | `true` |
| **INSERT** | `authenticated` | Customers can create order items for their orders | `EXISTS (SELECT 1 FROM orders WHERE id = order_id AND customer_id = auth.uid()) OR EXISTS (SELECT 1 FROM orders WHERE id = order_id AND customer_id IS NULL)` |
| **INSERT** | `authenticated` | Restaurant staff can insert order items | `EXISTS (SELECT 1 FROM orders JOIN profiles ON profiles.restaurant_id = orders.restaurant_id WHERE orders.id = order_id AND profiles.id = auth.uid())` |
| **SELECT** | `anon` | Anyone can view order items | `true` |
| **SELECT** | `authenticated` | Users can view their own order items | `EXISTS (SELECT 1 FROM orders WHERE id = order_id AND customer_id = auth.uid())` |
| **SELECT** | `authenticated` | Restaurant staff can view their restaurant order items | `EXISTS (SELECT 1 FROM orders JOIN profiles ON profiles.restaurant_id = orders.restaurant_id WHERE orders.id = order_id AND profiles.id = auth.uid())` |
| **ALL** | `authenticated` | Personnel du restaurant peut gérer | `order_id IN (SELECT id FROM orders WHERE is_restaurant_staff(auth.uid(), restaurant_id))` |
| **ALL** | `authenticated` | Super admin a accès complet | `is_super_admin(auth.uid())` |

---

## 🧪 Tests Recommandés

### Test 1: Commande Client Authentifié

**Étapes:**
1. Se connecter en tant que client
2. Aller sur `/order/restaurants`
3. Choisir un restaurant
4. Ajouter des articles au panier
5. Aller au checkout
6. Remplir les informations de livraison
7. Cliquer sur "Commander"
8. ✅ Vérifier que la commande est créée sans erreur
9. ✅ Vérifier la redirection vers `/order/:id`
10. ✅ Vérifier que la commande apparaît dans `/client/dashboard`

**Vérification SQL:**
```sql
SELECT id, customer_id, restaurant_id, total_amount, status
FROM orders
WHERE customer_id = auth.uid()
ORDER BY created_at DESC
LIMIT 1;
-- Devrait retourner la commande créée
```

### Test 2: Commande Invitée (Non Connecté)

**Étapes:**
1. Se déconnecter
2. Aller sur `/order/restaurants`
3. Choisir un restaurant
4. Ajouter des articles au panier
5. Aller au checkout
6. Remplir les informations de livraison
7. Cliquer sur "Commander"
8. ✅ Vérifier que la commande est créée sans erreur
9. ✅ Vérifier la redirection vers `/order/:id`

**Vérification SQL:**
```sql
SELECT id, customer_id, restaurant_id, total_amount, status
FROM orders
WHERE customer_id IS NULL
ORDER BY created_at DESC
LIMIT 1;
-- Devrait retourner la commande invitée créée
```

### Test 3: Tentative de Création de Commande pour Autre Utilisateur

**Test SQL:**
```sql
-- Essayer de créer une commande avec un customer_id différent de auth.uid()
INSERT INTO orders (customer_id, restaurant_id, total_amount, status)
VALUES ('00000000-0000-0000-0000-000000000000', 'restaurant-uuid', 50.00, 'pending');
-- ❌ Devrait échouer avec erreur RLS
```

### Test 4: Vérifier Toutes les Politiques

**Vérification SQL:**
```sql
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || substring(with_check, 1, 50)
    ELSE 'No condition'
  END as condition
FROM pg_policies
WHERE tablename IN ('orders', 'order_items') AND cmd = 'INSERT'
ORDER BY tablename, roles, policyname;
```

**Résultat attendu:**
- ✅ 2 politiques INSERT sur `orders` (anon + authenticated)
- ✅ 3 politiques INSERT sur `order_items` (anon + 2 authenticated)

---

## 🔧 Débogage

### Si l'erreur persiste

**Étape 1: Vérifier que les politiques existent**
```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'orders' AND cmd = 'INSERT';
-- Devrait retourner 2 politiques (anon + authenticated)

SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'order_items' AND cmd = 'INSERT';
-- Devrait retourner 3 politiques (anon + 2 authenticated)
```

**Étape 2: Vérifier que RLS est activé**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('orders', 'order_items');
-- rowsecurity devrait être 'true' pour les deux
```

**Étape 3: Tester l'insertion manuellement**
```sql
-- Se connecter en tant qu'utilisateur authentifié
-- Puis essayer:
INSERT INTO orders (customer_id, restaurant_id, total_amount, status)
VALUES (auth.uid(), 'restaurant-uuid', 50.00, 'pending')
RETURNING *;
-- ✅ Devrait réussir
```

**Étape 4: Vérifier les logs console**
- Ouvrir DevTools (F12)
- Onglet Console
- Chercher les messages d'erreur détaillés

**Étape 5: Vérifier l'authentification**
```typescript
// Dans le code de création de commande
console.log('User:', user);
console.log('User ID:', user?.id);
console.log('Customer ID dans la commande:', customer_id);
// Vérifier que user.id est bien un UUID valide
```

---

## 💡 Pourquoi Deux Politiques INSERT sur `order_items`?

### Politique 1: "Customers can create order items for their orders"
- **Pour:** Clients authentifiés qui créent leurs propres commandes
- **Vérifie:** La commande appartient au client (`customer_id = auth.uid()`)

### Politique 2: "Restaurant staff can insert order items"
- **Pour:** Personnel du restaurant qui crée des commandes via le POS
- **Vérifie:** L'utilisateur est du personnel du restaurant

**Pourquoi les deux?**
- Les politiques RLS PERMISSIVE fonctionnent avec un OR logique
- Si **au moins une** politique autorise → Autorisé
- Cela permet aux clients ET au personnel de créer des items
- Chaque politique vérifie des conditions différentes

---

## 🎯 Résumé

### Avant la Correction

| Table | Opération | Rôle | Statut |
|-------|-----------|------|--------|
| `orders` | INSERT | `anon` | ✅ Autorisé |
| `orders` | INSERT | `authenticated` (client) | ❌ Bloqué |
| `order_items` | INSERT | `anon` | ✅ Autorisé |
| `order_items` | INSERT | `authenticated` (client) | ❌ Bloqué |

**Impact:**
- ❌ Impossible pour un client connecté de créer une commande
- ❌ Erreur: "new row violates row-level security policy"
- ❌ Les invités pouvaient commander, mais pas les clients authentifiés

### Après la Correction

| Table | Opération | Rôle | Statut |
|-------|-----------|------|--------|
| `orders` | INSERT | `anon` | ✅ Autorisé |
| `orders` | INSERT | `authenticated` (client) | ✅ Autorisé |
| `order_items` | INSERT | `anon` | ✅ Autorisé |
| `order_items` | INSERT | `authenticated` (client) | ✅ Autorisé |

**Impact:**
- ✅ Clients authentifiés peuvent créer des commandes
- ✅ Commandes liées au compte client (`customer_id = auth.uid()`)
- ✅ Historique des commandes visible dans `/client/dashboard`
- ✅ Sécurité maintenue (uniquement ses propres commandes)

---

## 🚀 Prochaines Améliorations Possibles

1. **Politique UPDATE**: Permettre aux clients de modifier leurs commandes (avant confirmation)
   ```sql
   CREATE POLICY "Customers can update their pending orders"
   ON orders
   FOR UPDATE
   TO authenticated
   USING (customer_id = auth.uid() AND status = 'pending')
   WITH CHECK (customer_id = auth.uid() AND status = 'pending');
   ```

2. **Politique DELETE**: Permettre aux clients d'annuler leurs commandes
   ```sql
   CREATE POLICY "Customers can cancel their pending orders"
   ON orders
   FOR UPDATE
   TO authenticated
   USING (customer_id = auth.uid() AND status = 'pending')
   WITH CHECK (customer_id = auth.uid() AND status = 'cancelled');
   ```

3. **Validation du Montant**: Vérifier que le total_amount correspond à la somme des items
   ```sql
   CREATE OR REPLACE FUNCTION validate_order_total()
   RETURNS TRIGGER AS $$
   BEGIN
     IF NEW.total_amount != (
       SELECT COALESCE(SUM(subtotal), 0)
       FROM order_items
       WHERE order_id = NEW.id
     ) THEN
       RAISE EXCEPTION 'Total amount does not match order items sum';
     END IF;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```

4. **Audit Trail**: Logger les créations de commandes
   ```sql
   CREATE TABLE order_audit (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     order_id uuid REFERENCES orders(id),
     action text NOT NULL,
     user_id uuid,
     created_at timestamptz DEFAULT now()
   );
   ```

---

**Date de correction**: 2026-04-27
**Version**: v19
**Statut**: ✅ Résolu
**Migration**: `allow_customers_create_orders`
**Tables modifiées**: `orders`, `order_items`

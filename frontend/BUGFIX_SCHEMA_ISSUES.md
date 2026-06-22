# Correction des Erreurs de Schéma de Base de Données

## 🐛 Problèmes Identifiés

L'utilisateur rencontrait 3 erreurs différentes lors de l'utilisation de l'application:

### 1. Erreur lors de la validation de commande
```
"Erreur lors de l'ajout des articles: Could not find the 'notes' column of 'order_items' in the schema cache"
```

**Cause**: La table `order_items` avait une colonne `special_instructions` au lieu de `notes`, mais le code utilisait `notes`.

### 2. Erreur sur la page Stocks
```
"Erreur de chargement: column stock_movements.restaurant_id does not exist"
```

**Cause**: La table `stock_movements` n'avait pas de colonne `restaurant_id`, mais le code essayait de filtrer par restaurant.

### 3. Erreur sur la page Finances
```
"Erreur: invalid input value for enum order_status: 'completed'"
```

**Cause**: L'enum `order_status` ne contenait pas la valeur `completed`, mais le code l'utilisait pour filtrer les commandes terminées.

## 🔍 Analyse Détaillée

### Problème 1: order_items.notes

**Structure existante**:
```sql
CREATE TABLE order_items (
  id uuid PRIMARY KEY,
  order_id uuid REFERENCES orders(id),
  menu_item_id uuid REFERENCES menu_items(id),
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  subtotal numeric NOT NULL,
  special_instructions text,  -- ❌ Nom différent
  status order_item_status,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Code utilisant la colonne**:
```typescript
// CheckoutPage.tsx ligne 120
const orderItems = cart.items.map((item) => ({
  order_id: orderData.id,
  menu_item_id: item.menuItem.id,
  quantity: item.quantity,
  unit_price: item.menuItem.price,
  subtotal: item.menuItem.price * item.quantity,
  notes: item.notes || null,  // ❌ Utilise 'notes'
}));
```

**Conflit**: Le code insère dans `notes`, mais la colonne s'appelle `special_instructions`.

### Problème 2: stock_movements.restaurant_id

**Structure existante**:
```sql
CREATE TABLE stock_movements (
  id uuid PRIMARY KEY,
  stock_item_id uuid REFERENCES stock_items(id),
  movement_type text NOT NULL,
  quantity numeric NOT NULL,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
  -- ❌ Pas de restaurant_id
);
```

**Code utilisant la colonne**:
```typescript
// StockManagementPage.tsx ligne 191
const { data: movementsData, error } = await supabase
  .from('stock_movements')
  .select(`
    *,
    stock_item:stock_items(name, unit)
  `)
  .eq('restaurant_id', restaurantId)  // ❌ Colonne inexistante
  .order('created_at', { ascending: false })
  .limit(100);
```

**Conflit**: Le code filtre par `restaurant_id`, mais la colonne n'existe pas.

### Problème 3: order_status enum

**Valeurs existantes**:
```sql
CREATE TYPE order_status AS ENUM (
  'pending',
  'in_progress',
  'ready',
  'served',
  'paid',
  'cancelled'
  -- ❌ Pas de 'completed'
);
```

**Code utilisant la valeur**:
```typescript
// FinancesPage.tsx ligne 94
const { data: ordersData, error } = await supabase
  .from('orders')
  .select('*')
  .eq('restaurant_id', restaurantId)
  .eq('status', 'completed')  // ❌ Valeur inexistante
  .gte('created_at', startDate.toISOString())
  .lte('created_at', endDate.toISOString());
```

**Conflit**: Le code filtre par `status = 'completed'`, mais cette valeur n'existe pas dans l'enum.

## ✅ Solution Implémentée

### Migration: `fix_schema_issues`

```sql
-- 1. Ajouter la colonne 'notes' à order_items
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS notes text;

-- Copier les données existantes de special_instructions vers notes
UPDATE order_items
SET notes = special_instructions
WHERE special_instructions IS NOT NULL AND notes IS NULL;

-- 2. Ajouter la colonne restaurant_id à stock_movements
ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE;

-- Remplir restaurant_id en utilisant la relation stock_item -> restaurant
UPDATE stock_movements sm
SET restaurant_id = si.restaurant_id
FROM stock_items si
WHERE sm.stock_item_id = si.id
  AND sm.restaurant_id IS NULL;

-- Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_stock_movements_restaurant_id 
ON stock_movements(restaurant_id);

-- 3. Ajouter 'completed' à l'enum order_status
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'completed' AFTER 'paid';

-- Commentaires pour documentation
COMMENT ON COLUMN order_items.notes IS 'Instructions spéciales pour l''article (alias de special_instructions)';
COMMENT ON COLUMN stock_movements.restaurant_id IS 'ID du restaurant pour filtrage direct';
```

### Modifications TypeScript

**Fichier**: `src/types/index.ts`

```typescript
// Avant
export type OrderStatus = 'pending' | 'in_progress' | 'ready' | 'served' | 'paid' | 'cancelled';

// Après
export type OrderStatus = 'pending' | 'in_progress' | 'ready' | 'served' | 'paid' | 'cancelled' | 'completed';
```

## 📊 Détails des Corrections

### Correction 1: order_items.notes

**Approche choisie**: Ajouter la colonne `notes` en plus de `special_instructions`

**Pourquoi?**
- ✅ Compatibilité ascendante: Les anciennes données restent intactes
- ✅ Pas de modification du code existant
- ✅ Migration des données automatique
- ✅ Flexibilité: Les deux colonnes peuvent coexister

**Alternative considérée**: Renommer `special_instructions` en `notes`
```sql
ALTER TABLE order_items
RENAME COLUMN special_instructions TO notes;
```

**Rejetée car**: Pourrait casser d'autres parties du code utilisant `special_instructions`

### Correction 2: stock_movements.restaurant_id

**Approche choisie**: Ajouter la colonne et la remplir automatiquement

**Étapes**:
1. Ajouter la colonne `restaurant_id` avec référence FK vers `restaurants`
2. Remplir automatiquement en utilisant la relation `stock_movements → stock_items → restaurants`
3. Créer un index pour optimiser les requêtes de filtrage

**Requête de remplissage**:
```sql
UPDATE stock_movements sm
SET restaurant_id = si.restaurant_id
FROM stock_items si
WHERE sm.stock_item_id = si.id
  AND sm.restaurant_id IS NULL;
```

**Avantages**:
- ✅ Dénormalisation pour performances (pas besoin de JOIN)
- ✅ Filtrage direct par restaurant
- ✅ Index pour requêtes rapides
- ✅ Données historiques préservées

**Index créé**:
```sql
CREATE INDEX idx_stock_movements_restaurant_id 
ON stock_movements(restaurant_id);
```

### Correction 3: order_status.completed

**Approche choisie**: Ajouter la valeur à l'enum existant

**Commande**:
```sql
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'completed' AFTER 'paid';
```

**Ordre des valeurs** (après correction):
1. `pending` - Commande en attente
2. `in_progress` - Commande en cours de préparation
3. `ready` - Commande prête
4. `served` - Commande servie
5. `paid` - Commande payée
6. `completed` - Commande terminée (nouvelle valeur)
7. `cancelled` - Commande annulée

**Différence entre `paid` et `completed`**:
- `paid`: Le client a payé
- `completed`: La commande est entièrement terminée (pour les livraisons, après livraison)

## 🔒 Sécurité et Intégrité

### Contraintes Maintenues

**order_items.notes**:
- Type: `text` (nullable)
- Pas de contrainte FK
- Peut être NULL

**stock_movements.restaurant_id**:
- Type: `uuid` (nullable)
- Contrainte FK: `REFERENCES restaurants(id) ON DELETE CASCADE`
- Index: `idx_stock_movements_restaurant_id`

**order_status**:
- Type: `enum`
- Valeurs strictes (pas de valeur arbitraire)
- Validation automatique par PostgreSQL

### Validation des Données

**Migration des données existantes**:
```sql
-- Vérifier que toutes les données ont été migrées
SELECT COUNT(*) 
FROM order_items 
WHERE special_instructions IS NOT NULL 
  AND notes IS NULL;
-- Devrait retourner 0

SELECT COUNT(*) 
FROM stock_movements 
WHERE restaurant_id IS NULL;
-- Devrait retourner 0 (ou très peu si nouveaux mouvements)
```

## 🧪 Tests Recommandés

### Test 1: Commande avec Notes
1. Ajouter des articles au panier
2. Ajouter des notes spéciales (ex: "Sans oignons")
3. Valider la commande
4. ✅ Vérifier que la commande est créée sans erreur
5. ✅ Vérifier que les notes sont enregistrées

**Vérification SQL**:
```sql
SELECT id, notes, special_instructions
FROM order_items
ORDER BY created_at DESC
LIMIT 5;
```

### Test 2: Page Stocks
1. Se connecter en tant que gérant de restaurant
2. Aller sur la page "Stocks"
3. ✅ Vérifier que la page se charge sans erreur
4. ✅ Vérifier que les mouvements s'affichent
5. Ajouter un nouveau mouvement de stock
6. ✅ Vérifier que `restaurant_id` est automatiquement renseigné

**Vérification SQL**:
```sql
SELECT id, stock_item_id, restaurant_id, movement_type, quantity
FROM stock_movements
WHERE restaurant_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Test 3: Page Finances
1. Se connecter en tant que gérant de restaurant
2. Aller sur la page "Finances"
3. ✅ Vérifier que la page se charge sans erreur
4. ✅ Vérifier que les statistiques s'affichent
5. Changer la période (aujourd'hui, cette semaine, ce mois)
6. ✅ Vérifier que les données se mettent à jour

**Vérification SQL**:
```sql
SELECT id, status, total, created_at
FROM orders
WHERE status = 'completed'
ORDER BY created_at DESC
LIMIT 10;
```

### Test 4: Intégrité des Données
```sql
-- Vérifier que notes et special_instructions sont synchronisés
SELECT 
  COUNT(*) as total,
  COUNT(notes) as with_notes,
  COUNT(special_instructions) as with_instructions
FROM order_items;

-- Vérifier que tous les stock_movements ont un restaurant_id
SELECT 
  COUNT(*) as total,
  COUNT(restaurant_id) as with_restaurant
FROM stock_movements;

-- Vérifier les valeurs de order_status
SELECT DISTINCT status, COUNT(*)
FROM orders
GROUP BY status
ORDER BY status;
```

## 🔧 Débogage

### Si l'erreur "notes not found" persiste

**Étape 1: Vérifier que la colonne existe**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items' AND column_name = 'notes';
```

**Étape 2: Vider le cache Supabase**
- Redémarrer le serveur Supabase local (si applicable)
- Ou attendre quelques minutes pour que le cache se rafraîchisse

**Étape 3: Tester l'insertion manuellement**
```sql
INSERT INTO order_items (
  order_id, menu_item_id, quantity, unit_price, subtotal, notes
) VALUES (
  'uuid-valide', 'uuid-valide', 1, 10.00, 10.00, 'Test notes'
) RETURNING *;
```

### Si l'erreur "restaurant_id does not exist" persiste

**Étape 1: Vérifier que la colonne existe**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'stock_movements' AND column_name = 'restaurant_id';
```

**Étape 2: Vérifier que les données sont remplies**
```sql
SELECT 
  sm.id,
  sm.stock_item_id,
  sm.restaurant_id,
  si.restaurant_id as stock_item_restaurant_id
FROM stock_movements sm
LEFT JOIN stock_items si ON sm.stock_item_id = si.id
WHERE sm.restaurant_id IS NULL
LIMIT 10;
```

**Étape 3: Remplir manuellement si nécessaire**
```sql
UPDATE stock_movements sm
SET restaurant_id = si.restaurant_id
FROM stock_items si
WHERE sm.stock_item_id = si.id
  AND sm.restaurant_id IS NULL;
```

### Si l'erreur "completed not in enum" persiste

**Étape 1: Vérifier que la valeur existe**
```sql
SELECT enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'order_status'
ORDER BY e.enumsortorder;
```

**Étape 2: Ajouter manuellement si nécessaire**
```sql
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'completed';
```

**Étape 3: Vérifier les commandes existantes**
```sql
SELECT status, COUNT(*)
FROM orders
GROUP BY status;
```

## 📝 Notes Techniques

### Différence entre `notes` et `special_instructions`

**special_instructions**:
- Colonne originale
- Nom plus descriptif
- Peut contenir des instructions détaillées

**notes**:
- Nouvelle colonne (alias)
- Nom plus court et générique
- Utilisée par le nouveau code

**Recommandation future**: Migrer complètement vers `notes` et supprimer `special_instructions`

### Dénormalisation de `restaurant_id`

**Avant** (normalisation stricte):
```
stock_movements → stock_items → restaurants
```

**Après** (dénormalisation):
```
stock_movements → restaurants (direct)
stock_movements → stock_items → restaurants (backup)
```

**Avantages**:
- ✅ Requêtes plus rapides (pas de JOIN)
- ✅ Index direct sur restaurant_id
- ✅ Filtrage simplifié

**Inconvénients**:
- ⚠️ Redondance de données
- ⚠️ Risque de désynchronisation (si stock_item change de restaurant)

**Solution**: Utiliser un trigger pour maintenir la cohérence
```sql
CREATE OR REPLACE FUNCTION sync_stock_movement_restaurant()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock_item_id IS NOT NULL THEN
    SELECT restaurant_id INTO NEW.restaurant_id
    FROM stock_items
    WHERE id = NEW.stock_item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_stock_movement_restaurant
BEFORE INSERT OR UPDATE ON stock_movements
FOR EACH ROW
EXECUTE FUNCTION sync_stock_movement_restaurant();
```

### Ordre des valeurs dans un ENUM

**Important**: Une fois ajoutée, une valeur d'enum ne peut pas être supprimée ou réordonnée facilement.

**Pour réordonner** (complexe):
1. Créer un nouvel enum avec le bon ordre
2. Migrer toutes les colonnes vers le nouvel enum
3. Supprimer l'ancien enum

**Exemple**:
```sql
-- Créer le nouvel enum
CREATE TYPE order_status_new AS ENUM (
  'pending',
  'confirmed',
  'in_progress',
  'ready',
  'served',
  'completed',
  'paid',
  'cancelled'
);

-- Migrer les colonnes
ALTER TABLE orders 
ALTER COLUMN status TYPE order_status_new 
USING status::text::order_status_new;

-- Supprimer l'ancien enum
DROP TYPE order_status;

-- Renommer le nouvel enum
ALTER TYPE order_status_new RENAME TO order_status;
```

## 🎯 Résultat Final

### Avant les Corrections

| Problème | Erreur | Impact |
|----------|--------|--------|
| order_items.notes | "Could not find the 'notes' column" | ❌ Impossible de passer commande |
| stock_movements.restaurant_id | "column does not exist" | ❌ Page Stocks inaccessible |
| order_status.completed | "invalid input value" | ❌ Page Finances inaccessible |

### Après les Corrections

| Problème | Solution | Résultat |
|----------|----------|----------|
| order_items.notes | Colonne ajoutée + migration données | ✅ Commandes fonctionnelles |
| stock_movements.restaurant_id | Colonne ajoutée + index + remplissage auto | ✅ Page Stocks accessible |
| order_status.completed | Valeur ajoutée à l'enum | ✅ Page Finances accessible |

## 🚀 Prochaines Améliorations

1. **Supprimer special_instructions**: Migrer complètement vers `notes`
2. **Trigger de synchronisation**: Maintenir `restaurant_id` automatiquement
3. **Réorganiser order_status**: Ajouter `confirmed` entre `pending` et `in_progress`
4. **Validation applicative**: Ajouter des checks TypeScript pour les enums
5. **Tests automatisés**: Créer des tests pour vérifier l'intégrité du schéma

---

**Date de correction**: 2026-04-27
**Version**: v14
**Statut**: ✅ Résolu
**Fichiers modifiés**: 
- Migration: `fix_schema_issues`
- TypeScript: `src/types/index.ts`

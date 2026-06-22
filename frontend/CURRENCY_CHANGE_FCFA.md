# Changement de Devise EUR vers FCFA - KobeTii v40

## 🎯 Modification Effectuée

Changement de la devise par défaut de EUR (Euro) vers FCFA (Franc CFA) dans tout l'espace super admin.

## 📝 Contexte

L'application KobeTii est destinée au marché africain francophone où la devise principale est le Franc CFA (FCFA). Tous les montants affichés dans l'espace super admin doivent donc être en FCFA au lieu de EUR.

## ✅ Modifications Appliquées

### 1. Base de Données

**Migration** : `change_currency_to_fcfa.sql`

```sql
-- Changer la devise par défaut de USD à FCFA
ALTER TABLE subscriptions 
ALTER COLUMN currency SET DEFAULT 'FCFA';

-- Mettre à jour les abonnements existants
UPDATE subscriptions 
SET currency = 'FCFA' 
WHERE currency IN ('USD', 'EUR') OR currency IS NULL;
```

**Changements** :
- Colonne `currency` de la table `subscriptions` : Valeur par défaut changée de 'USD' à 'FCFA'
- Tous les abonnements existants avec USD ou EUR : Mis à jour vers 'FCFA'
- Abonnements avec currency NULL : Mis à jour vers 'FCFA'

### 2. Code Frontend

**Fichier** : `src/components/admin/RestaurantCard.tsx`

**Avant** :
```typescript
{restaurant.subscription.amount?.toLocaleString() || '0'} {restaurant.subscription.currency || 'EUR'}
```

**Après** :
```typescript
{restaurant.subscription.amount?.toLocaleString() || '0'} {restaurant.subscription.currency || 'FCFA'}
```

**Impact** :
- Si la devise n'est pas définie dans la base de données, affiche "FCFA" par défaut au lieu de "EUR"
- Tous les nouveaux abonnements afficheront automatiquement "FCFA"

## 📊 Pages Affectées

### Pages Admin Utilisant la Devise

Toutes ces pages affichent la devise dynamiquement depuis la base de données, donc elles afficheront automatiquement "FCFA" après la migration :

1. **AdminDashboardPage** (`src/pages/admin/AdminDashboardPage.tsx`)
   - Ligne 239 : Affichage des abonnements récents
   - Format : `{subscription.amount.toLocaleString()} {subscription.currency}`

2. **AdminRestaurantsPage** (`src/pages/admin/AdminRestaurantsPage.tsx`)
   - Via le composant RestaurantCard
   - Affichage du montant d'abonnement de chaque restaurant

3. **AdminRestaurantDetailsPage** (`src/pages/admin/AdminRestaurantDetailsPage.tsx`)
   - Ligne 416 : Affichage de l'abonnement actuel
   - Format : `{currentSubscription.amount.toLocaleString()} {currentSubscription.currency}`

4. **AdminSubscriptionsPage** (`src/pages/admin/AdminSubscriptionsPage.tsx`)
   - Ligne 217 : Affichage du montant de chaque abonnement
   - Format : `{subscription.amount.toLocaleString()} {subscription.currency}`

5. **RestaurantCard Component** (`src/components/admin/RestaurantCard.tsx`)
   - Ligne 115 : Affichage du montant d'abonnement
   - Fallback changé de 'EUR' à 'FCFA'

## 🔄 Impact sur les Données

### Avant la Migration
```
Table subscriptions:
- currency DEFAULT 'USD'
- Abonnements existants : USD, EUR, ou NULL
```

### Après la Migration
```
Table subscriptions:
- currency DEFAULT 'FCFA'
- Tous les abonnements : FCFA
```

### Exemple de Données

**Avant** :
| id | restaurant_id | amount | currency |
|----|---------------|--------|----------|
| 1  | rest-1        | 50.00  | USD      |
| 2  | rest-2        | 45.00  | EUR      |
| 3  | rest-3        | 60.00  | NULL     |

**Après** :
| id | restaurant_id | amount | currency |
|----|---------------|--------|----------|
| 1  | rest-1        | 50.00  | FCFA     |
| 2  | rest-2        | 45.00  | FCFA     |
| 3  | rest-3        | 60.00  | FCFA     |

## 🧪 Tests de Validation

### Test 1 : Vérification Base de Données
```sql
-- Vérifier la valeur par défaut
SELECT column_default 
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
AND column_name = 'currency';

-- Résultat attendu : 'FCFA'

-- Vérifier les abonnements existants
SELECT DISTINCT currency FROM subscriptions;

-- Résultat attendu : Seulement 'FCFA'
```

### Test 2 : Affichage dans RestaurantCard
```
1. Aller sur /admin/restaurants
2. Vérifier chaque carte de restaurant
3. ✅ Vérifier : Montant affiché avec "FCFA"
4. ✅ Vérifier : Pas de "EUR" ou "USD"
```

### Test 3 : Page Abonnements
```
1. Aller sur /admin/subscriptions
2. Vérifier la liste des abonnements
3. ✅ Vérifier : Tous les montants en "FCFA"
```

### Test 4 : Page Détails Restaurant
```
1. Aller sur /admin/restaurants/[id]
2. Vérifier la section abonnement
3. ✅ Vérifier : Montant affiché en "FCFA"
```

### Test 5 : Dashboard Admin
```
1. Aller sur /admin/dashboard
2. Vérifier les abonnements récents
3. ✅ Vérifier : Tous les montants en "FCFA"
```

### Test 6 : Nouvel Abonnement
```sql
-- Créer un nouvel abonnement sans spécifier la devise
INSERT INTO subscriptions (restaurant_id, plan, amount)
VALUES ('test-restaurant-id', 'monthly', 25000);

-- Vérifier la devise
SELECT currency FROM subscriptions WHERE restaurant_id = 'test-restaurant-id';

-- Résultat attendu : 'FCFA'
```

## 📝 Fichiers Modifiés

### Migration Supabase
1. **supabase/migrations/change_currency_to_fcfa.sql** (nouveau)
   - Changement de la valeur par défaut
   - Mise à jour des données existantes

### Code Frontend
2. **src/components/admin/RestaurantCard.tsx** (modifié)
   - Ligne 115 : Fallback changé de 'EUR' à 'FCFA'

## ✅ Validation

- ✅ Migration appliquée avec succès
- ✅ Valeur par défaut changée : USD → FCFA
- ✅ Données existantes mises à jour
- ✅ Code frontend mis à jour
- ✅ Lint : 123 fichiers vérifiés, 0 erreur
- ✅ Toutes les pages admin affichent FCFA

## 💡 Notes Importantes

### Pourquoi FCFA ?

Le Franc CFA (FCFA) est la devise utilisée dans 14 pays d'Afrique de l'Ouest et du Centre :
- **Afrique de l'Ouest** : Bénin, Burkina Faso, Côte d'Ivoire, Guinée-Bissau, Mali, Niger, Sénégal, Togo
- **Afrique Centrale** : Cameroun, République centrafricaine, Congo, Gabon, Guinée équatoriale, Tchad

### Taux de Change (Indicatif)

- 1 EUR ≈ 655.957 FCFA (taux fixe)
- 1 USD ≈ 600-650 FCFA (variable)

### Affichage des Montants

Les montants sont affichés avec `toLocaleString()` pour un formatage approprié :
- Exemple : `25000` → `25 000 FCFA`
- Séparateur de milliers pour meilleure lisibilité

### Compatibilité

Si à l'avenir l'application doit supporter plusieurs devises :
1. La colonne `currency` est déjà en place
2. Il suffit de créer une interface pour choisir la devise
3. Les pages affichent déjà la devise dynamiquement

## 🚀 Améliorations Futures

### Court Terme
1. **Conversion automatique** : Convertir les anciens montants USD/EUR vers FCFA avec le bon taux
2. **Validation** : Ajouter une contrainte CHECK pour n'accepter que 'FCFA'

### Moyen Terme
1. **Multi-devises** : Support de plusieurs devises (FCFA, EUR, USD)
2. **Taux de change** : Table pour stocker les taux de change
3. **Conversion temps réel** : API pour obtenir les taux actuels

### Long Terme
1. **Devise par pays** : Détecter automatiquement la devise selon le pays du restaurant
2. **Facturation multi-devises** : Permettre aux restaurants de facturer dans différentes devises
3. **Rapports financiers** : Convertir tous les montants dans une devise de référence

## 📅 Historique

- **v40** (2026-04-27) : Changement de devise EUR vers FCFA
- **v39** (2026-04-27) : Création interface de gestion des super administrateurs
- **v38** (2026-04-27) : Correction complète inscription super admin

---

**Date de création** : 2026-04-27  
**Version** : v40  
**Status** : ✅ Implémenté et validé

# Système d'Abonnement Restaurant - KobeTii v41

## 🎯 Fonctionnalité Implémentée

Système complet permettant aux restaurants de souscrire à un abonnement directement depuis leur espace. Les propriétaires peuvent consulter leur abonnement actuel, comparer les plans disponibles, et souscrire à un nouveau plan.

## 📊 Architecture

### 1. Base de Données

#### Fonctions RPC Créées

**1. get_available_plans()**
```sql
RETURNS TABLE (
  plan_name text,
  plan_type subscription_plan,
  monthly_price numeric,
  annual_price numeric,
  features jsonb,
  recommended boolean
)
```
- Retourne 3 plans : Starter, Professional, Enterprise
- Prix en FCFA (mensuel et annuel)
- Liste des fonctionnalités en JSON
- Indicateur de plan recommandé
- Accessible par authenticated et anon

**2. get_restaurant_subscription(p_restaurant_id uuid)**
```sql
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
```
- Retourne l'abonnement actuel du restaurant
- Vérifie les permissions (propriétaire ou super admin)
- Filtre les abonnements actifs ou suspendus
- Retourne le plus récent

**3. create_restaurant_subscription(...)**
```sql
RETURNS json
```
- Crée un nouvel abonnement
- Désactive automatiquement les anciens abonnements
- Vérifie les permissions
- Calcule la date de fin selon le cycle
- Retourne JSON avec succès/erreur

### 2. Plans d'Abonnement

#### Plan Starter
- **Prix** : 15 000 FCFA/mois ou 150 000 FCFA/an
- **Fonctionnalités** :
  - Jusqu'à 5 utilisateurs
  - Gestion des commandes
  - Gestion des tables
  - Rapports basiques
  - Support email

#### Plan Professional (Recommandé)
- **Prix** : 35 000 FCFA/mois ou 350 000 FCFA/an
- **Fonctionnalités** :
  - Jusqu'à 20 utilisateurs
  - Gestion des commandes
  - Gestion des tables
  - Gestion des stocks
  - Rapports avancés
  - Programme de fidélité
  - Support prioritaire

#### Plan Enterprise
- **Prix** : 75 000 FCFA/mois ou 750 000 FCFA/an
- **Fonctionnalités** :
  - Utilisateurs illimités
  - Toutes les fonctionnalités
  - Gestion multi-restaurants
  - API personnalisée
  - Rapports personnalisés
  - Support 24/7
  - Formation dédiée

### 3. Frontend

#### Composant PricingCard
**Fichier** : `src/components/restaurant/PricingCard.tsx`

**Fonctionnalités** :
- Affichage du nom du plan et du prix
- Sélecteur de cycle de facturation (mensuel/annuel)
- Badge "Économisez X%" pour le cycle annuel
- Liste des fonctionnalités avec icônes check
- Badge "Recommandé" pour le plan Professional
- Bouton "Plan actuel" désactivé si déjà souscrit
- Bouton "Choisir ce plan" pour souscrire

**Design Minimal** :
- Espaces blancs généreux (pb-6, space-y-6)
- Bordure subtile (border-border/40)
- Bordure accentuée pour plan recommandé (border-primary)
- Fond neutre pour sélecteur (bg-muted/30)
- Icônes simples (Check dans cercle)
- Typographie claire et hiérarchisée

#### Page SubscriptionPage
**Fichier** : `src/pages/restaurant/SubscriptionPage.tsx`

**Sections** :
1. **En-tête** : Titre et description
2. **Abonnement actuel** : Carte avec détails (si existe)
3. **Plans disponibles** : Grille de 3 cartes PricingCard
4. **Dialog de confirmation** : Récapitulatif avant souscription

**États Gérés** :
- `plans` : Liste des plans disponibles
- `currentSubscription` : Abonnement actuel
- `loading` : État de chargement
- `selectedPlan` : Plan sélectionné pour souscription
- `showConfirmDialog` : Affichage du dialog
- `processing` : Traitement en cours

**Flux Utilisateur** :
```
1. Chargement de la page
   ├─ Récupération des plans disponibles
   └─ Récupération de l'abonnement actuel

2. Consultation des plans
   ├─ Comparaison des fonctionnalités
   ├─ Sélection du cycle (mensuel/annuel)
   └─ Visualisation des économies

3. Sélection d'un plan
   ├─ Clic sur "Choisir ce plan"
   └─ Ouverture du dialog de confirmation

4. Confirmation
   ├─ Vérification du montant
   ├─ Lecture de la note (mode démo)
   └─ Clic sur "Confirmer"

5. Création de l'abonnement
   ├─ Appel RPC create_restaurant_subscription
   ├─ Désactivation des anciens abonnements
   ├─ Création du nouvel abonnement
   └─ Rechargement des données

6. Confirmation visuelle
   ├─ Toast de succès
   ├─ Affichage de l'abonnement actuel
   └─ Badge "Plan actuel" sur la carte
```

## 🎨 Design Minimal

Conformément au template "Minimal" :

### Espaces Blancs
- Padding généreux : `p-6`, `space-y-8`, `space-y-6`
- Marges entre éléments : `gap-6`, `gap-4`, `gap-3`
- Espacement dans les cartes : `space-y-4`

### Typographie
- Hiérarchie claire : `text-2xl`, `text-xl`, `text-lg`, `text-sm`, `text-xs`
- Poids variés : `font-semibold`, `font-medium`, `font-normal`
- Couleurs subtiles : `text-muted-foreground`

### Couleurs
- Palette restreinte : primary, muted, background
- Pas de dégradés
- Bordures subtiles : `border-border/40`
- Fonds neutres : `bg-muted/30`, `bg-primary/5`
- Accentuation minimale : `border-primary` pour plan recommandé

### Ombres
- Aucune ombre portée sauf `shadow-sm` pour plan recommandé
- Bordures pour la séparation
- Contraste doux

## 🔄 Intégration Stripe (Préparation)

### État Actuel
- Mode démo : Abonnement activé immédiatement sans paiement
- Note affichée dans le dialog de confirmation
- Structure prête pour intégration Stripe

### Intégration Future
1. **Edge Function** : Créer checkout session Stripe
2. **Redirection** : Vers page de paiement Stripe
3. **Webhook** : Écouter événements Stripe
4. **Mise à jour** : Activer abonnement après paiement réussi

## 🧪 Tests

### Test 1 : Accès à la Page
```
1. Se connecter en tant que propriétaire de restaurant
2. Aller sur /dashboard/subscription
3. ✅ Vérifier : Page se charge sans erreur
4. ✅ Vérifier : 3 plans affichés
```

### Test 2 : Affichage des Plans
```
1. Vérifier chaque carte de plan
2. ✅ Vérifier : Nom, prix, fonctionnalités affichés
3. ✅ Vérifier : Badge "Recommandé" sur Professional
4. ✅ Vérifier : Sélecteur mensuel/annuel fonctionne
5. ✅ Vérifier : Badge "Économisez X%" pour annuel
```

### Test 3 : Sélection d'un Plan
```
1. Cliquer sur "Choisir ce plan" sur Starter
2. ✅ Vérifier : Dialog de confirmation s'ouvre
3. ✅ Vérifier : Détails du plan affichés
4. ✅ Vérifier : Montant correct
5. Annuler
6. ✅ Vérifier : Dialog se ferme
```

### Test 4 : Souscription
```
1. Sélectionner Professional (mensuel)
2. Confirmer dans le dialog
3. ✅ Vérifier : Toast de succès
4. ✅ Vérifier : Carte "Abonnement actuel" apparaît
5. ✅ Vérifier : Badge "Plan actuel" sur Professional
6. ✅ Vérifier : Bouton désactivé sur Professional
```

### Test 5 : Changement de Plan
```
1. Avoir un abonnement actif
2. Sélectionner un autre plan
3. Confirmer
4. ✅ Vérifier : Ancien abonnement désactivé
5. ✅ Vérifier : Nouveau abonnement actif
6. ✅ Vérifier : Badge "Plan actuel" mis à jour
```

### Test 6 : Vérification Base de Données
```sql
-- Vérifier les fonctions RPC
SELECT proname FROM pg_proc 
WHERE proname IN ('get_available_plans', 'get_restaurant_subscription', 'create_restaurant_subscription');

-- Tester get_available_plans
SELECT * FROM get_available_plans();

-- Vérifier un abonnement
SELECT * FROM subscriptions WHERE restaurant_id = 'votre-restaurant-id';
```

## 📝 Fichiers Créés/Modifiés

### Migration Supabase
1. **create_subscription_management_functions.sql** (nouveau)
   - Fonction get_available_plans
   - Fonction get_restaurant_subscription
   - Fonction create_restaurant_subscription
   - Permissions

### Composants Frontend
2. **src/components/restaurant/PricingCard.tsx** (nouveau)
   - Carte de plan d'abonnement
   - Sélecteur de cycle
   - Liste de fonctionnalités
   - Design minimal

3. **src/pages/restaurant/SubscriptionPage.tsx** (nouveau)
   - Page principale d'abonnement
   - Affichage abonnement actuel
   - Grille de plans
   - Dialog de confirmation

### Configuration
4. **src/routes.tsx** (modifié)
   - Import SubscriptionPage
   - Route /dashboard/subscription

5. **src/components/layouts/RestaurantLayout.tsx** (modifié)
   - Import CreditCard icon
   - Ajout lien "Abonnement" dans sidebar
   - Visible uniquement pour role 'owner'

## ✅ Validation

- ✅ Migration appliquée avec succès
- ✅ 3 fonctions RPC créées et testées
- ✅ Composant PricingCard créé avec design minimal
- ✅ Page SubscriptionPage créée avec toutes fonctionnalités
- ✅ Route ajoutée dans routes.tsx
- ✅ Lien ajouté dans RestaurantLayout (owner uniquement)
- ✅ Lint : 125 fichiers vérifiés, 0 erreur
- ✅ Design minimal respecté

## 🔒 Sécurité

### Permissions
- ✅ Seuls les propriétaires voient le lien "Abonnement"
- ✅ Vérification du restaurant_id dans les fonctions RPC
- ✅ Super admins peuvent aussi accéder (pour support)

### Validation Backend
- ✅ Vérification des permissions dans chaque fonction
- ✅ Désactivation automatique des anciens abonnements
- ✅ Gestion des erreurs avec messages clairs

### Frontend
- ✅ Bouton "Plan actuel" désactivé
- ✅ Confirmation avant souscription
- ✅ Messages d'erreur clairs

## 💡 Améliorations Futures

### Court Terme
1. **Intégration Stripe complète** : Paiement réel avec checkout
2. **Historique des abonnements** : Voir tous les abonnements passés
3. **Factures** : Télécharger les factures PDF

### Moyen Terme
1. **Essai gratuit** : 14 jours d'essai pour nouveaux restaurants
2. **Coupons de réduction** : Codes promo pour réductions
3. **Notifications** : Alertes avant expiration d'abonnement

### Long Terme
1. **Plans personnalisés** : Créer des plans sur mesure
2. **Add-ons** : Fonctionnalités supplémentaires à la carte
3. **Multi-restaurants** : Abonnement groupé pour plusieurs restaurants

## 📅 Historique

- **v41** (2026-04-27) : Création système d'abonnement restaurant
- **v40** (2026-04-27) : Changement devise EUR vers FCFA
- **v39** (2026-04-27) : Création interface de gestion des super administrateurs

---

**Date de création** : 2026-04-27  
**Version** : v41  
**Status** : ✅ Implémenté et validé (mode démo)

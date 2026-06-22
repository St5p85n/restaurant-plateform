# Correction des Problèmes d'Inscription de Restaurant

## 🐛 Problèmes Signalés

L'utilisateur rencontrait deux problèmes:
1. **Message "Restaurant non configuré"** - L'utilisateur voyait ce message mais ne pouvait pas créer son restaurant
2. **Erreur 404 sur "inscrire mon restaurant"** - Le bouton redirigait vers une page inexistante

## 🔍 Analyse

### Problème 1: Pas de Workflow d'Inscription
L'application ne permettait pas aux utilisateurs de créer leur propre restaurant. Le message d'erreur suggérait de "contacter l'administrateur", ce qui n'était pas une solution pratique pour un système self-service.

### Problème 2: Page Manquante
Il n'existait pas de page `/register-restaurant` pour permettre aux utilisateurs d'inscrire leur restaurant.

## ✅ Solutions Implémentées

### 1. Création de la Page d'Inscription de Restaurant

**Fichier créé**: `src/pages/RegisterRestaurantPage.tsx`

**Fonctionnalités**:
- Formulaire complet d'inscription de restaurant avec validation
- Génération automatique du slug à partir du nom du restaurant
- Création automatique de 10 tables par défaut (2, 4 et 6 places)
- Association automatique du restaurant à l'utilisateur
- Attribution automatique du rôle "owner" à l'utilisateur
- Rafraîchissement du profil après création
- Redirection automatique vers le dashboard après succès
- Écran de succès avec animation de chargement

**Champs du formulaire**:
- **Informations de base**:
  - Nom du restaurant * (requis)
  - Type de cuisine (optionnel)
  - Description (optionnel)
- **Adresse**:
  - Adresse * (requis)
  - Ville * (requis)
  - Code postal * (requis)
- **Contact**:
  - Téléphone * (requis)
  - Email * (requis)

**Génération du slug**:
```typescript
const slug = formData.name
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
  .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
  .replace(/^-+|-+$/g, ''); // Supprimer les tirets au début et à la fin
```

**Exemple**: "Le Petit Bistrot" → "le-petit-bistrot"

### 2. Ajout de la Route

**Fichier modifié**: `src/routes.tsx`

**Route ajoutée**:
```typescript
{
  name: 'Register Restaurant',
  path: '/register-restaurant',
  element: <RegisterRestaurantPage />,
  public: false, // Nécessite authentification
}
```

### 3. Modification des Messages d'Erreur

**Fichiers modifiés**:
- `src/pages/RestaurantDashboardPage.tsx`
- `src/pages/POSPage.tsx`
- `src/pages/StockManagementPage.tsx`

**Avant**:
```tsx
<p className="text-muted-foreground">
  Veuillez contacter l'administrateur pour associer votre compte à un restaurant.
</p>
```

**Après**:
```tsx
<p className="text-muted-foreground mb-6">
  Vous devez inscrire votre restaurant pour accéder au dashboard.
</p>
<Button onClick={() => window.location.href = '/register-restaurant'}>
  Inscrire mon restaurant
</Button>
```

**Impact**: Les utilisateurs peuvent maintenant créer leur restaurant directement depuis le message d'erreur.

### 4. Migration Base de Données

**Migration 1**: `add_restaurant_location_fields`

**Objectif**: Ajouter les champs `city` et `postal_code` à la table `restaurants`

```sql
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT;

CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city);
```

**Raison**: Ces champs n'existaient pas dans le schéma initial mais sont nécessaires pour une adresse complète.

### 5. Fonction RPC Sécurisée

**Migration 2**: `allow_owner_role_on_restaurant_creation`

**Problème**: La politique RLS sur la table `profiles` empêchait les utilisateurs de modifier leur propre rôle, même pour devenir "owner" de leur restaurant.

**Solution**: Créer une fonction sécurisée `set_user_as_restaurant_owner` qui:
1. Vérifie que l'utilisateur qui appelle la fonction est bien celui qui sera owner
2. Vérifie que le restaurant existe et appartient à l'utilisateur
3. Met à jour le profil avec le `restaurant_id` et le rôle "owner"

```sql
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
  -- Vérifications de sécurité
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Vous ne pouvez pas modifier le profil d''un autre utilisateur';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM restaurants 
    WHERE id = p_restaurant_id 
    AND owner_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Restaurant non trouvé ou vous n''êtes pas le propriétaire';
  END IF;

  -- Mise à jour sécurisée
  UPDATE profiles
  SET 
    restaurant_id = p_restaurant_id,
    role = 'owner'
  WHERE id = p_user_id;
END;
$$;
```

**Utilisation dans le code**:
```typescript
const { error: profileError } = await supabase.rpc('set_user_as_restaurant_owner', {
  p_user_id: profile.id,
  p_restaurant_id: restaurantData.id,
});
```

**Avantages**:
- ✅ Contourne la politique RLS de manière sécurisée
- ✅ Vérifie que l'utilisateur est bien le propriétaire du restaurant
- ✅ Empêche les modifications non autorisées
- ✅ Utilise `SECURITY DEFINER` pour exécuter avec les privilèges du créateur de la fonction

### 6. Création Automatique de Tables

**Fonctionnalité**: Lors de la création d'un restaurant, 10 tables sont automatiquement créées:
- Tables 1-4: Capacité 2 personnes
- Tables 5-8: Capacité 4 personnes
- Tables 9-10: Capacité 6 personnes
- Toutes avec statut "available"

```typescript
const defaultTables = Array.from({ length: 10 }, (_, i) => ({
  restaurant_id: restaurantData.id,
  table_number: `${i + 1}`,
  capacity: i < 4 ? 2 : i < 8 ? 4 : 6,
  status: 'available',
}));

const { error: tablesError } = await supabase
  .from('tables')
  .insert(defaultTables);
```

**Note**: Si la création des tables échoue, l'inscription du restaurant continue quand même (erreur non bloquante).

## 🎯 Workflow Complet

### Parcours Utilisateur

1. **Connexion**: L'utilisateur se connecte à l'application
2. **Accès au Dashboard**: L'utilisateur essaie d'accéder à `/dashboard`
3. **Détection**: Le système détecte que l'utilisateur n'a pas de `restaurant_id`
4. **Message d'erreur**: Affichage du message "Restaurant non configuré" avec un bouton
5. **Clic sur le bouton**: L'utilisateur clique sur "Inscrire mon restaurant"
6. **Redirection**: Redirection vers `/register-restaurant`
7. **Formulaire**: L'utilisateur remplit le formulaire d'inscription
8. **Soumission**: Validation et création du restaurant
9. **Création automatique**:
   - Restaurant créé avec slug généré
   - 10 tables créées par défaut
   - Profil mis à jour avec `restaurant_id` et rôle "owner"
10. **Succès**: Écran de succès avec animation
11. **Redirection**: Redirection automatique vers `/dashboard` après 2 secondes
12. **Dashboard**: L'utilisateur accède maintenant au dashboard complet

### Flux de Données

```
Utilisateur
    ↓
Formulaire d'inscription
    ↓
Génération du slug
    ↓
Création du restaurant (INSERT)
    ↓
Appel RPC set_user_as_restaurant_owner
    ↓
Mise à jour du profil (restaurant_id + role)
    ↓
Création des tables par défaut
    ↓
Rafraîchissement du profil
    ↓
Redirection vers le dashboard
```

## 🔒 Sécurité

### Politiques RLS Utilisées

1. **Table `restaurants`**:
   - ✅ INSERT: Utilisateurs authentifiés peuvent créer un restaurant (avec `owner_id = auth.uid()`)
   - ✅ UPDATE: Propriétaires peuvent modifier leur restaurant
   - ✅ SELECT: Tout le monde peut voir les restaurants actifs

2. **Table `profiles`**:
   - ✅ SELECT: Utilisateurs peuvent voir leur propre profil
   - ✅ UPDATE: Utilisateurs peuvent modifier leur profil (sauf le rôle)
   - ✅ RPC: Fonction sécurisée pour devenir owner lors de la création d'un restaurant

3. **Table `tables`**:
   - ✅ ALL: Personnel du restaurant peut gérer les tables
   - ✅ SELECT: Clients peuvent voir les tables disponibles

### Validations

1. **Authentification**: L'utilisateur doit être connecté pour accéder à `/register-restaurant`
2. **Propriété**: La fonction RPC vérifie que l'utilisateur est bien le propriétaire du restaurant
3. **Unicité**: Le slug doit être unique (contrainte de base de données)
4. **Champs requis**: Nom, adresse, ville, code postal, téléphone, email

## 📊 Données Créées

### Restaurant
```json
{
  "name": "Le Petit Bistrot",
  "slug": "le-petit-bistrot",
  "address": "123 Rue de la Paix",
  "city": "Paris",
  "postal_code": "75001",
  "phone": "+33 1 23 45 67 89",
  "email": "contact@restaurant.fr",
  "description": "Un petit bistrot chaleureux...",
  "cuisine_type": "Française",
  "is_active": true,
  "owner_id": "uuid-de-l-utilisateur"
}
```

### Profil Mis à Jour
```json
{
  "id": "uuid-de-l-utilisateur",
  "restaurant_id": "uuid-du-restaurant",
  "role": "owner"
}
```

### Tables Créées (exemple)
```json
[
  { "table_number": "1", "capacity": 2, "status": "available" },
  { "table_number": "2", "capacity": 2, "status": "available" },
  { "table_number": "3", "capacity": 2, "status": "available" },
  { "table_number": "4", "capacity": 2, "status": "available" },
  { "table_number": "5", "capacity": 4, "status": "available" },
  { "table_number": "6", "capacity": 4, "status": "available" },
  { "table_number": "7", "capacity": 4, "status": "available" },
  { "table_number": "8", "capacity": 4, "status": "available" },
  { "table_number": "9", "capacity": 6, "status": "available" },
  { "table_number": "10", "capacity": 6, "status": "available" }
]
```

## 🎨 Interface Utilisateur

### Page d'Inscription

**Header**:
- Bouton "Retour" pour revenir à la page précédente
- Logo RestauManager au centre
- Design épuré et professionnel

**Formulaire**:
- Sections clairement séparées (Informations de base, Adresse, Contact)
- Labels clairs avec astérisques pour les champs requis
- Placeholders explicites pour guider l'utilisateur
- Validation HTML5 native
- Boutons d'action en bas (Annuler / Inscrire mon restaurant)

**État de Chargement**:
- Spinner sur le bouton pendant la soumission
- Texte "Inscription en cours..."
- Bouton désactivé pendant le traitement

**Écran de Succès**:
- Icône CheckCircle verte
- Message de confirmation
- Spinner de redirection
- Redirection automatique après 2 secondes

### Messages d'Erreur Améliorés

**Avant**:
- Icône AlertTriangle
- Message passif
- Pas d'action possible

**Après**:
- Icône AlertTriangle
- Message explicatif
- Bouton d'action "Inscrire mon restaurant"
- Espacement amélioré (mb-6)

## 🧪 Tests et Validation

### Tests Effectués

1. ✅ **Lint**: Aucune erreur TypeScript (84 fichiers vérifiés)
2. ✅ **Compilation**: Code compile sans erreur
3. ✅ **Imports**: Tous les imports sont corrects
4. ✅ **Types**: Types TypeScript cohérents
5. ✅ **Migrations**: Migrations appliquées avec succès
6. ✅ **Fonction RPC**: Fonction créée et permissions accordées

### Scénarios de Test

1. **Utilisateur non connecté**:
   - ❌ Ne peut pas accéder à `/register-restaurant` (RouteGuard)
   - ✅ Redirigé vers `/login`

2. **Utilisateur connecté sans restaurant**:
   - ✅ Voit le message "Restaurant non configuré"
   - ✅ Peut cliquer sur "Inscrire mon restaurant"
   - ✅ Accède au formulaire d'inscription
   - ✅ Peut créer son restaurant
   - ✅ Est redirigé vers le dashboard après succès

3. **Utilisateur connecté avec restaurant**:
   - ✅ Accède directement au dashboard
   - ✅ Ne voit pas le message d'erreur

## 📝 Notes Techniques

### Génération du Slug

La génération du slug utilise plusieurs étapes pour garantir un slug valide:

1. **Normalisation**: `normalize('NFD')` décompose les caractères accentués
2. **Suppression des accents**: Regex pour supprimer les diacritiques
3. **Remplacement**: Remplace tous les caractères non alphanumériques par des tirets
4. **Nettoyage**: Supprime les tirets en début et fin de chaîne

**Exemples**:
- "Le Café de Paris" → "le-cafe-de-paris"
- "L'Auberge du Château" → "l-auberge-du-chateau"
- "Chez François & Marie" → "chez-francois-marie"

### Gestion des Erreurs

**Erreurs gérées**:
1. Utilisateur non connecté → Toast d'erreur
2. Erreur de création du restaurant → Toast avec message d'erreur
3. Erreur de mise à jour du profil → Toast avec message d'erreur
4. Erreur de création des tables → Log console (non bloquant)

**Pattern utilisé**:
```typescript
try {
  setLoading(true);
  // Opérations
  toast.success('Succès!');
} catch (error: any) {
  toast.error(`Erreur: ${error.message}`);
} finally {
  setLoading(false);
}
```

### Rafraîchissement du Profil

Après la création du restaurant, le profil est rafraîchi pour mettre à jour le contexte d'authentification:

```typescript
await refreshProfile();
```

Cela garantit que:
- Le `restaurant_id` est disponible dans le contexte
- Le rôle "owner" est mis à jour
- Les composants qui dépendent du profil sont re-rendus

## 🚀 Améliorations Futures

### Fonctionnalités Possibles

1. **Validation du slug**: Vérifier l'unicité du slug avant soumission
2. **Upload de logo**: Permettre l'upload d'un logo lors de l'inscription
3. **Horaires d'ouverture**: Ajouter un sélecteur d'horaires dans le formulaire
4. **Géolocalisation**: Auto-complétion de l'adresse avec Google Maps API
5. **Prévisualisation**: Montrer un aperçu du restaurant avant création
6. **Étapes multiples**: Diviser le formulaire en plusieurs étapes (wizard)
7. **Validation côté serveur**: Ajouter des validations supplémentaires dans la fonction RPC
8. **Notification email**: Envoyer un email de confirmation après création
9. **Onboarding**: Guide interactif après la création du restaurant
10. **Templates**: Proposer des templates de configuration (type de cuisine, nombre de tables, etc.)

### Optimisations

1. **Cache**: Mettre en cache le profil pour éviter les requêtes répétées
2. **Debounce**: Ajouter un debounce sur la vérification du slug
3. **Lazy loading**: Charger le formulaire de manière asynchrone
4. **Compression**: Compresser les images uploadées
5. **Validation progressive**: Valider les champs au fur et à mesure

## 🔗 Fichiers Modifiés et Créés

### Fichiers Créés
1. `src/pages/RegisterRestaurantPage.tsx` - Page d'inscription de restaurant (280 lignes)
2. `supabase/migrations/add_restaurant_location_fields.sql` - Migration pour city et postal_code
3. `supabase/migrations/allow_owner_role_on_restaurant_creation.sql` - Fonction RPC sécurisée

### Fichiers Modifiés
1. `src/routes.tsx` - Ajout de la route `/register-restaurant`
2. `src/pages/RestaurantDashboardPage.tsx` - Message d'erreur avec bouton
3. `src/pages/POSPage.tsx` - Message d'erreur avec bouton + import AlertTriangle
4. `src/pages/StockManagementPage.tsx` - Message d'erreur avec bouton

## ✅ Résultat Final

### Avant
- ❌ Message d'erreur passif "Contactez l'administrateur"
- ❌ Pas de moyen de créer un restaurant
- ❌ Erreur 404 sur le lien "inscrire mon restaurant"
- ❌ Utilisateurs bloqués sans solution

### Après
- ✅ Message d'erreur actif avec bouton d'action
- ✅ Page d'inscription de restaurant complète et fonctionnelle
- ✅ Workflow self-service complet
- ✅ Création automatique de tables par défaut
- ✅ Attribution automatique du rôle owner
- ✅ Redirection automatique vers le dashboard
- ✅ Expérience utilisateur fluide et intuitive

## 📚 Documentation Associée

- `BUGFIX_DASHBOARD_STOCK.md` - Correction des problèmes d'affichage précédents
- `RESTAURANT_DASHBOARD_IMPLEMENTATION.md` - Documentation du Dashboard
- `POS_IMPLEMENTATION.md` - Documentation du POS
- `STOCK_MANAGEMENT_IMPLEMENTATION.md` - Documentation de la gestion des stocks
- `IMPLEMENTATION_STATUS.md` - État global du projet

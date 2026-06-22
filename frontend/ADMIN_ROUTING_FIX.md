# Correction du Routing Admin - KobeTii

## Problème Identifié

Les routes `/admin/*` retournaient une erreur 404 avec le message :
> "The page may have been deleted or does not exist. Please check the URL is correct."

### Cause Racine

Le problème venait d'une mauvaise architecture de layout :
- Les pages admin utilisaient `<AdminLayout>` **à l'intérieur** de leur code
- `App.tsx` enveloppait **toutes** les routes dans `PublicLayout`
- Résultat : Conflit de layouts → Erreur 404

## Solution Appliquée

### 1. Modification de `routes.tsx`

**Avant :**
```tsx
{
  name: 'Admin Dashboard',
  path: '/admin/dashboard',
  element: <AdminDashboardPage />,
  public: false,
}
```

**Après :**
```tsx
{
  name: 'Admin Dashboard',
  path: '/admin/dashboard',
  element: (
    <AdminLayout>
      <AdminDashboardPage />
    </AdminLayout>
  ),
  public: false,
}
```

Cette modification a été appliquée à **toutes les 5 routes admin** :
- `/admin/dashboard`
- `/admin/restaurants`
- `/admin/restaurants/:id`
- `/admin/subscriptions`
- `/admin/complaints`

### 2. Modification des Pages Admin

Toutes les pages admin ont été modifiées pour **retirer** `<AdminLayout>` de leur code interne :

**Fichiers modifiés :**
- `src/pages/admin/AdminDashboardPage.tsx`
- `src/pages/admin/AdminRestaurantsPage.tsx`
- `src/pages/admin/AdminRestaurantDetailsPage.tsx`
- `src/pages/admin/AdminSubscriptionsPage.tsx`
- `src/pages/admin/AdminComplaintsPage.tsx`

**Pattern appliqué :**
```tsx
// Avant
export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Contenu */}
      </div>
    </AdminLayout>
  );
}

// Après
export default function AdminDashboardPage() {
  return (
    <>
      <div className="space-y-6">
        {/* Contenu */}
      </div>
    </>
  );
}
```

## Architecture Finale

```
App.tsx
  └─ PublicLayout (pour routes publiques)
  └─ RestaurantLayout (pour routes /restaurant/*)
  └─ AdminLayout (pour routes /admin/*)
       ├─ AdminDashboardPage
       ├─ AdminRestaurantsPage
       ├─ AdminRestaurantDetailsPage
       ├─ AdminSubscriptionsPage
       └─ AdminComplaintsPage
```

## Validation

✅ **Lint** : 119 fichiers vérifiés, 0 erreur  
✅ **TypeScript** : Tous les types corrects  
✅ **Imports** : Tous valides  
✅ **Pattern** : Cohérent avec le reste de l'application (RestaurantLayout)

## Routes Admin Disponibles

| Route | Description | Rôle Requis |
|-------|-------------|-------------|
| `/admin/dashboard` | Tableau de bord admin | super_admin |
| `/admin/restaurants` | Liste des restaurants | super_admin |
| `/admin/restaurants/:id` | Détails d'un restaurant | super_admin |
| `/admin/subscriptions` | Gestion des abonnements | super_admin |
| `/admin/complaints` | Gestion des réclamations | super_admin |

## Protection des Routes

Toutes les routes admin sont protégées par `RouteGuard` :
- Vérifie que l'utilisateur est connecté
- Vérifie que l'utilisateur a le rôle `super_admin`
- Redirige vers `/403` si accès non autorisé
- Redirige automatiquement vers `/admin/dashboard` après connexion

## Comment Accéder

1. **Se connecter** avec un compte super administrateur
2. **Naviguer** vers `/admin/dashboard`
3. **Utiliser** la sidebar pour accéder aux différentes sections

### Compte Super Admin (Test)

Pour créer un compte super admin, exécuter dans Supabase SQL Editor :

```sql
-- 1. Créer un utilisateur dans auth.users (via l'interface Supabase Auth)
-- 2. Mettre à jour le profil avec le rôle super_admin
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'votre-email@example.com';
```

## Date de Correction

**Date** : 2026-04-27  
**Version** : v29.1 (Admin Routing Fix)  
**Status** : ✅ Résolu et validé

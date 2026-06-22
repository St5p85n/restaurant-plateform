# Module Admin Restaurant - KobeTii

## 📋 Vue d'ensemble

Le module Admin Restaurant est une interface complète de gestion de la plateforme KobeTii, accessible uniquement aux super administrateurs (propriétaires de la plateforme). Il permet de gérer tous les restaurants inscrits, leurs abonnements, et les réclamations.

**Date de création:** 2026-04-27  
**Version:** v28  
**Statut:** ✅ Opérationnel

---

## 🎯 Fonctionnalités principales

### 1. Dashboard Admin (`/admin/dashboard`)

**Description:** Vue d'ensemble de l'activité globale de la plateforme avec statistiques en temps réel.

**Fonctionnalités:**
- **KPIs principaux:**
  - Total des restaurants inscrits
  - Nombre de restaurants actifs
  - Nombre de clients utilisateurs
  - Total des commandes
  - Chiffre d'affaires global de la plateforme
  
- **Alertes:**
  - Réclamations urgentes (priorité élevée)
  - Abonnements expirant dans les 30 prochains jours
  
- **Statistiques détaillées:**
  - Restaurants actifs vs total
  - Restaurants suspendus nécessitant une action
  - Réclamations en attente de traitement

**Composants utilisés:**
- `AdminStatsCard` - Cartes de statistiques
- `Card`, `Badge` - shadcn/ui

### 2. Gestion des Restaurants (`/admin/restaurants`)

**Description:** Liste complète de tous les restaurants avec filtres avancés et actions de gestion.

**Fonctionnalités:**
- **Affichage:**
  - Liste en grille avec cartes restaurant
  - Informations: nom, adresse, contact, statistiques
  - Statut visuel (actif, suspendu, désactivé)
  - Abonnement actuel
  
- **Filtres:**
  - Recherche par nom, adresse, email
  - Filtrage par statut (actif, suspendu, inactif)
  - Filtrage par type de cuisine
  
- **Actions:**
  - Voir les détails d'un restaurant
  - Suspendre un restaurant actif
  - Réactiver un restaurant suspendu
  - Désactiver définitivement un restaurant

**Composants utilisés:**
- `RestaurantCard` - Carte restaurant avec actions
- `Input`, `Select` - Filtres
- `AlertDialog` - Confirmation des actions

### 3. Détails d'un Restaurant (`/admin/restaurants/:id`)

**Description:** Vue détaillée d'un restaurant spécifique avec historique complet.

**Fonctionnalités:**
- **Informations générales:**
  - Adresse complète
  - Coordonnées (téléphone, email)
  - Date d'inscription
  - Informations du propriétaire
  
- **Statistiques d'activité:**
  - Nombre total de commandes
  - Chiffre d'affaires généré
  - Note moyenne
  - Nombre d'utilisateurs actifs
  
- **Abonnement actuel:**
  - Formule souscrite (mensuel, annuel, par utilisateur)
  - Statut (actif, suspendu)
  - Montant et devise
  - Date d'expiration
  
- **Réclamations récentes:**
  - Liste des 10 dernières réclamations
  - Statut de chaque réclamation
  - Lien vers toutes les réclamations
  
- **Actions disponibles:**
  - Suspendre / Réactiver
  - Réduire / Restaurer la visibilité
  - Désactiver définitivement

**Composants utilisés:**
- `Card`, `Badge`, `Separator` - shadcn/ui
- `AlertDialog` - Confirmation des actions

### 4. Gestion des Abonnements (`/admin/subscriptions`)

**Description:** Liste de tous les abonnements avec filtres et actions de gestion.

**Fonctionnalités:**
- **Affichage:**
  - Liste des abonnements avec informations restaurant
  - Formule, montant, dates
  - Statut visuel
  
- **Filtres:**
  - Recherche par nom de restaurant
  - Filtrage par statut (actif, suspendu, annulé, expiré)
  - Filtrage par formule (mensuel, annuel, par utilisateur)
  
- **Actions (à venir):**
  - Modifier la formule d'abonnement
  - Prolonger un abonnement
  - Suspendre / Réactiver un abonnement

**Composants utilisés:**
- `Card`, `Badge` - shadcn/ui
- `Input`, `Select` - Filtres

### 5. Gestion des Réclamations (`/admin/complaints`)

**Description:** Traitement centralisé des réclamations provenant des restaurants et clients.

**Fonctionnalités:**
- **Affichage:**
  - Liste des réclamations avec détails
  - Source (client ou restaurant)
  - Statut et priorité
  - Restaurant concerné
  
- **Filtres:**
  - Recherche par sujet, description, restaurant
  - Filtrage par statut (en attente, en cours, résolu, fermé)
  - Filtrage par source (client, restaurant)
  
- **Actions:**
  - Répondre à une réclamation
  - Marquer comme résolue
  - Ajouter des notes administratives
  
- **Badges de priorité:**
  - Urgent (priorité ≥ 4)
  - Élevée (priorité ≥ 3)
  - Moyenne (priorité ≥ 2)
  - Faible (priorité < 2)

**Composants utilisés:**
- `Card`, `Badge` - shadcn/ui
- `Dialog`, `Textarea` - Réponse aux réclamations

---

## 🏗️ Architecture

### Structure des fichiers

```
src/
├── components/
│   ├── layouts/
│   │   └── AdminLayout.tsx          # Layout principal admin
│   └── admin/
│       ├── AdminStatsCard.tsx       # Carte de statistiques
│       └── RestaurantCard.tsx       # Carte restaurant
├── pages/
│   └── admin/
│       ├── AdminDashboardPage.tsx           # Dashboard
│       ├── AdminRestaurantsPage.tsx         # Liste restaurants
│       ├── AdminRestaurantDetailsPage.tsx   # Détails restaurant
│       ├── AdminSubscriptionsPage.tsx       # Abonnements
│       └── AdminComplaintsPage.tsx          # Réclamations
└── types/
    └── index.ts                     # Types TypeScript admin
```

### Types TypeScript

```typescript
// Statistiques globales de la plateforme
export interface AdminStats {
  total_restaurants: number;
  active_restaurants: number;
  suspended_restaurants: number;
  total_customers: number;
  total_orders: number;
  total_revenue: number;
  pending_complaints: number;
  expiring_subscriptions: number;
}

// Restaurant avec statistiques
export interface RestaurantWithStats extends Restaurant {
  subscription?: Subscription;
  owner?: Profile;
  stats?: {
    total_orders: number;
    total_revenue: number;
    average_rating: number;
    total_complaints: number;
    active_users: number;
  };
}

// Abonnement avec informations restaurant
export interface SubscriptionWithRestaurant extends Subscription {
  restaurant?: Restaurant;
  payment_history?: PaymentRecord[];
}

// Réclamation avec détails complets
export interface ComplaintWithDetails extends Complaint {
  restaurant?: Restaurant;
  submitted_by_profile?: Profile;
  responses?: ComplaintResponse[];
}
```

---

## 🔐 Sécurité et Permissions

### Protection des routes

**RouteGuard** (`src/components/common/RouteGuard.tsx`):
```typescript
// Redirection après connexion selon le rôle
if (profile.role === 'super_admin') {
  navigate('/admin/dashboard');
}

// Protection des routes admin
if (location.pathname.startsWith('/admin') && profile.role !== 'super_admin') {
  navigate('/403'); // Accès refusé
}
```

### RLS Policies (Row Level Security)

Les policies Supabase existantes permettent déjà aux super_admin d'accéder à toutes les données:

```sql
-- Fonction helper
CREATE OR REPLACE FUNCTION is_super_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT has_role(uid, 'super_admin');
$$;

-- Exemple de policy
CREATE POLICY "Super admin peut tout voir"
ON restaurants
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));
```

**Tables accessibles:**
- `profiles` - Tous les profils utilisateurs
- `restaurants` - Tous les restaurants
- `subscriptions` - Tous les abonnements
- `complaints` - Toutes les réclamations
- `orders` - Toutes les commandes
- Et toutes les autres tables de la plateforme

---

## 🎨 Design System

### Style Minimal

Le module admin suit le template **Minimal** avec:
- **Espaces blancs généreux** pour la lisibilité
- **Hiérarchie claire** de l'information
- **Typographie sobre** sans effets excessifs
- **Contraste doux** pour le confort visuel
- **Pas d'ombres** ou de couleurs décoratives

### Composants shadcn/ui utilisés

- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`
- `Badge` - Statuts visuels
- `Button` - Actions
- `Input`, `Select` - Filtres
- `Dialog`, `AlertDialog` - Modales
- `Skeleton` - États de chargement
- `Separator` - Séparateurs visuels
- `Sheet` - Menu mobile

### Palette de couleurs

Utilise les tokens sémantiques de `index.css`:
- `bg-background` - Fond principal
- `bg-muted` - Fond secondaire
- `text-foreground` - Texte principal
- `text-muted-foreground` - Texte secondaire
- `border-border` - Bordures
- `bg-primary` - Éléments primaires
- `bg-destructive` - Actions destructives

---

## 📊 Flux de données

### Chargement des statistiques (Dashboard)

```typescript
// 1. Requêtes parallèles pour les compteurs
const [
  { count: totalRestaurants },
  { count: activeRestaurants },
  { count: totalCustomers },
  { count: totalOrders },
  { data: revenueData }
] = await Promise.all([
  supabase.from('restaurants').select('*', { count: 'exact', head: true }),
  supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('is_active', true),
  supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
  supabase.from('orders').select('*', { count: 'exact', head: true }),
  supabase.from('orders').select('total_amount').eq('status', 'paid')
]);

// 2. Calcul du chiffre d'affaires total
const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_amount, 0);

// 3. Mise à jour de l'état
setStats({ totalRestaurants, activeRestaurants, totalCustomers, totalOrders, totalRevenue });
```

### Chargement des restaurants avec statistiques

```typescript
// 1. Charger les restaurants avec relations
const { data } = await supabase
  .from('restaurants')
  .select(`
    *,
    subscription:subscriptions!subscriptions_restaurant_id_fkey(*),
    owner:profiles!restaurants_owner_id_fkey(*)
  `);

// 2. Enrichir avec les statistiques
const restaurantsWithStats = await Promise.all(
  data.map(async (restaurant) => {
    const [
      { count: totalOrders },
      { data: revenueData },
      { count: totalComplaints }
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurant.id),
      supabase.from('orders').select('total_amount').eq('restaurant_id', restaurant.id).eq('status', 'paid'),
      supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurant.id)
    ]);

    return {
      ...restaurant,
      stats: {
        total_orders: totalOrders,
        total_revenue: revenueData?.reduce((sum, o) => sum + o.total_amount, 0),
        total_complaints: totalComplaints,
        average_rating: restaurant.rating
      }
    };
  })
);
```

### Actions sur les restaurants

```typescript
// Suspendre un restaurant
const { error } = await supabase
  .from('subscriptions')
  .update({ status: 'suspended' })
  .eq('restaurant_id', restaurantId);

// Réactiver un restaurant
const { error } = await supabase
  .from('subscriptions')
  .update({ status: 'active' })
  .eq('restaurant_id', restaurantId);

// Désactiver définitivement
const { error } = await supabase
  .from('restaurants')
  .update({ is_active: false })
  .eq('id', restaurantId);

// Modifier la visibilité
const { error } = await supabase
  .from('restaurants')
  .update({ visibility_score: 50 }) // ou 100 pour restaurer
  .eq('id', restaurantId);
```

---

## 🚀 Utilisation

### Accès au module admin

1. **Connexion:**
   - Se connecter avec un compte `super_admin`
   - Redirection automatique vers `/admin/dashboard`

2. **Navigation:**
   - Sidebar persistante avec 4 sections:
     - Dashboard
     - Restaurants
     - Abonnements
     - Réclamations
   - Menu hamburger sur mobile

3. **Actions courantes:**

**Suspendre un restaurant:**
```
1. Aller sur /admin/restaurants
2. Trouver le restaurant (filtres/recherche)
3. Cliquer sur l'icône "Pause"
4. Confirmer l'action
→ Le restaurant ne peut plus accepter de commandes
```

**Répondre à une réclamation:**
```
1. Aller sur /admin/complaints
2. Filtrer par statut "En attente"
3. Cliquer sur "Répondre"
4. Saisir la réponse
5. Envoyer
→ Statut passe à "En cours"
```

**Voir les détails d'un restaurant:**
```
1. Aller sur /admin/restaurants
2. Cliquer sur "Détails" sur une carte
3. Consulter les informations complètes
4. Effectuer des actions si nécessaire
```

---

## 🔄 Améliorations futures

### Fonctionnalités à implémenter

1. **Gestion avancée des abonnements:**
   - Modifier la formule d'un abonnement
   - Prolonger manuellement un abonnement
   - Gérer les impayés avec relances automatiques
   - Historique complet des paiements

2. **Historique des actions admin:**
   - Table `admin_actions` pour tracer toutes les actions
   - Qui a fait quoi et quand
   - Justification des actions disciplinaires

3. **Notifications:**
   - Envoyer des notifications aux restaurants
   - Alertes automatiques pour les super admins
   - Emails de rappel pour les abonnements

4. **Statistiques avancées:**
   - Graphiques d'évolution temporelle
   - Comparaisons entre restaurants
   - Rapports exportables (PDF, Excel)

5. **Gestion des propriétaires:**
   - Assigner/modifier les propriétaires de restaurants
   - Gérer les permissions des propriétaires
   - Historique des changements de propriété

6. **Système de messagerie:**
   - Chat interne entre super admin et restaurants
   - Système de tickets de support
   - Base de connaissances

7. **Audit et logs:**
   - Logs détaillés de toutes les actions
   - Tableau de bord analytique avancé
   - Alertes de sécurité

---

## 🐛 Dépannage

### Problèmes courants

**1. Accès refusé (403)**
- **Cause:** L'utilisateur n'a pas le rôle `super_admin`
- **Solution:** Vérifier le rôle dans la table `profiles`

**2. Statistiques incorrectes**
- **Cause:** Données manquantes ou requêtes échouées
- **Solution:** Vérifier les logs console, recharger la page

**3. Actions ne fonctionnent pas**
- **Cause:** Permissions RLS insuffisantes
- **Solution:** Vérifier les policies Supabase pour `super_admin`

**4. Page blanche**
- **Cause:** Erreur JavaScript non gérée
- **Solution:** Ouvrir la console développeur, vérifier les erreurs

### Vérifications de sécurité

```sql
-- Vérifier le rôle d'un utilisateur
SELECT id, email, role FROM profiles WHERE email = 'admin@example.com';

-- Vérifier les policies pour une table
SELECT * FROM pg_policies WHERE tablename = 'restaurants';

-- Tester l'accès super_admin
SELECT is_super_admin(auth.uid());
```

---

## 📝 Notes techniques

### Performance

- **Requêtes optimisées:** Utilisation de `Promise.all` pour les requêtes parallèles
- **Pagination:** À implémenter pour les grandes listes
- **Cache:** Pas de cache actuellement, à considérer pour les statistiques

### Responsive Design

- **Desktop-first:** Optimisé pour les écrans larges
- **Mobile:** Menu hamburger, cartes empilées
- **Breakpoints:** `md` (768px) pour le passage desktop/mobile

### Accessibilité

- **Keyboard navigation:** Tous les boutons sont accessibles au clavier
- **ARIA labels:** À améliorer pour les lecteurs d'écran
- **Contraste:** Respecte les normes WCAG AA

---

## 📚 Références

### Documentation externe

- [shadcn/ui](https://ui.shadcn.com/) - Composants UI
- [Supabase](https://supabase.com/docs) - Backend et authentification
- [React Router](https://reactrouter.com/) - Routing
- [Tailwind CSS](https://tailwindcss.com/) - Styling

### Fichiers clés

- `src/components/layouts/AdminLayout.tsx` - Layout principal
- `src/components/common/RouteGuard.tsx` - Protection des routes
- `src/types/index.ts` - Types TypeScript
- `supabase/migrations/00002_create_rls_policies.sql` - Policies RLS

---

**Auteur:** KobeTii Development Team  
**Date de dernière mise à jour:** 2026-04-27  
**Version du document:** 1.0

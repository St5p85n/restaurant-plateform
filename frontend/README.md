# Welcome to Your Miaoda Project
Miaoda Application Link URL
    URL:https://medo.dev/projects/app-b8yn6jn6mdj5

# RestauManager

Application web complète de gestion de restaurants multi-tenant avec système de réservation en ligne, POS, fidélité client et gestion des abonnements.

## 🎯 Fonctionnalités principales

### Interface Publique (Clients)
- **Page d'accueil** : Liste des restaurants avec recherche et filtres ✅
- **Liste restaurants** : Filtres par cuisine, localisation, tri par note ✅
- **Réservation en ligne** : Système de réservation avec calendrier ✅
- **Détails restaurant** : Consultation du menu et informations ✅
- **Espace fidélité** : Points de fidélité, réductions, offres personnalisées, historique ✅
- **Réclamations** : Soumission d'avis et réclamations ✅

### Interface Restaurant (Personnel)
- **Dashboard** : KPIs en temps réel (CA, couverts, taux d'occupation)
- **Réservations & Plan de salle** : Vue temps réel avec Supabase Realtime
- **Gestion de la carte** : CRUD catégories et plats
- **POS (Point de vente)** : Prise de commande avec statut temps réel
- **Stocks** : Gestion des stocks avec alertes
- **Planning** : Gestion du personnel
- **Caisse & Rapports** : Suivi financier et exports
- **Clients & Fidélité** : Gestion des clients et programmes de fidélité
- **Réclamations** : Consultation et réponses aux réclamations

### Interface Super Admin
- **Dashboard global** : Vue d'ensemble de la plateforme
- **Gestion restaurants** : Suspendre, réduire visibilité, activer/désactiver
- **Abonnements** : Formules (mensuel, annuel, par utilisateur)
- **Réclamations** : Traitement centralisé des réclamations

## 🏗️ Architecture Technique

### Stack Technologique
- **Frontend** : React + TypeScript + Vite
- **UI** : shadcn/ui + Tailwind CSS
- **Backend** : Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)
- **Paiements** : Stripe (abonnements restaurants)
- **Temps réel** : Supabase Realtime pour vue salle et commandes

### Base de Données (Multi-tenant)
- **profiles** : Utilisateurs avec rôles (super_admin, owner, manager, chef, server, accountant, customer)
- **restaurants** : Établissements avec visibilité et notation
- **subscriptions** : Abonnements avec plans (monthly, annual, per_user)
- **tables** : Tables avec statuts temps réel
- **reservations** : Réservations en ligne
- **menu_categories** & **menu_items** : Gestion de la carte
- **orders** & **order_items** : Commandes avec statuts
- **stock_items** & **stock_movements** : Gestion des stocks
- **staff_schedules** : Planning du personnel
- **customers** & **loyalty_transactions** : Fidélité client
- **offers** : Offres personnalisées
- **complaints** : Réclamations (restaurants + clients)
- **cash_register** : Gestion de la caisse

### Sécurité (RLS)
- Politiques Row Level Security par rôle
- Fonctions helper pour vérification des rôles
- Isolation multi-tenant stricte
- Vues publiques pour données partagées

### Edge Functions
- **create_stripe_checkout** : Création de sessions de paiement Stripe
- **verify_stripe_payment** : Vérification des paiements

## 🚀 Installation et Configuration

### 1. Cloner et installer
```bash
npm install
```

### 2. Configurer Supabase
Le projet est déjà configuré avec Supabase. Les variables d'environnement sont dans `.env`.

### 3. Configurer Stripe (IMPORTANT)
Pour activer les paiements d'abonnements, vous devez configurer votre clé Stripe :

1. Créez un compte sur [Stripe Dashboard](https://dashboard.stripe.com/)
2. Récupérez votre `Secret Key` dans la section API Keys
3. Ajoutez la clé dans les secrets Supabase :
   - Via le dashboard Supabase : Settings > Edge Functions > Add Secret
   - Nom : `STRIPE_SECRET_KEY`
   - Valeur : Votre clé secrète Stripe

### 4. Lancer l'application
```bash
npm run dev
```

## 👥 Rôles et Permissions

### Super Admin
- Gestion complète de la plateforme
- Gestion des restaurants (suspendre, visibilité)
- Gestion des abonnements
- Traitement des réclamations

### Owner (Propriétaire)
- Gestion complète de son restaurant
- Gestion du personnel
- Accès aux rapports financiers
- Gestion des abonnements

### Manager (Gérant)
- Gestion des réservations
- Gestion de la carte
- Gestion du personnel
- Accès aux rapports

### Chef (Cuisine)
- Consultation des commandes
- Gestion des stocks
- Mise à jour des statuts de préparation

### Server (Serveur)
- Prise de commande (POS)
- Gestion des tables
- Encaissement

### Accountant (Comptable)
- Accès aux rapports financiers
- Gestion de la caisse
- Exports comptables

### Customer (Client)
- Réservation en ligne
- Consultation du menu
- Espace fidélité
- Soumission de réclamations

## 🎨 Design System

### Palette de Couleurs
- **Primary** : Orange vif (HSL 24 95% 53%) - Énergie culinaire
- **Secondary** : Gris chaud (HSL 20 14% 92%) - Support
- **Accent** : Orange très clair (HSL 24 100% 97%) - Highlights
- **Success** : Vert (HSL 142 76% 36%)
- **Warning** : Jaune (HSL 38 92% 50%)
- **Destructive** : Rouge (HSL 0 84% 60%)

### Philosophie
- **Bold & Moderne** : Typographie forte, couleurs vives
- **Minimal** : Whitespace généreux, hiérarchie claire
- **Contraste doux** : Lisibilité optimale

## 🔄 Fonctionnalités Temps Réel

### Vue Salle (Point Fort Différenciant)
- Statut des tables en temps réel (disponible, occupée, réservée)
- Commandes en cours par table
- Statut de préparation des plats
- Mise à jour instantanée via Supabase Realtime

### Activation Realtime
Les tables suivantes sont configurées pour le temps réel :
- `tables`
- `orders`
- `order_items`
- `reservations`

## 💳 Système de Paiement

### Modes de Paiement
- **Carte bancaire** : Via Stripe
- **Wave** : Mobile money (Afrique)
- **Orange Money** : Mobile money (Afrique)
- **Espèces** : Paiement en caisse

### Abonnements Restaurants
- **Mensuel** : 49€/mois
- **Annuel** : 499€/an (économie de 2 mois)
- **Par utilisateur** : 15€/utilisateur/mois

## 📊 Système de Fidélité

### Points de Fidélité
- Attribution automatique : 1 point par euro dépensé
- Attribution manuelle par le personnel
- Échange contre des réductions

### Offres Personnalisées
- Création d'offres ciblées
- Réductions basées sur les points
- Validité temporelle

## 📝 Réclamations

### Sources
- **Clients** : Avis et réclamations sur les restaurants
- **Restaurants** : Réclamations sur la plateforme

### Traitement
- Catégorisation et priorisation
- Suivi par le super admin
- Actions : suspens, réduction de visibilité, avertissement
- Consultation par les restaurants pour amélioration

## 🔐 Authentification

### Méthode
- Nom d'utilisateur + mot de passe
- Pas de vérification email (désactivée)
- Auto-login après inscription

### Premier Utilisateur
Le premier utilisateur inscrit devient automatiquement **super_admin**.

## ⚠️ Notes Importantes

### Conditions d'Utilisation
Le système inclut des conditions d'utilisation et une politique de confidentialité génériques.
**IMPORTANT** : Vous devez les modifier pour atténuer les risques juridiques.

### Configuration Stripe
Les fonctionnalités de paiement nécessitent la configuration de `STRIPE_SECRET_KEY`.
Sans cette configuration, les abonnements ne fonctionneront pas.

### Images
Les images sont actuellement des placeholders. Utilisez le bucket Supabase `restaurant-images` pour uploader vos propres images.

## 🛠️ Développement

### Structure du Projet
```
src/
├── components/
│   ├── layouts/          # Layouts (Public, Restaurant, Admin)
│   ├── ui/               # Composants shadcn/ui
│   └── common/           # Composants réutilisables
├── contexts/             # Contextes React (Auth)
├── db/                   # Configuration Supabase
├── hooks/                # Hooks personnalisés
├── pages/                # Pages de l'application
├── types/                # Types TypeScript
└── lib/                  # Utilitaires

supabase/
├── functions/            # Edge Functions
│   ├── create_stripe_checkout/
│   └── verify_stripe_payment/
└── migrations/           # Migrations SQL
```

### Commandes
```bash
npm run dev          # Lancer en développement
npm run build        # Build production
npm run lint         # Vérifier le code
npm run preview      # Prévisualiser le build
```

## 📈 Évolutions Futures

### Non inclus dans la V1
- Application mobile native
- Intégration livraison tiers
- Gestion multi-sites
- Programme de parrainage
- Réservation de groupes/événements
- Gestion avancée des allergènes
- Intégration comptable externe
- Notation du personnel
- Gestion des pourboires
- Marketing automation avancé

## 📄 Licence

Tous droits réservés © 2026 RestauManager

## 🤝 Support

Pour toute question ou assistance, contactez l'équipe de développement.

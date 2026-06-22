# Guide d'Inscription et Connexion Super Admin - KobeTii

## Vue d'Ensemble

Ce guide explique comment créer un compte super administrateur et se connecter à l'espace d'administration de la plateforme KobeTii.

## 🔐 Code Secret

Le code secret est affiché directement sur la page d'inscription :

```
KOBETII_ADMIN_2024
```

**Où le trouver ?**
- Sur la page `/register-super-admin`, le code est affiché dans un encadré bleu sous le champ "Code secret"
- Il est également affiché en bas de la page dans la section d'avertissement

⚠️ **Important** : Ce code doit être gardé confidentiel et ne doit être partagé qu'avec les personnes autorisées à créer des comptes super administrateurs.

## 📝 Créer un Compte Super Admin

### Méthode 1 : Via l'Interface Web (Recommandé)

1. **Accéder à la page d'inscription**
   - Aller sur `/register-super-admin`
   - Ou depuis la page de login, cliquer sur "🔐 Espace Super Administrateur"

2. **Remplir le formulaire**
   - **Nom complet** : Votre nom complet (ex: Jean Dupont)
   - **Email** : Votre adresse email professionnelle (ex: admin@kobetii.com)
   - **Nom d'utilisateur** : Un identifiant unique (ex: admin_kobetii)
   - **Mot de passe** : Minimum 8 caractères
   - **Confirmer le mot de passe** : Répéter le mot de passe
   - **Code secret** : Entrer `KOBETII_ADMIN_2024`

3. **Valider l'inscription**
   - Cliquer sur "Créer le compte"
   - Attendre la confirmation
   - Vous serez redirigé vers la page de connexion

### Méthode 2 : Via SQL (Alternative)

Si vous avez accès à Supabase SQL Editor :

```sql
-- 1. Créer un utilisateur via l'interface Supabase Auth
-- (Dashboard > Authentication > Users > Add User)
-- Email: admin@kobetii.com
-- Password: (votre mot de passe sécurisé)

-- 2. Mettre à jour le profil avec le rôle super_admin
UPDATE profiles 
SET 
  role = 'super_admin',
  full_name = 'Nom Complet',
  username = 'admin_kobetii'
WHERE email = 'admin@kobetii.com';
```

## 🔑 Se Connecter à l'Espace Admin

### Étape 1 : Accéder à la Page de Connexion

- Aller sur `/login`
- Ou cliquer sur "Se connecter" depuis la page d'accueil

### Étape 2 : Entrer les Identifiants

Vous pouvez vous connecter avec :
- **Nom d'utilisateur** : `admin_kobetii`
- **Email** : `admin@kobetii.com`
- **Mot de passe** : Votre mot de passe

### Étape 3 : Redirection Automatique

Une fois connecté, vous serez automatiquement redirigé vers :
```
/admin/dashboard
```

## 🎯 Accès Direct à l'Espace Admin

Si vous êtes déjà connecté en tant que super admin, vous pouvez accéder directement à :

- **Dashboard** : `/admin/dashboard`
- **Restaurants** : `/admin/restaurants`
- **Abonnements** : `/admin/subscriptions`
- **Réclamations** : `/admin/complaints`

## 🛡️ Sécurité

### Protection des Routes

Le système `RouteGuard` protège automatiquement les routes admin :

1. **Vérification du rôle** : Seuls les utilisateurs avec `role = 'super_admin'` peuvent accéder
2. **Redirection automatique** : Les utilisateurs non autorisés sont redirigés vers `/403`
3. **Session persistante** : Votre session reste active jusqu'à déconnexion

### Bonnes Pratiques

✅ **À FAIRE** :
- Utiliser un mot de passe fort (minimum 8 caractères, avec majuscules, minuscules, chiffres)
- Garder le code secret confidentiel
- Se déconnecter après chaque session
- Utiliser une adresse email professionnelle

❌ **À ÉVITER** :
- Partager vos identifiants
- Utiliser le même mot de passe que d'autres services
- Laisser votre session ouverte sur un ordinateur partagé
- Partager le code secret publiquement

## 🔄 Gestion des Comptes Super Admin

### Créer un Nouveau Super Admin (depuis l'interface)

1. Se connecter en tant que super admin
2. Aller sur `/register-super-admin`
3. Remplir le formulaire avec le code secret
4. Le nouveau compte sera créé avec les privilèges complets

### Révoquer un Super Admin

Pour révoquer les privilèges d'un super admin, exécuter dans Supabase SQL Editor :

```sql
UPDATE profiles 
SET role = 'owner'  -- ou un autre rôle approprié
WHERE email = 'email@example.com';
```

### Lister tous les Super Admins

```sql
SELECT 
  id,
  email,
  full_name,
  username,
  created_at
FROM profiles
WHERE role = 'super_admin'
ORDER BY created_at DESC;
```

## 🚨 Dépannage

### Problème : "Code secret invalide"

**Solution** : Vérifiez que vous avez entré exactement `KOBETII_ADMIN_2024` (sensible à la casse)

### Problème : "Erreur lors de la création du compte"

**Solutions possibles** :
1. Vérifier que l'email n'est pas déjà utilisé
2. Vérifier que le nom d'utilisateur est unique
3. Vérifier la connexion à Supabase
4. Consulter les logs dans la console du navigateur

### Problème : Redirection vers /403 après connexion

**Solutions** :
1. Vérifier que le profil a bien le rôle `super_admin` :
   ```sql
   SELECT role FROM profiles WHERE email = 'votre@email.com';
   ```
2. Si le rôle n'est pas correct, le mettre à jour :
   ```sql
   UPDATE profiles SET role = 'super_admin' WHERE email = 'votre@email.com';
   ```
3. Se déconnecter et se reconnecter

### Problème : Page blanche ou erreur 404

**Solutions** :
1. Vérifier que vous êtes sur la bonne URL : `/admin/dashboard`
2. Vider le cache du navigateur (Ctrl+Shift+R)
3. Vérifier la console du navigateur pour les erreurs

## 📊 Fonctionnalités de l'Espace Admin

Une fois connecté, vous aurez accès à :

### 1. Dashboard (`/admin/dashboard`)
- Vue d'ensemble de la plateforme
- Statistiques globales (restaurants, clients, commandes, revenus)
- Réclamations récentes
- Abonnements actifs

### 2. Gestion des Restaurants (`/admin/restaurants`)
- Liste de tous les restaurants
- Filtrage par statut (actif, suspendu, inactif)
- Actions : Voir détails, Suspendre, Activer, Désactiver

### 3. Détails Restaurant (`/admin/restaurants/:id`)
- Informations complètes du restaurant
- Historique des abonnements
- Statistiques de performance
- Actions de gestion

### 4. Gestion des Abonnements (`/admin/subscriptions`)
- Liste de tous les abonnements
- Filtrage par statut et plan
- Renouvellement et annulation

### 5. Gestion des Réclamations (`/admin/complaints`)
- Liste de toutes les réclamations
- Filtrage par statut et priorité
- Réponse aux réclamations
- Résolution des problèmes

## 🔄 Changement du Code Secret

Pour changer le code secret, modifier le fichier :

```typescript
// src/pages/RegisterSuperAdminPage.tsx
const SUPER_ADMIN_SECRET = 'VOTRE_NOUVEAU_CODE';
```

⚠️ **Important** : Après modification, redéployer l'application.

## 📞 Support

En cas de problème :
1. Consulter cette documentation
2. Vérifier les logs dans la console du navigateur
3. Contacter le support technique KobeTii

## 📅 Historique des Versions

- **v33** (2026-04-27) : Création de la page d'inscription super admin et ajout du lien sur la page de login
- **v32** (2026-04-27) : Correction erreur TypeError sur subscription.amount
- **v31** (2026-04-27) : Correction architecture routing
- **v30** (2026-04-27) : Correction complète du routing admin

---

**Date de création** : 2026-04-27  
**Dernière mise à jour** : 2026-04-27  
**Version** : 1.0

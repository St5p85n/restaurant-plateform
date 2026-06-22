# Guide Complet - Espace Client RestauManager

## 🎯 Comment Créer un Compte Client et Accéder à Votre Espace

### Étape 1: Créer un Compte Client

**Méthode 1: Depuis la Page d'Accueil**
1. Ouvrez l'application → Vous arrivez sur la page d'accueil (`/`)
2. Sous les boutons "Commander maintenant" et "Réserver une table", vous verrez:
   ```
   Nouveau client? Créer un compte pour suivre vos commandes
   ```
3. Cliquez sur "Créer un compte pour suivre vos commandes"
4. Vous arrivez sur la page d'inscription client

**Méthode 2: URL Directe**
- Tapez directement: `/register-client` dans votre navigateur

### Étape 2: Remplir le Formulaire d'Inscription

Sur la page d'inscription, remplissez les champs suivants:

1. **Nom complet** * (requis)
   - Exemple: Jean Dupont

2. **Email** * (requis)
   - Exemple: jean.dupont@example.com
   - Sera utilisé pour la connexion

3. **Téléphone** * (requis)
   - Exemple: +221 77 123 45 67
   - Pour les notifications de livraison

4. **Mot de passe** * (requis)
   - Minimum 6 caractères
   - Exemple: ••••••••

5. **Confirmer le mot de passe** * (requis)
   - Doit correspondre au mot de passe

6. Cliquez sur **"Créer mon compte"**

### Étape 3: Connexion Automatique

Après l'inscription:
- ✅ Votre compte est créé avec le rôle "customer" (client)
- ✅ Vous êtes automatiquement connecté
- ✅ Vous êtes redirigé vers votre espace client (`/client/dashboard`)

---

## 📱 Votre Espace Client

### Vue d'Ensemble

Votre espace client contient:

1. **Tableau de bord** (`/client/dashboard`)
   - Statistiques de vos commandes
   - Historique complet
   - Commandes en cours
   - Accès rapide pour commander

2. **Profil** (`/client/profile`)
   - Informations personnelles
   - Adresses de livraison sauvegardées
   - Modification du profil

---

## 📊 Tableau de Bord Client

### Statistiques Affichées

**4 Cartes de Statistiques:**

1. **Total Commandes**
   - Nombre total de commandes passées

2. **En cours**
   - Commandes actuellement en préparation ou en livraison

3. **Livrées**
   - Commandes terminées avec succès

4. **Total Dépensé**
   - Montant total de toutes vos commandes livrées

### Bouton d'Action Rapide

**"Commander maintenant"**
- Accès direct à la liste des restaurants
- Lien vers `/order/restaurants`

### Historique des Commandes

**3 Onglets de Filtrage:**

1. **Toutes** - Toutes vos commandes
2. **En cours** - Commandes en préparation/livraison
3. **Livrées** - Commandes terminées

**Informations Affichées pour Chaque Commande:**
- Nom du restaurant
- Badge de statut (En attente, Confirmée, En préparation, etc.)
- Date et heure de commande
- Nombre d'articles
- Téléphone du restaurant
- Liste des articles commandés
- Total de la commande
- Bouton "Voir le suivi" → Redirection vers `/order/:id`

**Statuts Possibles:**
- 🟡 **En attente** - Commande reçue
- 🔵 **Confirmée** - Restaurant a confirmé
- 🟠 **En préparation** - Cuisine en cours
- 🟣 **Prête** - Commande prête pour livraison
- 🔷 **En livraison** - Livreur en route
- 🟢 **Livrée** - Commande livrée
- 🔴 **Annulée** - Commande annulée

---

## 👤 Page Profil Client

### Onglet "Informations personnelles"

**Champs Modifiables:**
- ✅ Nom complet
- ✅ Téléphone

**Champs Non Modifiables:**
- ❌ Email (utilisé pour la connexion)

**Bouton:** "Enregistrer les modifications"

### Onglet "Adresses de livraison"

**Fonctionnalités:**
- ✅ Affichage de toutes vos adresses sauvegardées
- ✅ Badge "Par défaut" pour l'adresse principale
- ✅ Suppression d'adresse (icône poubelle)

**Informations Affichées:**
- Nom complet
- Téléphone
- Adresse complète (ligne 1, ligne 2, ville, code postal)

**Note:** Les adresses sont enregistrées automatiquement lors de vos commandes

---

## 🔄 Différence entre Espace Client et Espace Restaurant

### Espace Client (`/client/*`)

**Accessible par:** Utilisateurs avec rôle `customer`

**Pages:**
- `/client/dashboard` - Tableau de bord client
- `/client/profile` - Profil client

**Fonctionnalités:**
- ✅ Voir l'historique de ses propres commandes
- ✅ Suivre les commandes en cours
- ✅ Gérer son profil et ses adresses
- ✅ Commander en ligne
- ❌ Pas d'accès aux fonctionnalités restaurant

### Espace Restaurant (`/dashboard`, `/pos`, `/stocks`, etc.)

**Accessible par:** Utilisateurs avec rôles `owner`, `manager`, `chef`, `server`, etc.

**Pages:**
- `/dashboard` - Tableau de bord restaurant
- `/pos` - Point de vente
- `/stocks` - Gestion des stocks
- `/finances` - Finances
- Etc.

**Fonctionnalités:**
- ✅ Gérer le restaurant
- ✅ Voir toutes les commandes du restaurant
- ✅ Gérer le menu, le personnel, les stocks
- ❌ Pas d'accès à l'espace client

---

## 🚀 Parcours Complet Client

### Scénario 1: Nouveau Client

```
1. Ouvrir l'application (/)
   ↓
2. Cliquer sur "Créer un compte pour suivre vos commandes"
   ↓
3. Remplir le formulaire d'inscription (/register-client)
   ↓
4. Cliquer sur "Créer mon compte"
   ↓
5. ✅ Redirection automatique vers /client/dashboard
   ↓
6. Voir le tableau de bord vide (aucune commande)
   ↓
7. Cliquer sur "Commander maintenant"
   ↓
8. Choisir un restaurant (/order/restaurants)
   ↓
9. Ajouter des articles au panier (/restaurant/:id)
   ↓
10. Passer la commande (/checkout)
   ↓
11. Suivre la commande (/order/:id)
   ↓
12. Retourner au tableau de bord (/client/dashboard)
   ↓
13. ✅ Voir la commande dans l'historique
```

### Scénario 2: Client Existant

```
1. Ouvrir l'application (/)
   ↓
2. Cliquer sur "Se connecter" (si pas connecté)
   ↓
3. Entrer email et mot de passe (/login)
   ↓
4. ✅ Redirection automatique vers /client/dashboard
   ↓
5. Voir l'historique des commandes
   ↓
6. Cliquer sur "Voir le suivi" pour une commande en cours
   ↓
7. Voir les mises à jour en temps réel
```

---

## 🔐 Connexion et Redirection Automatique

### Redirection Selon le Rôle

**Après connexion:**

| Rôle | Redirection |
|------|-------------|
| `customer` | `/client/dashboard` (Espace Client) |
| `owner`, `manager`, `chef`, `server`, etc. | `/dashboard` (Espace Restaurant) |

**Protection des Routes:**

- ✅ Les clients ne peuvent pas accéder aux routes `/dashboard`, `/pos`, `/stocks`, etc.
- ✅ Le personnel restaurant ne peut pas accéder aux routes `/client/*`
- ✅ Redirection automatique si tentative d'accès non autorisé

---

## 📍 URLs Importantes

### Pages Publiques (Accessibles sans Connexion)
- `/` - Page d'accueil
- `/register-client` - Inscription client
- `/login` - Connexion
- `/order/restaurants` - Liste des restaurants pour commander
- `/restaurant/:id` - Menu d'un restaurant
- `/checkout` - Finalisation de commande
- `/order/:id` - Suivi de commande

### Pages Client (Connexion Requise)
- `/client/dashboard` - Tableau de bord client
- `/client/profile` - Profil client

### Pages Restaurant (Connexion Requise + Rôle Restaurant)
- `/dashboard` - Tableau de bord restaurant
- `/pos` - Point de vente
- `/stocks` - Gestion des stocks
- `/finances` - Finances
- Etc.

---

## 💡 Astuces

### 1. Commande Sans Compte

Vous pouvez commander **sans créer de compte**:
- Ajoutez des articles au panier
- Passez la commande en tant qu'invité
- Vous recevrez un lien de suivi

**Limitation:** Pas d'historique des commandes

### 2. Créer un Compte Après Commande

Si vous avez commandé en tant qu'invité:
1. Créez un compte avec le même email
2. Vos futures commandes seront liées à votre compte
3. Les anciennes commandes invitées ne seront pas automatiquement liées

### 3. Adresses Sauvegardées

Vos adresses de livraison sont automatiquement sauvegardées:
- Lors de votre première commande
- Vous pouvez les réutiliser pour les commandes suivantes
- Gérez-les depuis `/client/profile`

### 4. Suivi en Temps Réel

Les commandes se mettent à jour automatiquement:
- Gardez la page de suivi ouverte
- Les changements de statut apparaissent instantanément
- Pas besoin de rafraîchir la page

---

## ❓ Questions Fréquentes

**Q: Comment créer un compte client?**
R: Cliquez sur "Créer un compte pour suivre vos commandes" sur la page d'accueil, ou allez sur `/register-client`.

**Q: Quelle est la différence entre compte client et compte restaurant?**
R: Un compte client permet de commander et suivre ses commandes. Un compte restaurant permet de gérer un restaurant (menu, commandes, stocks, etc.).

**Q: Puis-je commander sans créer de compte?**
R: Oui, vous pouvez commander en tant qu'invité, mais vous n'aurez pas d'historique des commandes.

**Q: Comment accéder à mon espace client?**
R: Après connexion, vous êtes automatiquement redirigé vers `/client/dashboard`. Vous pouvez aussi cliquer sur "Mon Espace" dans le menu.

**Q: Pourquoi je vois l'espace restaurant au lieu de l'espace client?**
R: Votre compte a probablement un rôle restaurant (owner, manager, etc.) au lieu de `customer`. Créez un nouveau compte avec `/register-client` pour avoir un compte client.

**Q: Puis-je avoir un compte client ET un compte restaurant?**
R: Oui, mais ce sont deux comptes séparés avec des emails différents. Un compte ne peut avoir qu'un seul rôle.

**Q: Comment voir l'historique de mes commandes?**
R: Connectez-vous et allez sur `/client/dashboard`. Toutes vos commandes sont affichées avec des filtres (Toutes, En cours, Livrées).

**Q: Comment modifier mon profil?**
R: Allez sur `/client/profile` et modifiez vos informations dans l'onglet "Informations personnelles".

**Q: Comment supprimer une adresse de livraison?**
R: Allez sur `/client/profile`, onglet "Adresses de livraison", et cliquez sur l'icône poubelle à côté de l'adresse à supprimer.

**Q: Les commandes se mettent à jour en temps réel?**
R: Oui, sur la page de suivi (`/order/:id`), les changements de statut apparaissent automatiquement grâce à Supabase Realtime.

---

## 🎉 Résumé

### Pour Créer un Compte Client:
1. ✅ Allez sur `/register-client`
2. ✅ Remplissez le formulaire (nom, email, téléphone, mot de passe)
3. ✅ Cliquez sur "Créer mon compte"
4. ✅ Vous êtes redirigé vers `/client/dashboard`

### Pour Accéder à Votre Espace Client:
1. ✅ Connectez-vous avec votre email et mot de passe
2. ✅ Vous êtes automatiquement redirigé vers `/client/dashboard`
3. ✅ Vous voyez votre historique de commandes et statistiques

### Différence Clé:
- **Compte Client** (`customer`) → Espace Client (`/client/*`)
- **Compte Restaurant** (autres rôles) → Espace Restaurant (`/dashboard`, `/pos`, etc.)

---

**Besoin d'aide?**
Consultez la documentation complète ou contactez le support.

**Date**: 2026-04-27
**Version**: v15

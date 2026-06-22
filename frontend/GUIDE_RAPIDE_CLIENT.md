# ✅ Guide Rapide - Créer un Compte Client

## 🎯 Comment Créer un Compte Client

### Méthode 1: Depuis la Page d'Accueil

```
1. Ouvrez l'application → Page d'accueil (/)
   ↓
2. Sous les boutons "Commander maintenant" et "Réserver une table"
   Vous verrez: "Nouveau client? Créer un compte pour suivre vos commandes"
   ↓
3. Cliquez sur le lien "Créer un compte pour suivre vos commandes"
   ↓
4. Remplissez le formulaire:
   - Nom complet
   - Email
   - Téléphone
   - Mot de passe (min 6 caractères)
   - Confirmer le mot de passe
   ↓
5. Cliquez sur "Créer mon compte"
   ↓
6. ✅ Vous êtes automatiquement connecté
   ✅ Vous êtes redirigé vers votre espace client (/client/dashboard)
```

### Méthode 2: URL Directe

```
Tapez directement dans votre navigateur:
/register-client
```

---

## 📱 Votre Espace Client

### Après Inscription

Vous arrivez sur votre **Tableau de Bord Client** (`/client/dashboard`)

**Ce que vous voyez:**

1. **4 Statistiques:**
   - Total Commandes
   - En cours
   - Livrées
   - Total Dépensé

2. **Bouton "Commander maintenant"**
   - Accès rapide aux restaurants

3. **Historique des Commandes**
   - Onglet "Toutes"
   - Onglet "En cours"
   - Onglet "Livrées"

4. **Pour chaque commande:**
   - Nom du restaurant
   - Statut (En attente, Confirmée, En préparation, etc.)
   - Date et heure
   - Articles commandés
   - Total
   - Bouton "Voir le suivi"

---

## 👤 Votre Profil

Accédez à votre profil: `/client/profile`

**2 Onglets:**

1. **Informations personnelles**
   - Modifier votre nom
   - Modifier votre téléphone
   - Email (non modifiable)

2. **Adresses de livraison**
   - Voir toutes vos adresses sauvegardées
   - Supprimer une adresse
   - Les adresses sont enregistrées automatiquement lors de vos commandes

---

## 🔄 Différence Espace Client vs Espace Restaurant

### Espace Client (`/client/*`)

**Pour:** Clients qui commandent

**Rôle:** `customer`

**Pages:**
- `/client/dashboard` - Tableau de bord
- `/client/profile` - Profil

**Fonctionnalités:**
- ✅ Voir ses propres commandes
- ✅ Suivre les livraisons
- ✅ Gérer son profil
- ✅ Commander en ligne

### Espace Restaurant (`/dashboard`, `/pos`, etc.)

**Pour:** Personnel du restaurant

**Rôles:** `owner`, `manager`, `chef`, `server`, etc.

**Pages:**
- `/dashboard` - Tableau de bord restaurant
- `/pos` - Point de vente
- `/stocks` - Gestion des stocks
- `/finances` - Finances
- Etc.

**Fonctionnalités:**
- ✅ Gérer le restaurant
- ✅ Voir toutes les commandes
- ✅ Gérer le menu, le personnel, les stocks

---

## 🚀 Redirection Automatique

### Après Connexion

| Votre Rôle | Redirection Automatique |
|------------|------------------------|
| `customer` (Client) | `/client/dashboard` (Espace Client) |
| `owner`, `manager`, etc. (Restaurant) | `/dashboard` (Espace Restaurant) |

**Protection:**
- ✅ Les clients ne peuvent pas accéder aux pages restaurant
- ✅ Le personnel restaurant ne peut pas accéder aux pages client
- ✅ Redirection automatique si vous essayez d'accéder à une page non autorisée

---

## 📍 URLs Importantes

### Pour Créer un Compte Client
```
/register-client
```

### Pour Se Connecter
```
/login
```

### Votre Espace Client
```
/client/dashboard  (Tableau de bord)
/client/profile    (Profil)
```

### Pour Commander
```
/order/restaurants  (Liste des restaurants)
/restaurant/:id     (Menu d'un restaurant)
/checkout           (Finaliser la commande)
/order/:id          (Suivre la commande)
```

---

## ❓ Questions Fréquentes

**Q: Comment créer un compte client?**
R: Allez sur `/register-client` ou cliquez sur "Créer un compte pour suivre vos commandes" sur la page d'accueil.

**Q: Pourquoi je vois l'espace restaurant au lieu de l'espace client?**
R: Votre compte a un rôle restaurant. Créez un nouveau compte avec `/register-client` pour avoir un compte client.

**Q: Puis-je commander sans créer de compte?**
R: Oui, mais vous n'aurez pas d'historique des commandes.

**Q: Comment voir mes commandes?**
R: Connectez-vous et allez sur `/client/dashboard`.

**Q: Comment modifier mon profil?**
R: Allez sur `/client/profile`.

---

## 🎉 Résumé

### Créer un Compte Client:
1. ✅ Allez sur `/register-client`
2. ✅ Remplissez le formulaire
3. ✅ Cliquez sur "Créer mon compte"
4. ✅ Vous êtes redirigé vers `/client/dashboard`

### Accéder à Votre Espace:
1. ✅ Connectez-vous avec votre email et mot de passe
2. ✅ Vous êtes automatiquement redirigé vers `/client/dashboard`
3. ✅ Vous voyez votre historique de commandes

### Différence Clé:
- **Compte Client** → Espace Client (`/client/*`)
- **Compte Restaurant** → Espace Restaurant (`/dashboard`, `/pos`, etc.)

---

**Date**: 2026-04-27
**Version**: v15
**Statut**: ✅ Espace client opérationnel

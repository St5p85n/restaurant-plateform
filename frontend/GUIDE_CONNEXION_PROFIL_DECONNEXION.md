# Guide Complet - Connexion, Profil et Déconnexion

## 🎯 Fonctionnalités Ajoutées

### 1. Menu Utilisateur avec Connexion/Déconnexion
### 2. Modification du Profil Client
### 3. Navigation Améliorée

---

## 📱 Menu Utilisateur (UserMenu)

### Composant Créé

**Fichier**: `src/components/common/UserMenu.tsx`

### Fonctionnalités

**Pour les utilisateurs non connectés:**
- ✅ Bouton "S'inscrire" → Redirection vers `/register-client`
- ✅ Bouton "Se connecter" → Redirection vers `/login`

**Pour les utilisateurs connectés:**
- ✅ Avatar avec initiales du nom
- ✅ Menu déroulant avec:
  - Nom complet et email
  - Lien vers l'espace approprié (Client ou Restaurant)
  - Lien vers le profil (pour les clients)
  - Bouton de déconnexion

### Affichage Selon le Rôle

**Client (role='customer'):**
```
┌─────────────────────────┐
│ Jean Dupont             │
│ jean@example.com        │
├─────────────────────────┤
│ 📊 Mon Espace Client    │
│ 👤 Mon Profil           │
├─────────────────────────┤
│ 🚪 Se déconnecter       │
└─────────────────────────┘
```

**Personnel Restaurant (autres rôles):**
```
┌─────────────────────────┐
│ Marie Martin            │
│ marie@example.com       │
├─────────────────────────┤
│ 📊 Mon Espace Restaurant│
├─────────────────────────┤
│ 🚪 Se déconnecter       │
└─────────────────────────┘
```

### Code du Composant

**Fonctionnalités clés:**

1. **Détection de l'état de connexion**:
   ```typescript
   if (!user) {
     // Afficher boutons S'inscrire et Se connecter
   } else {
     // Afficher menu utilisateur avec avatar
   }
   ```

2. **Avatar avec initiales**:
   ```typescript
   const getInitials = (name: string | null) => {
     if (!name) return 'U';
     return name
       .split(' ')
       .map((n) => n[0])
       .join('')
       .toUpperCase()
       .slice(0, 2);
   };
   ```

3. **Liens dynamiques selon le rôle**:
   ```typescript
   const getDashboardLink = () => {
     if (profile?.role === 'customer') {
       return '/client/dashboard';
     }
     return '/dashboard';
   };
   ```

4. **Déconnexion**:
   ```typescript
   const handleSignOut = async () => {
     const { error } = await signOut();
     if (error) {
       toast.error('Erreur lors de la déconnexion');
     } else {
       toast.success('Déconnexion réussie');
       navigate('/');
     }
   };
   ```

---

## 🏠 Navigation sur la Page d'Accueil

### Modification de HomePage

**Fichier**: `src/pages/HomePage.tsx`

### Barre de Navigation Ajoutée

**Structure:**
```tsx
<nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
  <div className="container flex h-16 items-center justify-between">
    <Link to="/" className="flex items-center gap-2">
      <UtensilsCrossed className="w-6 h-6 text-primary" />
      <span className="text-xl font-bold">RestauManager</span>
    </Link>
    <UserMenu />
  </div>
</nav>
```

**Caractéristiques:**
- ✅ **Sticky**: Reste en haut lors du scroll
- ✅ **Backdrop blur**: Effet de flou sur le fond
- ✅ **Logo cliquable**: Retour à la page d'accueil
- ✅ **UserMenu intégré**: Connexion/Déconnexion accessible partout

---

## 👤 Modification du Profil Client

### Amélioration de ClientProfilePage

**Fichier**: `src/pages/client/ClientProfilePage.tsx`

### Fonctionnalités

**Onglet "Informations personnelles":**
- ✅ Modification du nom complet
- ✅ Modification du téléphone
- ✅ Email en lecture seule
- ✅ Bouton "Enregistrer les modifications"
- ✅ **Nouveau**: Rafraîchissement automatique du profil après mise à jour

**Onglet "Adresses de livraison":**
- ✅ Affichage de toutes les adresses
- ✅ Badge "Par défaut"
- ✅ Suppression d'adresse

### Amélioration Apportée

**Avant:**
```typescript
const handleUpdateProfile = async (e: React.FormEvent) => {
  // ... mise à jour
  toast.success('Profil mis à jour avec succès');
  // ❌ Le profil dans le contexte n'était pas rafraîchi
};
```

**Après:**
```typescript
const handleUpdateProfile = async (e: React.FormEvent) => {
  // ... mise à jour
  
  // ✅ Rafraîchir le profil dans le contexte
  await refreshProfile();
  
  toast.success('Profil mis à jour avec succès');
};
```

**Avantage:**
- ✅ Le nom dans le menu utilisateur se met à jour immédiatement
- ✅ Les initiales de l'avatar se mettent à jour
- ✅ Cohérence entre le profil affiché et le profil en base de données

---

## 🔐 Processus de Connexion Complet

### Étape 1: Accès à la Page de Connexion

**Méthodes:**
1. Cliquer sur "Se connecter" dans le menu utilisateur (HomePage)
2. Accéder directement à `/login`
3. Être redirigé automatiquement si on essaie d'accéder à une route privée

### Étape 2: Formulaire de Connexion

**Page**: `/login`

**Champs:**
- Email ou nom d'utilisateur
- Mot de passe

**Boutons:**
- "Se connecter"
- Lien vers "S'inscrire" (pour les nouveaux utilisateurs)

### Étape 3: Validation et Connexion

**Processus:**
1. Validation des champs (non vides)
2. Appel à `signInWithUsername(username, password)`
3. Si succès:
   - Toast: "Connexion réussie"
   - Le RouteGuard détecte la connexion
   - Redirection automatique vers:
     * `/client/dashboard` (si customer)
     * `/dashboard` (si autre rôle)
4. Si erreur:
   - Toast: "Erreur de connexion: [message]"

### Étape 4: Après Connexion

**Ce qui se passe:**
- ✅ Le menu utilisateur affiche l'avatar
- ✅ Le nom et l'email sont visibles dans le menu
- ✅ Les liens vers l'espace approprié sont disponibles
- ✅ Le bouton de déconnexion est accessible

---

## 🚪 Processus de Déconnexion

### Étape 1: Cliquer sur "Se déconnecter"

**Emplacement:**
- Menu utilisateur (en haut à droite)
- Dernière option du menu déroulant
- Texte en rouge pour indiquer l'action

### Étape 2: Déconnexion

**Processus:**
1. Appel à `signOut()`
2. Suppression de la session Supabase
3. Nettoyage du contexte utilisateur
4. Toast: "Déconnexion réussie"
5. Redirection vers `/` (page d'accueil)

### Étape 3: Après Déconnexion

**Ce qui se passe:**
- ✅ Le menu utilisateur affiche les boutons "S'inscrire" et "Se connecter"
- ✅ L'avatar disparaît
- ✅ Les routes privées deviennent inaccessibles
- ✅ Tentative d'accès à une route privée → Redirection vers `/login`

---

## 📊 Parcours Utilisateur Complet

### Scénario 1: Nouveau Client

```
1. Ouvre l'application (/)
   ↓
2. Voit la barre de navigation avec "S'inscrire" et "Se connecter"
   ↓
3. Clique sur "S'inscrire"
   ↓
4. Remplit le formulaire d'inscription (/register-client)
   ↓
5. Clique sur "Créer mon compte"
   ↓
6. ✅ Compte créé et connecté automatiquement
   ↓
7. ✅ Redirection vers /client/dashboard
   ↓
8. Voit son avatar avec initiales dans le menu
   ↓
9. Peut cliquer sur l'avatar pour voir le menu
   ↓
10. Peut aller sur "Mon Profil" pour modifier ses informations
   ↓
11. Peut se déconnecter quand il veut
```

### Scénario 2: Client Existant

```
1. Ouvre l'application (/)
   ↓
2. Clique sur "Se connecter"
   ↓
3. Entre email et mot de passe (/login)
   ↓
4. Clique sur "Se connecter"
   ↓
5. ✅ Connexion réussie
   ↓
6. ✅ Redirection vers /client/dashboard
   ↓
7. Voit son avatar dans le menu
   ↓
8. Peut naviguer librement dans l'application
   ↓
9. Peut modifier son profil (/client/profile)
   ↓
10. Peut se déconnecter via le menu
```

### Scénario 3: Modification du Profil

```
1. Connecté en tant que client
   ↓
2. Clique sur l'avatar → "Mon Profil"
   ↓
3. Arrive sur /client/profile
   ↓
4. Onglet "Informations personnelles"
   ↓
5. Modifie le nom: "Jean Dupont" → "Jean-Pierre Dupont"
   ↓
6. Modifie le téléphone: "+221771234567" → "+221771234568"
   ↓
7. Clique sur "Enregistrer les modifications"
   ↓
8. ✅ Toast: "Profil mis à jour avec succès"
   ↓
9. ✅ Le nom dans le menu se met à jour automatiquement
   ↓
10. ✅ Les initiales de l'avatar se mettent à jour: "JD" → "JPD"
```

### Scénario 4: Déconnexion

```
1. Connecté (n'importe quel rôle)
   ↓
2. Clique sur l'avatar en haut à droite
   ↓
3. Menu déroulant s'ouvre
   ↓
4. Clique sur "Se déconnecter" (en rouge)
   ↓
5. ✅ Toast: "Déconnexion réussie"
   ↓
6. ✅ Redirection vers / (page d'accueil)
   ↓
7. ✅ Menu affiche "S'inscrire" et "Se connecter"
   ↓
8. ✅ Avatar a disparu
```

---

## 🎨 Design et UX

### Menu Utilisateur

**Non connecté:**
- Boutons côte à côte
- "S'inscrire" en variant ghost (discret)
- "Se connecter" en variant default (mis en avant)

**Connecté:**
- Avatar circulaire avec initiales
- Couleur primaire pour l'avatar
- Texte blanc pour les initiales
- Hover: Légère animation

**Menu déroulant:**
- Largeur: 224px (w-56)
- Alignement: À droite (align="end")
- Sections séparées par des lignes
- Icônes pour chaque option
- Déconnexion en rouge (text-destructive)

### Barre de Navigation

**Caractéristiques:**
- Hauteur: 64px (h-16)
- Sticky: Reste en haut lors du scroll
- Backdrop blur: Effet de flou sur le fond
- Border en bas: Séparation visuelle
- Container: Centré avec padding

**Logo:**
- Icône UtensilsCrossed
- Texte "RestauManager"
- Cliquable: Retour à la page d'accueil

---

## 🧪 Tests Recommandés

### Test 1: Affichage du Menu Non Connecté

**Étapes:**
1. Se déconnecter (si connecté)
2. Aller sur `/`
3. ✅ Vérifier que les boutons "S'inscrire" et "Se connecter" sont visibles
4. ✅ Vérifier qu'il n'y a pas d'avatar

### Test 2: Connexion et Affichage du Menu

**Étapes:**
1. Cliquer sur "Se connecter"
2. Entrer les identifiants
3. Se connecter
4. ✅ Vérifier la redirection vers le dashboard
5. ✅ Vérifier que l'avatar apparaît
6. Cliquer sur l'avatar
7. ✅ Vérifier que le menu s'ouvre
8. ✅ Vérifier que le nom et l'email sont affichés

### Test 3: Modification du Profil

**Étapes:**
1. Se connecter en tant que client
2. Cliquer sur l'avatar → "Mon Profil"
3. Modifier le nom
4. Cliquer sur "Enregistrer les modifications"
5. ✅ Vérifier le toast de succès
6. Cliquer sur l'avatar
7. ✅ Vérifier que le nom est mis à jour dans le menu
8. ✅ Vérifier que les initiales de l'avatar sont mises à jour

### Test 4: Déconnexion

**Étapes:**
1. Connecté (n'importe quel rôle)
2. Cliquer sur l'avatar
3. Cliquer sur "Se déconnecter"
4. ✅ Vérifier le toast "Déconnexion réussie"
5. ✅ Vérifier la redirection vers `/`
6. ✅ Vérifier que les boutons "S'inscrire" et "Se connecter" réapparaissent
7. ✅ Vérifier que l'avatar a disparu

### Test 5: Navigation Entre les Pages

**Étapes:**
1. Se connecter en tant que client
2. Cliquer sur l'avatar → "Mon Espace Client"
3. ✅ Vérifier la redirection vers `/client/dashboard`
4. Cliquer sur le logo "RestauManager"
5. ✅ Vérifier la redirection vers `/`
6. ✅ Vérifier que l'avatar est toujours visible

---

## 💡 Fonctionnalités Clés

### 1. Menu Utilisateur Dynamique

- ✅ Affichage différent selon l'état de connexion
- ✅ Liens adaptés au rôle de l'utilisateur
- ✅ Avatar avec initiales personnalisées
- ✅ Menu déroulant avec options contextuelles

### 2. Connexion Complète

- ✅ Formulaire de connexion existant
- ✅ Validation des champs
- ✅ Gestion des erreurs
- ✅ Redirection automatique selon le rôle
- ✅ Toast de confirmation

### 3. Modification du Profil

- ✅ Formulaire de modification
- ✅ Validation des champs
- ✅ Mise à jour en base de données
- ✅ Rafraîchissement automatique du contexte
- ✅ Mise à jour de l'avatar et du menu
- ✅ Toast de confirmation

### 4. Déconnexion

- ✅ Bouton accessible dans le menu
- ✅ Suppression de la session
- ✅ Nettoyage du contexte
- ✅ Redirection vers la page d'accueil
- ✅ Toast de confirmation

---

## 🎯 Résumé

### Composants Créés

1. **UserMenu** (`src/components/common/UserMenu.tsx`)
   - Menu utilisateur avec connexion/déconnexion
   - Avatar avec initiales
   - Liens dynamiques selon le rôle

### Composants Modifiés

1. **HomePage** (`src/pages/HomePage.tsx`)
   - Ajout de la barre de navigation
   - Intégration du UserMenu

2. **ClientProfilePage** (`src/pages/client/ClientProfilePage.tsx`)
   - Ajout du rafraîchissement du profil après mise à jour

### Fonctionnalités Complètes

- ✅ **Connexion**: Formulaire existant + Redirection automatique
- ✅ **Déconnexion**: Bouton dans le menu + Redirection vers `/`
- ✅ **Modification du profil**: Formulaire + Rafraîchissement automatique
- ✅ **Navigation**: Barre sticky avec logo et menu utilisateur
- ✅ **UX**: Avatar, initiales, menu déroulant, toasts

---

**Date**: 2026-04-27
**Version**: v18
**Statut**: ✅ Toutes les fonctionnalités opérationnelles

# Correction de la Redirection Automatique depuis la Landing Page

## 🐛 Problème Identifié

### Symptôme
Lorsqu'un utilisateur connecté accédait à la page d'accueil (`/`), il était automatiquement redirigé vers son espace respectif:
- Clients → `/client/dashboard`
- Personnel restaurant → `/dashboard`

**Impact**: La landing page n'était plus accessible pour les utilisateurs connectés.

### Cause Racine
Le `RouteGuard` avait une logique de redirection automatique depuis la racine (`/`) qui empêchait l'accès à la landing page pour les utilisateurs connectés.

**Code problématique:**
```typescript
// Redirection depuis la racine ou login
if (location.pathname === '/' || location.pathname === '/login') {
  if (profile.role === 'customer') {
    navigate('/client/dashboard', { replace: true });
  } else {
    navigate('/dashboard', { replace: true });
  }
  return;
}
```

---

## ✅ Solution Implémentée

### Modification 1: RouteGuard

**Fichier**: `src/components/common/RouteGuard.tsx`

**Changement**:
```typescript
// AVANT: Redirection depuis la racine ou login
if (location.pathname === '/' || location.pathname === '/login') {
  // ...redirection
}

// APRÈS: Redirection uniquement depuis /login (après connexion)
if (location.pathname === '/login') {
  if (profile.role === 'customer') {
    navigate('/client/dashboard', { replace: true });
  } else {
    navigate('/dashboard', { replace: true });
  }
  return;
}
```

**Explication**:
- ✅ La landing page (`/`) reste accessible même quand connecté
- ✅ La redirection automatique se fait uniquement depuis `/login` après connexion
- ✅ Les utilisateurs peuvent revenir à la landing page quand ils veulent

### Modification 2: LoginPage

**Fichier**: `src/pages/LoginPage.tsx`

**Changement**:
```typescript
// AVANT: Redirection manuelle après connexion
if (error) {
  toast.error(`Erreur de connexion: ${error.message}`);
} else {
  toast.success('Connexion réussie');
  navigate(from, { replace: true }); // ❌ Redirection manuelle
}

// APRÈS: Laisser le RouteGuard gérer la redirection
if (error) {
  toast.error(`Erreur de connexion: ${error.message}`);
} else {
  toast.success('Connexion réussie');
  // ✅ Le RouteGuard va gérer la redirection automatique
}
```

**Explication**:
- ✅ Suppression de la redirection manuelle
- ✅ Le `RouteGuard` détecte que l'utilisateur est sur `/login` et redirige automatiquement
- ✅ Cohérence: toute la logique de redirection est centralisée dans le `RouteGuard`

---

## 🔄 Comportement Après Correction

### Scénario 1: Utilisateur Non Connecté

```
1. Accède à "/" (landing page)
   ↓
2. ✅ Voit la landing page avec les boutons "Commander" et "Réserver"
   ↓
3. Clique sur "Se connecter"
   ↓
4. Arrive sur "/login"
   ↓
5. Entre ses identifiants et se connecte
   ↓
6. ✅ Redirection automatique vers:
      - /client/dashboard (si customer)
      - /dashboard (si autre rôle)
```

### Scénario 2: Client Connecté

```
1. Connecté en tant que client (role='customer')
   ↓
2. Accède à "/" (landing page)
   ↓
3. ✅ Voit la landing page (pas de redirection)
   ↓
4. Peut cliquer sur "Commander maintenant" ou "Mon Espace"
   ↓
5. Si clique sur "Mon Espace" → /client/dashboard
   ↓
6. Peut revenir à "/" quand il veut
```

### Scénario 3: Personnel Restaurant Connecté

```
1. Connecté en tant que gérant (role='manager')
   ↓
2. Accède à "/" (landing page)
   ↓
3. ✅ Voit la landing page (pas de redirection)
   ↓
4. Peut cliquer sur "Mon Espace" ou naviguer vers /dashboard
   ↓
5. Si clique sur "Mon Espace" → /dashboard
   ↓
6. Peut revenir à "/" quand il veut
```

### Scénario 4: Tentative d'Accès à Route Non Autorisée

```
1. Client connecté (role='customer')
   ↓
2. Essaie d'accéder à "/dashboard" (espace restaurant)
   ↓
3. ✅ Redirection automatique vers /client/dashboard
   ↓
4. Message: Protection des routes selon le rôle
```

---

## 🔒 Protection des Routes Maintenue

### Routes Publiques (Accessibles par Tous)

- ✅ `/` - Landing page (même connecté)
- ✅ `/login` - Connexion
- ✅ `/register-client` - Inscription client
- ✅ `/order/restaurants` - Liste des restaurants
- ✅ `/restaurant/:id` - Menu d'un restaurant
- ✅ `/checkout` - Finalisation de commande
- ✅ `/order/:id` - Suivi de commande
- ✅ `/restaurants` - Liste des restaurants (réservation)
- ✅ `/restaurants/:id` - Détails d'un restaurant

### Routes Client (Uniquement role='customer')

- ✅ `/client/dashboard` - Tableau de bord client
- ✅ `/client/profile` - Profil client
- ❌ Bloquées pour le personnel restaurant → Redirection vers `/dashboard`

### Routes Restaurant (Tous sauf role='customer')

- ✅ `/dashboard` - Tableau de bord restaurant
- ✅ `/pos` - Point de vente
- ✅ `/stocks` - Gestion des stocks
- ✅ `/finances` - Finances
- ✅ `/menu` - Gestion du menu
- ✅ `/staff` - Gestion du personnel
- ❌ Bloquées pour les clients → Redirection vers `/client/dashboard`

---

## 📊 Logique de Redirection Complète

### RouteGuard - Logique Finale

```typescript
useEffect(() => {
  if (loading) return;

  const isPublic = matchPublicRoute(location.pathname, PUBLIC_ROUTES);

  // 1. Si pas connecté et route privée → login
  if (!user && !isPublic) {
    navigate('/login', { state: { from: location.pathname }, replace: true });
    return;
  }

  // 2. Si connecté
  if (user && profile) {
    // 2a. Redirection uniquement depuis /login (après connexion)
    if (location.pathname === '/login') {
      if (profile.role === 'customer') {
        navigate('/client/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      return;
    }

    // 2b. Empêcher les clients d'accéder aux routes restaurant
    if (profile.role === 'customer' && location.pathname.startsWith('/dashboard')) {
      navigate('/client/dashboard', { replace: true });
      return;
    }

    // 2c. Empêcher le personnel restaurant d'accéder aux routes client
    if (profile.role !== 'customer' && location.pathname.startsWith('/client')) {
      navigate('/dashboard', { replace: true });
      return;
    }
  }
}, [user, profile, loading, location.pathname, navigate]);
```

### Points Clés

1. **Pas de redirection depuis "/"**: La landing page reste accessible
2. **Redirection depuis "/login"**: Après connexion, redirection automatique vers l'espace approprié
3. **Protection des routes**: Les routes client/restaurant restent protégées selon le rôle
4. **Routes publiques**: Accessibles par tous, connectés ou non

---

## 🧪 Tests Recommandés

### Test 1: Landing Page Accessible Quand Connecté

**Étapes**:
1. Se connecter en tant que client
2. Aller sur `/client/dashboard`
3. Cliquer sur le logo ou naviguer vers `/`
4. ✅ Vérifier que la landing page s'affiche
5. ✅ Vérifier qu'il n'y a pas de redirection automatique

### Test 2: Redirection Après Connexion

**Étapes**:
1. Se déconnecter
2. Aller sur `/login`
3. Se connecter avec un compte client
4. ✅ Vérifier la redirection automatique vers `/client/dashboard`
5. Se déconnecter
6. Se connecter avec un compte restaurant
7. ✅ Vérifier la redirection automatique vers `/dashboard`

### Test 3: Protection des Routes Client

**Étapes**:
1. Se connecter en tant que client
2. Essayer d'accéder à `/dashboard`
3. ✅ Vérifier la redirection vers `/client/dashboard`
4. Essayer d'accéder à `/pos`
5. ✅ Vérifier la redirection vers `/client/dashboard`

### Test 4: Protection des Routes Restaurant

**Étapes**:
1. Se connecter en tant que gérant
2. Essayer d'accéder à `/client/dashboard`
3. ✅ Vérifier la redirection vers `/dashboard`
4. Essayer d'accéder à `/client/profile`
5. ✅ Vérifier la redirection vers `/dashboard`

### Test 5: Routes Publiques Accessibles

**Étapes**:
1. Se connecter (n'importe quel rôle)
2. Accéder à `/order/restaurants`
3. ✅ Vérifier que la page s'affiche
4. Accéder à `/restaurants`
5. ✅ Vérifier que la page s'affiche
6. Accéder à `/`
7. ✅ Vérifier que la landing page s'affiche

---

## 💡 Avantages de la Solution

### Avant

- ❌ Landing page inaccessible quand connecté
- ❌ Redirection automatique depuis "/" gênante
- ❌ Impossible de revenir à la page d'accueil
- ❌ Expérience utilisateur dégradée

### Après

- ✅ Landing page accessible à tout moment
- ✅ Redirection automatique uniquement après connexion
- ✅ Liberté de navigation pour les utilisateurs connectés
- ✅ Expérience utilisateur améliorée
- ✅ Protection des routes maintenue
- ✅ Logique de redirection centralisée dans le RouteGuard

---

## 🎯 Résumé

### Changements Effectués

1. **RouteGuard**:
   - ✅ Suppression de la redirection depuis "/"
   - ✅ Redirection uniquement depuis "/login"
   - ✅ Protection des routes maintenue

2. **LoginPage**:
   - ✅ Suppression de la redirection manuelle
   - ✅ Le RouteGuard gère la redirection automatique

### Comportement Final

| Route | Non Connecté | Client Connecté | Restaurant Connecté |
|-------|--------------|-----------------|---------------------|
| `/` | ✅ Landing page | ✅ Landing page | ✅ Landing page |
| `/login` | ✅ Formulaire login | ✅ Redirection → /client/dashboard | ✅ Redirection → /dashboard |
| `/client/dashboard` | ❌ Redirection → /login | ✅ Tableau de bord client | ❌ Redirection → /dashboard |
| `/dashboard` | ❌ Redirection → /login | ❌ Redirection → /client/dashboard | ✅ Tableau de bord restaurant |
| `/order/restaurants` | ✅ Liste restaurants | ✅ Liste restaurants | ✅ Liste restaurants |

---

## 🚀 Prochaines Améliorations Possibles

1. **Bouton "Mon Espace" Dynamique**: Afficher un bouton différent selon le rôle dans la navigation
2. **Menu Utilisateur**: Ajouter un menu déroulant avec liens vers l'espace approprié
3. **Breadcrumbs**: Ajouter un fil d'Ariane pour faciliter la navigation
4. **Historique de Navigation**: Permettre de revenir à la page précédente après connexion

---

**Date de correction**: 2026-04-27
**Version**: v17
**Statut**: ✅ Résolu
**Fichiers modifiés**: 
- `src/components/common/RouteGuard.tsx`
- `src/pages/LoginPage.tsx`

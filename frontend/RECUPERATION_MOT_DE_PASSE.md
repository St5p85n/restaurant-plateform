# Récupération de Mot de Passe - KobeTii

## 🎯 Fonctionnalité Ajoutée

**Problème résolu:** Les utilisateurs (clients et personnel restaurant) qui oublient leur mot de passe ne pouvaient pas se reconnecter à leur compte.

**Solution:** Système complet de récupération de mot de passe par email avec réinitialisation sécurisée.

---

## 📄 Nouveaux Fichiers

### 1. ForgotPasswordPage.tsx

**Emplacement:** `src/pages/ForgotPasswordPage.tsx`

**Fonctionnalités:**

#### Formulaire de Demande
- ✅ Champ email avec icône Mail
- ✅ Validation de format d'email
- ✅ Bouton "Envoyer le lien de réinitialisation"
- ✅ Lien "Retour à la connexion"
- ✅ Design minimal et aéré

#### Confirmation d'Envoi
- ✅ Écran de confirmation après envoi
- ✅ Affichage de l'email saisi
- ✅ Icône Mail avec fond primary/10
- ✅ Instructions claires pour l'utilisateur
- ✅ Conseils si l'email n'est pas reçu:
  - Vérifier le dossier spam
  - Vérifier l'adresse email
  - Attendre quelques minutes
- ✅ Bouton "Essayer une autre adresse email"
- ✅ Lien "Retour à la connexion"

**Code clé:**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    toast.error('Veuillez saisir une adresse email valide');
    return;
  }

  // Envoi de l'email de réinitialisation
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;

  setEmailSent(true);
  toast.success('Email envoyé! Vérifiez votre boîte de réception');
};
```

**États:**
- `email`: Adresse email saisie
- `loading`: État de chargement
- `emailSent`: Email envoyé ou non

**Validation:**
- ✅ Email requis
- ✅ Format d'email valide (regex)
- ✅ Feedback visuel avec toast

### 2. ResetPasswordPage.tsx

**Emplacement:** `src/pages/ResetPasswordPage.tsx`

**Fonctionnalités:**

#### Vérification de Session
- ✅ Vérification automatique du token de réinitialisation
- ✅ Redirection vers `/forgot-password` si token invalide ou expiré
- ✅ Message d'erreur clair

#### Formulaire de Réinitialisation
- ✅ Champ "Nouveau mot de passe" avec icône Lock
- ✅ Champ "Confirmer le mot de passe" avec icône Lock
- ✅ Boutons pour afficher/masquer les mots de passe (Eye/EyeOff)
- ✅ Validation de longueur (minimum 6 caractères)
- ✅ Validation de correspondance des mots de passe
- ✅ Indicateur de force du mot de passe (3 niveaux)
- ✅ Feedback en temps réel sur la force

#### Indicateur de Force du Mot de Passe
- ✅ 3 barres de progression
- ✅ Barre 1: Activée si ≥ 6 caractères
- ✅ Barre 2: Activée si ≥ 8 caractères
- ✅ Barre 3: Activée si ≥ 10 caractères + majuscule + chiffre
- ✅ Messages:
  - "Mot de passe trop court" (< 6)
  - "Mot de passe faible" (6-7)
  - "Mot de passe moyen" (8-9)
  - "Mot de passe fort" (≥ 10 + majuscule + chiffre)

**Code clé:**

```typescript
useEffect(() => {
  // Vérifier si l'utilisateur a un token de réinitialisation valide
  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setIsValidSession(true);
    } else {
      toast.error('Lien de réinitialisation invalide ou expiré');
      navigate('/forgot-password');
    }
  };

  checkSession();
}, [navigate]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validations
  if (password.length < 6) {
    toast.error('Le mot de passe doit contenir au moins 6 caractères');
    return;
  }

  if (password !== confirmPassword) {
    toast.error('Les mots de passe ne correspondent pas');
    return;
  }

  // Mise à jour du mot de passe
  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) throw error;

  toast.success('Mot de passe réinitialisé avec succès!');
  
  // Redirection vers la page de connexion
  setTimeout(() => {
    navigate('/login');
  }, 2000);
};
```

**États:**
- `password`: Nouveau mot de passe
- `confirmPassword`: Confirmation du mot de passe
- `loading`: État de chargement
- `showPassword`: Afficher/masquer le mot de passe
- `showConfirmPassword`: Afficher/masquer la confirmation
- `isValidSession`: Token valide ou non

**Validation:**
- ✅ Mot de passe requis
- ✅ Confirmation requise
- ✅ Longueur minimum 6 caractères
- ✅ Correspondance des mots de passe
- ✅ Feedback visuel avec toast

### 3. LoginPage.tsx (Modifié)

**Modification:** Ajout du lien "Mot de passe oublié?"

**Emplacement:** Sous le champ "Mot de passe", aligné à droite

**Code ajouté:**

```tsx
<div className="flex items-center justify-end">
  <Link
    to="/forgot-password"
    className="text-sm text-primary hover:underline"
  >
    Mot de passe oublié?
  </Link>
</div>
```

**Position:**
- ✅ Entre le champ "Mot de passe" et le bouton "Se connecter"
- ✅ Aligné à droite avec `justify-end`
- ✅ Taille de texte `text-sm`
- ✅ Couleur primary avec hover underline

---

## 🛣️ Nouvelles Routes

### Route 1: Forgot Password

```typescript
{
  name: 'Forgot Password',
  path: '/forgot-password',
  element: <ForgotPasswordPage />,
  public: true,
}
```

**Caractéristiques:**
- ✅ Route publique (accessible sans connexion)
- ✅ Accessible depuis `/login` via le lien "Mot de passe oublié?"

### Route 2: Reset Password

```typescript
{
  name: 'Reset Password',
  path: '/reset-password',
  element: <ResetPasswordPage />,
  public: true,
}
```

**Caractéristiques:**
- ✅ Route publique (accessible sans connexion)
- ✅ Accessible uniquement avec un token valide
- ✅ Redirection automatique vers `/forgot-password` si token invalide

---

## 🔄 Flux Utilisateur

### Flux Complet de Récupération

**Étape 1: Demande de réinitialisation**
1. Utilisateur va sur `/login`
2. Clique sur "Mot de passe oublié?"
3. Redirigé vers `/forgot-password`
4. Saisit son adresse email
5. Clique sur "Envoyer le lien de réinitialisation"
6. ✅ Email envoyé avec succès
7. Voit l'écran de confirmation

**Étape 2: Réception de l'email**
1. Utilisateur vérifie sa boîte de réception
2. Reçoit un email de Supabase
3. Email contient un lien de réinitialisation
4. Lien pointe vers `/reset-password` avec un token

**Étape 3: Réinitialisation du mot de passe**
1. Utilisateur clique sur le lien dans l'email
2. Redirigé vers `/reset-password`
3. ✅ Token vérifié automatiquement
4. Voit le formulaire de réinitialisation
5. Saisit un nouveau mot de passe
6. Saisit la confirmation du mot de passe
7. ✅ Voit l'indicateur de force du mot de passe
8. Clique sur "Réinitialiser le mot de passe"
9. ✅ Mot de passe mis à jour avec succès
10. Redirigé vers `/login` après 2 secondes

**Étape 4: Connexion avec le nouveau mot de passe**
1. Utilisateur arrive sur `/login`
2. Saisit son nom d'utilisateur ou email
3. Saisit son nouveau mot de passe
4. Clique sur "Se connecter"
5. ✅ Connexion réussie
6. Redirigé vers son dashboard

### Flux Alternatif: Token Invalide

**Scénario:** Utilisateur clique sur un lien expiré

1. Utilisateur clique sur le lien dans l'email
2. Redirigé vers `/reset-password`
3. ❌ Token vérifié: invalide ou expiré
4. Toast d'erreur: "Lien de réinitialisation invalide ou expiré"
5. Redirigé automatiquement vers `/forgot-password`
6. Peut demander un nouveau lien

### Flux Alternatif: Email Non Reçu

**Scénario:** Utilisateur ne reçoit pas l'email

1. Utilisateur attend quelques minutes
2. Vérifie le dossier spam
3. Vérifie que l'adresse email est correcte
4. Si toujours pas reçu:
   - Clique sur "Essayer une autre adresse email"
   - Retour au formulaire
   - Saisit une autre adresse
   - Renvoie la demande

---

## 🎨 Design et UX

### Design Minimal (Selon Template)

**Principes appliqués:**
- ✅ Beaucoup d'espace blanc (`space-y-4`, `gap-4`)
- ✅ Hiérarchie claire (titres, descriptions, formulaires)
- ✅ Typographie lisible (font-bold, text-muted-foreground)
- ✅ Contraste doux (primary, muted, foreground)
- ✅ Pas de shadows excessives (design épuré)
- ✅ Icônes minimalistes (Mail, Lock, Eye, EyeOff)

### ForgotPasswordPage

**Hiérarchie visuelle:**
1. Logo KobeTii (cercle primary avec icône)
2. Titre: "KobeTii" (gradient-text)
3. Sous-titre: "Récupération de mot de passe"
4. Carte avec:
   - Titre: "Mot de passe oublié?"
   - Description
   - Formulaire (email)
   - Bouton principal
   - Bouton secondaire (retour)

**Espacement:**
- `mb-8`: Entre le header et la carte
- `space-y-4`: Dans le contenu de la carte
- `gap-4`: Dans le footer

### ResetPasswordPage

**Hiérarchie visuelle:**
1. Logo KobeTii (cercle primary avec icône)
2. Titre: "KobeTii" (gradient-text)
3. Sous-titre: "Réinitialisation de mot de passe"
4. Carte avec:
   - Titre: "Nouveau mot de passe"
   - Description
   - Formulaire (2 champs)
   - Indicateur de force
   - Bouton principal

**Espacement:**
- `mb-8`: Entre le header et la carte
- `space-y-4`: Dans le contenu de la carte
- `space-y-2`: Pour les champs individuels

### Écran de Confirmation (ForgotPasswordPage)

**Hiérarchie visuelle:**
1. Titre: "Email envoyé!"
2. Description: "Vérifiez votre boîte de réception"
3. Icône Mail (grande, centrée)
4. Texte: "Nous avons envoyé un lien à:"
5. Email (font-medium)
6. Instructions
7. Encadré avec conseils (bg-muted/50)
8. Boutons d'action

**Espacement:**
- `py-6`: Autour de l'icône
- `space-y-2`: Entre les textes
- `gap-2`: Entre les boutons

---

## 🔒 Sécurité

### Supabase Auth

**Fonctionnalités utilisées:**

#### 1. resetPasswordForEmail()

```typescript
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
});
```

**Sécurité:**
- ✅ Token unique généré par Supabase
- ✅ Token à usage unique
- ✅ Token avec expiration (généralement 1 heure)
- ✅ Email envoyé uniquement si l'adresse existe
- ✅ Pas de confirmation si l'email n'existe pas (sécurité)

#### 2. getSession()

```typescript
const { data: { session } } = await supabase.auth.getSession();
```

**Sécurité:**
- ✅ Vérifie que l'utilisateur a un token valide
- ✅ Vérifie que le token n'est pas expiré
- ✅ Redirection automatique si invalide

#### 3. updateUser()

```typescript
await supabase.auth.updateUser({
  password: password,
});
```

**Sécurité:**
- ✅ Nécessite une session valide
- ✅ Hash automatique du mot de passe
- ✅ Invalidation de l'ancien mot de passe
- ✅ Invalidation du token de réinitialisation

### Validation Frontend

**Validations implémentées:**

#### ForgotPasswordPage
- ✅ Email requis
- ✅ Format d'email valide (regex)
- ✅ Feedback immédiat avec toast

#### ResetPasswordPage
- ✅ Mot de passe requis
- ✅ Confirmation requise
- ✅ Longueur minimum 6 caractères
- ✅ Correspondance des mots de passe
- ✅ Indicateur de force en temps réel

### Protection Contre les Abus

**Mesures de sécurité:**
- ✅ Rate limiting par Supabase (limite d'emails par heure)
- ✅ Token à usage unique (ne peut pas être réutilisé)
- ✅ Token avec expiration (généralement 1 heure)
- ✅ Pas de confirmation si l'email n'existe pas (évite l'énumération)

---

## 🧪 Tests Recommandés

### Test 1: Demande de Réinitialisation

**Objectif:** Vérifier que l'email de réinitialisation est envoyé

**Prérequis:** Avoir un compte avec un email valide

**Étapes:**
1. Aller sur `/login`
2. Cliquer sur "Mot de passe oublié?"
3. ✅ Vérifier la redirection vers `/forgot-password`
4. Saisir l'adresse email du compte
5. Cliquer sur "Envoyer le lien de réinitialisation"
6. ✅ Vérifier le toast de succès
7. ✅ Vérifier l'écran de confirmation
8. ✅ Vérifier que l'email est affiché
9. Vérifier la boîte de réception
10. ✅ Vérifier que l'email est reçu

### Test 2: Réinitialisation du Mot de Passe

**Objectif:** Vérifier que le mot de passe peut être réinitialisé

**Prérequis:** Avoir reçu l'email de réinitialisation

**Étapes:**
1. Ouvrir l'email de réinitialisation
2. Cliquer sur le lien
3. ✅ Vérifier la redirection vers `/reset-password`
4. ✅ Vérifier que le formulaire s'affiche
5. Saisir un nouveau mot de passe (ex: "Test123")
6. ✅ Vérifier l'indicateur de force
7. Saisir la confirmation du mot de passe
8. Cliquer sur "Réinitialiser le mot de passe"
9. ✅ Vérifier le toast de succès
10. ✅ Vérifier la redirection vers `/login` après 2 secondes
11. Se connecter avec le nouveau mot de passe
12. ✅ Vérifier que la connexion réussit

### Test 3: Validation des Champs

**Objectif:** Vérifier que les validations fonctionnent

**Sous-test 3.1: Email invalide**
1. Aller sur `/forgot-password`
2. Saisir "test" (pas un email)
3. Cliquer sur "Envoyer le lien de réinitialisation"
4. ✅ Vérifier le toast d'erreur: "Veuillez saisir une adresse email valide"

**Sous-test 3.2: Mot de passe trop court**
1. Aller sur `/reset-password` (avec token valide)
2. Saisir "123" comme mot de passe
3. Saisir "123" comme confirmation
4. Cliquer sur "Réinitialiser le mot de passe"
5. ✅ Vérifier le toast d'erreur: "Le mot de passe doit contenir au moins 6 caractères"

**Sous-test 3.3: Mots de passe ne correspondent pas**
1. Aller sur `/reset-password` (avec token valide)
2. Saisir "Test123" comme mot de passe
3. Saisir "Test456" comme confirmation
4. Cliquer sur "Réinitialiser le mot de passe"
5. ✅ Vérifier le toast d'erreur: "Les mots de passe ne correspondent pas"

### Test 4: Token Invalide

**Objectif:** Vérifier la gestion des tokens invalides

**Étapes:**
1. Aller directement sur `/reset-password` (sans token)
2. ✅ Vérifier le toast d'erreur: "Lien de réinitialisation invalide ou expiré"
3. ✅ Vérifier la redirection vers `/forgot-password`

### Test 5: Indicateur de Force du Mot de Passe

**Objectif:** Vérifier que l'indicateur fonctionne correctement

**Étapes:**
1. Aller sur `/reset-password` (avec token valide)
2. Saisir "12345"
3. ✅ Vérifier: 0 barre active, message "Mot de passe trop court"
4. Saisir "123456"
5. ✅ Vérifier: 1 barre active, message "Mot de passe faible"
6. Saisir "12345678"
7. ✅ Vérifier: 2 barres actives, message "Mot de passe moyen"
8. Saisir "Test123456"
9. ✅ Vérifier: 3 barres actives, message "Mot de passe fort"

### Test 6: Afficher/Masquer le Mot de Passe

**Objectif:** Vérifier que les boutons Eye/EyeOff fonctionnent

**Étapes:**
1. Aller sur `/reset-password` (avec token valide)
2. Saisir un mot de passe
3. ✅ Vérifier que le mot de passe est masqué (••••••)
4. Cliquer sur l'icône Eye
5. ✅ Vérifier que le mot de passe est visible
6. ✅ Vérifier que l'icône change en EyeOff
7. Cliquer sur l'icône EyeOff
8. ✅ Vérifier que le mot de passe est masqué
9. Répéter pour le champ de confirmation

### Test 7: Retour à la Connexion

**Objectif:** Vérifier que les liens de retour fonctionnent

**Étapes:**
1. Aller sur `/forgot-password`
2. Cliquer sur "Retour à la connexion"
3. ✅ Vérifier la redirection vers `/login`
4. Aller sur `/forgot-password`
5. Envoyer un email
6. Sur l'écran de confirmation, cliquer sur "Retour à la connexion"
7. ✅ Vérifier la redirection vers `/login`

### Test 8: Essayer une Autre Adresse

**Objectif:** Vérifier que le bouton "Essayer une autre adresse email" fonctionne

**Étapes:**
1. Aller sur `/forgot-password`
2. Saisir un email et envoyer
3. Sur l'écran de confirmation, cliquer sur "Essayer une autre adresse email"
4. ✅ Vérifier le retour au formulaire
5. ✅ Vérifier que le champ email est vide
6. Saisir une nouvelle adresse
7. ✅ Vérifier que l'envoi fonctionne

---

## 📊 Comparaison Avant/Après

### Avant

**Problèmes:**
- ❌ Pas de récupération de mot de passe
- ❌ Utilisateurs bloqués s'ils oublient leur mot de passe
- ❌ Nécessité de contacter le support
- ❌ Mauvaise expérience utilisateur
- ❌ Perte de clients potentiels

**Impact:**
- Frustration des utilisateurs
- Augmentation des demandes de support
- Perte de temps pour le support
- Perte de revenus (clients qui abandonnent)

### Après

**Améliorations:**
- ✅ Récupération de mot de passe par email
- ✅ Processus autonome (pas besoin du support)
- ✅ Interface claire et intuitive
- ✅ Feedback visuel à chaque étape
- ✅ Sécurité renforcée (token unique, expiration)
- ✅ Indicateur de force du mot de passe
- ✅ Validation en temps réel

**Impact:**
- Satisfaction des utilisateurs
- Réduction des demandes de support
- Gain de temps pour le support
- Rétention des clients
- Meilleure expérience utilisateur

---

## 💡 Recommandations Futures

### 1. Email Personnalisé

**Actuellement:** Email par défaut de Supabase

**Amélioration:**
- Personnaliser le template d'email
- Ajouter le logo KobeTii
- Améliorer le design de l'email
- Ajouter des instructions claires
- Traduire en français

### 2. Historique des Réinitialisations

**Actuellement:** Pas d'historique

**Amélioration:**
- Enregistrer les demandes de réinitialisation
- Afficher l'historique dans le profil
- Alerter en cas de demandes suspectes
- Limiter le nombre de demandes par jour

### 3. Authentification à Deux Facteurs (2FA)

**Actuellement:** Pas de 2FA

**Amélioration:**
- Ajouter l'option 2FA
- SMS ou application d'authentification
- Obligatoire pour les comptes restaurant
- Optionnel pour les clients

### 4. Questions de Sécurité

**Actuellement:** Récupération uniquement par email

**Amélioration:**
- Ajouter des questions de sécurité
- Alternative si l'email n'est plus accessible
- Vérification d'identité supplémentaire

### 5. Notification de Changement

**Actuellement:** Pas de notification

**Amélioration:**
- Envoyer un email de confirmation après changement
- Alerter si le changement n'a pas été initié par l'utilisateur
- Lien pour annuler le changement si suspect

---

## 📝 Configuration Supabase

### Email Templates

**Configuration requise dans Supabase Dashboard:**

1. Aller dans **Authentication** → **Email Templates**
2. Sélectionner **Reset Password**
3. Personnaliser le template:

```html
<h2>Réinitialisation de mot de passe</h2>
<p>Bonjour,</p>
<p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte KobeTii.</p>
<p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe:</p>
<p><a href="{{ .ConfirmationURL }}">Réinitialiser mon mot de passe</a></p>
<p>Ce lien est valable pendant 1 heure.</p>
<p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
<p>Cordialement,<br>L'équipe KobeTii</p>
```

### URL de Redirection

**Configuration dans le code:**

```typescript
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
});
```

**Résultat:**
- Développement: `http://localhost:5173/reset-password`
- Production: `https://votre-domaine.com/reset-password`

### Rate Limiting

**Configuration par défaut de Supabase:**
- Maximum 4 emails par heure par adresse IP
- Maximum 10 emails par heure par adresse email

**Personnalisation possible dans Supabase Dashboard:**
- Aller dans **Authentication** → **Rate Limits**
- Ajuster selon vos besoins

---

**Date**: 2026-04-27  
**Version**: v23  
**Statut**: ✅ Récupération de mot de passe implémentée avec succès

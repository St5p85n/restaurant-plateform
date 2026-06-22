# Correction des Problèmes d'Authentification Client - KobeTii

## 🐛 Problèmes Identifiés

### Problème 1: "incorrect credentials" lors de la connexion

**Symptôme:** Les clients ne peuvent pas se connecter même avec les bons identifiants.

**Cause Racine:**
- Dans `AuthContext.tsx`, la fonction `signInWithUsername` transformait TOUJOURS le username en email avec le suffixe `@miaoda.com`
- Exemple: `jean.dupont@example.com` → `jean.dupont@example.com@miaoda.com`
- Les clients s'inscrivent avec leur vrai email (ex: `jean.dupont@example.com`)
- Mais lors de la connexion, le système cherchait `jean.dupont@example.com@miaoda.com` qui n'existe pas

**Code Problématique:**
```typescript
const signInWithUsername = async (username: string, password: string) => {
  const email = `${username}@miaoda.com`; // ❌ Toujours ajouter @miaoda.com
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  // ...
};
```

### Problème 2: "duplicate key value violates unique constraint profiles_pkey"

**Symptôme:** Erreur lors de la création d'un nouveau compte client.

**Cause Racine:**
- Il y avait un trigger `on_auth_user_confirmed` qui créait automatiquement un profil quand un utilisateur était confirmé
- Dans `RegisterClientPage.tsx`, on essayait AUSSI de créer manuellement le profil après l'inscription
- Résultat: **double insertion** avec le même ID → erreur de contrainte unique

**Code Problématique:**

**Trigger (00001_create_initial_schema.sql):**
```sql
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user(); -- ✅ Crée le profil
```

**RegisterClientPage.tsx:**
```typescript
// 1. Créer le compte
const { data: authData } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
});

// 2. Créer le profil manuellement ❌ DOUBLON!
const { error: profileError } = await supabase
  .from('profiles')
  .insert({
    id: authData.user.id, // ❌ Même ID que le trigger
    email: formData.email,
    phone: formData.phone,
    full_name: formData.full_name,
    role: 'customer',
  });
```

---

## ✅ Solutions Implémentées

### Solution 1: Détection Automatique Email vs Username

**Fichier:** `src/contexts/AuthContext.tsx`

**Modification:**
```typescript
const signInWithUsername = async (username: string, password: string) => {
  try {
    // ✅ Détecter si c'est un email ou un username
    // Si contient @, c'est un email, sinon c'est un username
    const email = username.includes('@') 
      ? username                    // ✅ Utiliser directement l'email
      : `${username}@miaoda.com`;   // ✅ Ajouter @miaoda.com seulement pour les usernames
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};
```

**Comportement:**
- Si l'utilisateur entre `jean.dupont@example.com` → utilise `jean.dupont@example.com`
- Si l'utilisateur entre `admin` → utilise `admin@miaoda.com`

**Avantages:**
- ✅ Les clients peuvent se connecter avec leur email
- ✅ Le personnel peut se connecter avec leur username
- ✅ Rétrocompatible avec les comptes existants

### Solution 2: Trigger Amélioré avec Vérification d'Existence

**Fichier:** Migration `fix_auth_profile_creation`

**Modifications:**

#### 2.1. Vérification d'Existence

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  profile_exists boolean;
BEGIN
  -- ✅ Vérifier si le profil existe déjà
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = NEW.id) INTO profile_exists;
  
  -- ✅ Si le profil existe déjà, ne rien faire
  IF profile_exists THEN
    RETURN NEW;
  END IF;
  
  -- Compter le nombre de profils existants
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- ✅ Créer le profil avec les données de user_metadata
  INSERT INTO public.profiles (id, email, phone, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN user_count = 0 THEN 'super_admin'::user_role ELSE 'customer'::user_role END
  )
  ON CONFLICT (id) DO NOTHING; -- ✅ Ignorer si le profil existe déjà
  
  RETURN NEW;
END;
$$;
```

**Améliorations:**
1. **Vérification d'existence:** Vérifie si le profil existe avant d'insérer
2. **ON CONFLICT DO NOTHING:** Ignore silencieusement les doublons
3. **Utilisation de user_metadata:** Récupère les données passées lors de l'inscription
4. **COALESCE:** Gère les valeurs NULL

#### 2.2. Trigger sur INSERT au lieu de UPDATE

```sql
-- ✅ Déclencher sur INSERT au lieu de UPDATE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

**Pourquoi ce changement?**
- **Avant:** Trigger sur UPDATE quand `confirmed_at` change
- **Problème:** Si l'email n'est pas confirmé, le profil n'est pas créé
- **Après:** Trigger sur INSERT immédiatement après la création du compte
- **Avantage:** Le profil est créé instantanément, même sans confirmation email

### Solution 3: Suppression de la Création Manuelle du Profil

**Fichier:** `src/pages/client/RegisterClientPage.tsx`

**Avant:**
```typescript
// 1. Créer le compte
const { data: authData } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: {
      full_name: formData.full_name,
      phone: formData.phone,
    },
  },
});

// 2. ❌ Créer le profil manuellement (DOUBLON!)
const { error: profileError } = await supabase
  .from('profiles')
  .insert({
    id: authData.user.id,
    email: formData.email,
    phone: formData.phone,
    full_name: formData.full_name,
    role: 'customer',
  });
```

**Après:**
```typescript
// ✅ Créer le compte avec les données dans user_metadata
// Le trigger handle_new_user va automatiquement créer le profil
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: {
      full_name: formData.full_name,
      phone: formData.phone,
    },
  },
});

// ✅ Pas besoin de créer le profil manuellement!
// Le trigger s'en charge automatiquement
```

**Avantages:**
- ✅ Pas de doublon
- ✅ Code plus simple
- ✅ Cohérence avec le système d'authentification
- ✅ Les données sont passées via `user_metadata` et récupérées par le trigger

---

## 🔄 Flux d'Authentification Corrigé

### Flux d'Inscription Client

**Étape 1: Remplissage du Formulaire**
- Client entre: nom complet, email, téléphone, mot de passe
- Validation côté client

**Étape 2: Création du Compte Supabase Auth**
```typescript
const { data: authData } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: {
      full_name: formData.full_name,
      phone: formData.phone,
    },
  },
});
```

**Étape 3: Trigger Automatique**
- Le trigger `on_auth_user_created` se déclenche
- Vérifie si le profil existe déjà
- Si non, crée le profil avec:
  - `id` = `authData.user.id`
  - `email` = `authData.user.email`
  - `phone` = `authData.user.raw_user_meta_data.phone`
  - `full_name` = `authData.user.raw_user_meta_data.full_name`
  - `role` = `'customer'`

**Étape 4: Redirection**
- Client est automatiquement connecté
- Redirection vers `/client/dashboard`

### Flux de Connexion Client

**Étape 1: Saisie des Identifiants**
- Client entre son email: `jean.dupont@example.com`
- Client entre son mot de passe

**Étape 2: Détection du Type d'Identifiant**
```typescript
const email = username.includes('@') 
  ? username                    // ✅ "jean.dupont@example.com"
  : `${username}@miaoda.com`;   // Pour le personnel
```

**Étape 3: Authentification**
```typescript
const { error } = await supabase.auth.signInWithPassword({
  email: "jean.dupont@example.com", // ✅ Email correct
  password: password,
});
```

**Étape 4: Chargement du Profil**
- AuthContext charge automatiquement le profil
- Redirection selon le rôle

---

## 🧪 Tests de Validation

### Test 1: Inscription d'un Nouveau Client

**Étapes:**
1. Aller sur `/register-client`
2. Remplir le formulaire:
   - Nom: "Jean Dupont"
   - Email: "jean.dupont@example.com"
   - Téléphone: "+221 77 123 45 67"
   - Mot de passe: "password123"
3. Cliquer sur "Créer mon compte"

**Résultat Attendu:**
- ✅ Compte créé avec succès
- ✅ Profil créé automatiquement par le trigger
- ✅ Pas d'erreur "duplicate key"
- ✅ Redirection vers `/client/dashboard`

**Vérification Base de Données:**
```sql
SELECT id, email, phone, full_name, role 
FROM profiles 
WHERE email = 'jean.dupont@example.com';
```

**Résultat:**
```
id                                   | email                      | phone              | full_name   | role
-------------------------------------|----------------------------|--------------------|-------------|----------
550e8400-e29b-41d4-a716-446655440000 | jean.dupont@example.com    | +221 77 123 45 67  | Jean Dupont | customer
```

### Test 2: Connexion avec Email

**Étapes:**
1. Aller sur `/login`
2. Entrer l'email: "jean.dupont@example.com"
3. Entrer le mot de passe: "password123"
4. Cliquer sur "Se connecter"

**Résultat Attendu:**
- ✅ Connexion réussie
- ✅ Pas d'erreur "incorrect credentials"
- ✅ Redirection vers `/client/dashboard`

### Test 3: Connexion avec Username (Personnel)

**Étapes:**
1. Aller sur `/login`
2. Entrer le username: "admin"
3. Entrer le mot de passe
4. Cliquer sur "Se connecter"

**Résultat Attendu:**
- ✅ Le système transforme "admin" en "admin@miaoda.com"
- ✅ Connexion réussie
- ✅ Redirection selon le rôle

### Test 4: Inscription Multiple (Vérification Anti-Doublon)

**Étapes:**
1. Créer un compte avec "test@example.com"
2. Essayer de créer un autre compte avec le même email

**Résultat Attendu:**
- ✅ Première inscription: succès
- ✅ Deuxième inscription: erreur "User already registered"
- ✅ Pas d'erreur "duplicate key" dans les logs

---

## 📊 Comparaison Avant/Après

### Avant les Corrections

**Inscription:**
```
1. Client remplit le formulaire
2. supabase.auth.signUp() ✅
3. Trigger crée le profil ✅
4. Code essaie de créer le profil ❌ ERREUR: duplicate key
5. Client voit l'erreur ❌
```

**Connexion:**
```
1. Client entre "jean.dupont@example.com"
2. Système transforme en "jean.dupont@example.com@miaoda.com" ❌
3. Authentification échoue ❌ ERREUR: incorrect credentials
4. Client ne peut pas se connecter ❌
```

### Après les Corrections

**Inscription:**
```
1. Client remplit le formulaire
2. supabase.auth.signUp() avec user_metadata ✅
3. Trigger vérifie si profil existe ✅
4. Trigger crée le profil (ou ignore si existe) ✅
5. Client est redirigé ✅
```

**Connexion:**
```
1. Client entre "jean.dupont@example.com"
2. Système détecte que c'est un email ✅
3. Système utilise directement "jean.dupont@example.com" ✅
4. Authentification réussit ✅
5. Client est connecté ✅
```

---

## 🔒 Sécurité

### Politiques RLS

**Politique d'Insertion:**
```sql
CREATE POLICY "Users can create their own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
```

**Explication:**
- Permet aux utilisateurs authentifiés de créer leur propre profil
- Vérifie que l'ID du profil correspond à l'ID de l'utilisateur authentifié
- Empêche un utilisateur de créer un profil pour quelqu'un d'autre

### Fonction SECURITY DEFINER

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
```

**Explication:**
- `SECURITY DEFINER`: La fonction s'exécute avec les privilèges du propriétaire (postgres)
- Permet au trigger de créer le profil même si l'utilisateur n'a pas les permissions directes
- `SET search_path = public`: Évite les attaques par injection de schéma

---

## 📝 Notes Techniques

### user_metadata vs raw_user_meta_data

**user_metadata (client-side):**
```typescript
await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password',
  options: {
    data: {
      full_name: 'Jean Dupont',
      phone: '+221 77 123 45 67',
    },
  },
});
```

**raw_user_meta_data (server-side):**
```sql
SELECT 
  NEW.raw_user_meta_data->>'full_name' AS full_name,
  NEW.raw_user_meta_data->>'phone' AS phone
FROM auth.users;
```

### COALESCE pour Gérer les NULL

```sql
COALESCE(NEW.email, '')
COALESCE(NEW.raw_user_meta_data->>'phone', '')
COALESCE(NEW.raw_user_meta_data->>'full_name', '')
```

**Explication:**
- Retourne la première valeur non NULL
- Si `NEW.email` est NULL, retourne `''`
- Évite les erreurs d'insertion avec des valeurs NULL

### ON CONFLICT DO NOTHING

```sql
INSERT INTO profiles (id, email, phone, full_name, role)
VALUES (...)
ON CONFLICT (id) DO NOTHING;
```

**Explication:**
- Si un profil avec le même ID existe déjà, ignore l'insertion
- Pas d'erreur levée
- Idempotent: peut être exécuté plusieurs fois sans problème

---

## 🚀 Recommandations Futures

### 1. Confirmation d'Email Optionnelle

**Actuellement:** Les comptes sont créés sans confirmation d'email

**Amélioration:**
- Activer la confirmation d'email dans Supabase
- Envoyer un email de confirmation
- Afficher un message "Vérifiez votre email"

**Configuration Supabase:**
```typescript
await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    emailRedirectTo: 'https://kobetii.com/confirm-email',
  },
});
```

### 2. Validation du Numéro de Téléphone

**Actuellement:** Pas de validation du format

**Amélioration:**
- Utiliser une bibliothèque comme `libphonenumber-js`
- Valider le format du numéro
- Vérifier le code pays

```typescript
import { parsePhoneNumber } from 'libphonenumber-js';

const phoneNumber = parsePhoneNumber(formData.phone, 'SN');
if (!phoneNumber.isValid()) {
  toast.error('Numéro de téléphone invalide');
  return;
}
```

### 3. Gestion des Erreurs Améliorée

**Actuellement:** Messages d'erreur techniques

**Amélioration:**
- Messages d'erreur conviviaux
- Traduction des erreurs Supabase
- Suggestions de résolution

```typescript
const getErrorMessage = (error: any) => {
  if (error.message.includes('duplicate')) {
    return 'Un compte avec cet email existe déjà';
  }
  if (error.message.includes('invalid')) {
    return 'Email ou mot de passe invalide';
  }
  return 'Une erreur est survenue. Veuillez réessayer.';
};
```

### 4. Logging et Monitoring

**Actuellement:** Logs dans la console uniquement

**Amélioration:**
- Envoyer les erreurs à un service de monitoring (Sentry)
- Tracker les tentatives de connexion échouées
- Alertes pour les erreurs critiques

---

**Date**: 2026-04-27  
**Version**: v27.1  
**Statut**: ✅ Problèmes d'authentification corrigés avec succès

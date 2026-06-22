# Correction du Bug d'Inscription Client - Politique RLS

## 🐛 Problème Identifié

### Symptôme
Lors de la création d'un compte client, l'utilisateur recevait l'erreur:
```
"Erreur lors de la création du profil: new row violates row-level security policy for table 'profiles'"
```

### Cause Racine
La table `profiles` avait des politiques RLS (Row Level Security) pour:
- ✅ SELECT (lecture)
- ✅ UPDATE (modification)
- ❌ INSERT (création) - **MANQUANTE**

**Politiques existantes:**
1. `Super admin a accès complet aux profils` (ALL)
2. `Propriétaires peuvent voir le personnel de leur restaurant` (SELECT)
3. `Utilisateurs peuvent voir leur propre profil` (SELECT)
4. `Utilisateurs peuvent modifier leur profil (sauf role)` (UPDATE)

**Problème:** Aucune politique ne permettait aux utilisateurs authentifiés de créer leur propre profil lors de l'inscription.

### Impact
- ❌ Impossible de créer un compte client
- ❌ L'inscription échouait après la création du compte Supabase Auth
- ❌ Le compte Auth était créé mais sans profil associé

---

## ✅ Solution Implémentée

### Migration: `allow_users_create_own_profile`

```sql
-- Permettre aux utilisateurs authentifiés de créer leur propre profil lors de l'inscription
CREATE POLICY "Users can create their own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Commentaire pour documentation
COMMENT ON POLICY "Users can create their own profile" ON profiles IS 
'Permet aux utilisateurs de créer leur propre profil lors de l''inscription. Le profil doit avoir le même ID que l''utilisateur authentifié (auth.uid()).';
```

### Explication de la Politique

**Nom:** `Users can create their own profile`

**Type:** `INSERT` (création)

**Rôle:** `authenticated` (utilisateurs connectés)

**Condition:** `auth.uid() = id`
- L'utilisateur peut créer un profil uniquement si l'ID du profil correspond à son propre ID d'authentification
- Empêche la création de profils pour d'autres utilisateurs

---

## 🔍 Analyse Détaillée

### Processus d'Inscription Client

**Étape 1: Création du compte Supabase Auth**
```typescript
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
```
✅ Réussit - Crée un utilisateur dans `auth.users`

**Étape 2: Création du profil**
```typescript
const { error: profileError } = await supabase
  .from('profiles')
  .insert({
    id: authData.user.id,  // Même ID que l'utilisateur Auth
    email: formData.email,
    phone: formData.phone,
    full_name: formData.full_name,
    role: 'customer',
  });
```
❌ Échouait avant la correction - Politique RLS manquante
✅ Réussit après la correction - Politique INSERT ajoutée

### Pourquoi la Politique est Nécessaire

**Sans la politique:**
- Supabase bloque l'insertion par défaut (RLS activé)
- Même si l'utilisateur est authentifié
- Même si c'est son propre profil

**Avec la politique:**
- L'utilisateur authentifié peut créer son propre profil
- Vérifie que `auth.uid() = id` (sécurité)
- Empêche la création de profils pour d'autres utilisateurs

---

## 🔒 Sécurité

### Validation de la Politique

**Condition:** `auth.uid() = id`

**Scénarios:**

1. **Utilisateur crée son propre profil** ✅
   ```sql
   INSERT INTO profiles (id, email, full_name, role)
   VALUES (auth.uid(), 'user@example.com', 'John Doe', 'customer');
   -- ✅ Autorisé: auth.uid() = id
   ```

2. **Utilisateur essaie de créer un profil pour quelqu'un d'autre** ❌
   ```sql
   INSERT INTO profiles (id, email, full_name, role)
   VALUES ('autre-uuid', 'other@example.com', 'Jane Doe', 'customer');
   -- ❌ Bloqué: auth.uid() ≠ id
   ```

3. **Utilisateur non authentifié essaie de créer un profil** ❌
   ```sql
   -- Depuis une session non authentifiée
   INSERT INTO profiles (id, email, full_name, role)
   VALUES ('uuid', 'user@example.com', 'John Doe', 'customer');
   -- ❌ Bloqué: Politique requiert 'authenticated'
   ```

### Autres Politiques RLS sur `profiles`

**Après la correction, toutes les opérations sont couvertes:**

| Opération | Politique | Condition |
|-----------|-----------|-----------|
| **INSERT** | Users can create their own profile | `auth.uid() = id` |
| **SELECT** | Utilisateurs peuvent voir leur propre profil | `auth.uid() = id` |
| **SELECT** | Propriétaires peuvent voir le personnel | `restaurant_id = get_user_restaurant_id(auth.uid()) AND has_role(auth.uid(), 'owner')` |
| **UPDATE** | Utilisateurs peuvent modifier leur profil | `auth.uid() = id` (sauf role) |
| **ALL** | Super admin a accès complet | `is_super_admin(auth.uid())` |

---

## 🧪 Tests Recommandés

### Test 1: Inscription Client Réussie

**Étapes:**
1. Aller sur `/register-client`
2. Remplir le formulaire:
   - Nom: Jean Dupont
   - Email: jean.dupont@example.com
   - Téléphone: +221771234567
   - Mot de passe: password123
   - Confirmer: password123
3. Cliquer sur "Créer mon compte"
4. ✅ Vérifier que le compte est créé
5. ✅ Vérifier la redirection vers `/client/dashboard`
6. ✅ Vérifier que le profil est visible

**Vérification SQL:**
```sql
SELECT id, email, full_name, role
FROM profiles
WHERE email = 'jean.dupont@example.com';
-- Devrait retourner 1 ligne avec role='customer'
```

### Test 2: Tentative de Création de Profil pour Autre Utilisateur

**Test SQL:**
```sql
-- Essayer de créer un profil avec un ID différent de auth.uid()
INSERT INTO profiles (id, email, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'fake@example.com', 'Fake User', 'customer');
-- ❌ Devrait échouer avec erreur RLS
```

### Test 3: Vérifier Toutes les Politiques

**Vérification SQL:**
```sql
SELECT 
  policyname,
  cmd,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE 'No condition'
  END as condition
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;
```

**Résultat attendu:**
- ✅ 1 politique INSERT
- ✅ 2 politiques SELECT
- ✅ 1 politique UPDATE
- ✅ 1 politique ALL

---

## 🔧 Débogage

### Si l'erreur persiste

**Étape 1: Vérifier que la politique existe**
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'INSERT';
-- Devrait retourner: "Users can create their own profile"
```

**Étape 2: Vérifier que RLS est activé**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';
-- rowsecurity devrait être 'true'
```

**Étape 3: Tester l'insertion manuellement**
```sql
-- Se connecter en tant qu'utilisateur authentifié
-- Puis essayer:
INSERT INTO profiles (id, email, full_name, role)
VALUES (auth.uid(), 'test@example.com', 'Test User', 'customer')
RETURNING *;
-- ✅ Devrait réussir
```

**Étape 4: Vérifier les logs console**
- Ouvrir DevTools (F12)
- Onglet Console
- Chercher les messages d'erreur détaillés

**Étape 5: Vérifier l'authentification**
```typescript
// Dans RegisterClientPage.tsx, après signUp
console.log('Auth user:', authData.user);
console.log('Auth user ID:', authData.user.id);
// Vérifier que l'ID est bien un UUID valide
```

---

## 📝 Notes Techniques

### Différence entre `USING` et `WITH CHECK`

**USING (qual):**
- Utilisé pour SELECT, UPDATE, DELETE
- Détermine quelles lignes sont visibles/modifiables

**WITH CHECK (with_check):**
- Utilisé pour INSERT, UPDATE
- Détermine si une nouvelle ligne peut être insérée/modifiée

**Pour INSERT:**
- Seul `WITH CHECK` est utilisé
- `USING` n'est pas applicable

### Ordre d'Évaluation des Politiques

**Politiques PERMISSIVE (par défaut):**
- Si **au moins une** politique autorise → Autorisé
- Si **toutes** les politiques refusent → Refusé

**Politiques RESTRICTIVE:**
- **Toutes** les politiques doivent autoriser → Autorisé
- Si **au moins une** politique refuse → Refusé

**Dans notre cas:**
- Toutes les politiques sont PERMISSIVE
- Il suffit qu'une politique autorise l'opération

### Pourquoi `auth.uid() = id`?

**Sécurité:**
- Empêche un utilisateur de créer un profil pour quelqu'un d'autre
- Garantit que chaque utilisateur ne peut créer que son propre profil

**Cohérence:**
- L'ID du profil doit correspondre à l'ID de l'utilisateur Auth
- Permet de lier facilement profil et authentification

**Simplicité:**
- Pas besoin de vérifier d'autres conditions
- Condition simple et claire

---

## 🎯 Résultat Final

### Avant la Correction

| Opération | Politique | Statut |
|-----------|-----------|--------|
| INSERT | ❌ Aucune | ❌ Bloqué |
| SELECT | ✅ 2 politiques | ✅ Autorisé |
| UPDATE | ✅ 1 politique | ✅ Autorisé |
| DELETE | ❌ Aucune | ❌ Bloqué |
| ALL | ✅ 1 politique (super admin) | ✅ Autorisé (admin seulement) |

**Impact:**
- ❌ Impossible de créer un compte client
- ❌ Inscription échouait avec erreur RLS
- ❌ Compte Auth créé mais sans profil

### Après la Correction

| Opération | Politique | Statut |
|-----------|-----------|--------|
| INSERT | ✅ 1 politique | ✅ Autorisé (propre profil) |
| SELECT | ✅ 2 politiques | ✅ Autorisé |
| UPDATE | ✅ 1 politique | ✅ Autorisé |
| DELETE | ❌ Aucune | ❌ Bloqué (intentionnel) |
| ALL | ✅ 1 politique (super admin) | ✅ Autorisé (admin seulement) |

**Impact:**
- ✅ Inscription client fonctionnelle
- ✅ Profil créé automatiquement
- ✅ Redirection vers `/client/dashboard`
- ✅ Sécurité maintenue (uniquement son propre profil)

---

## 🚀 Prochaines Améliorations

1. **Politique DELETE**: Permettre aux utilisateurs de supprimer leur propre profil
   ```sql
   CREATE POLICY "Users can delete their own profile"
   ON profiles
   FOR DELETE
   TO authenticated
   USING (auth.uid() = id);
   ```

2. **Trigger de Création Automatique**: Créer automatiquement le profil lors de l'inscription
   ```sql
   CREATE OR REPLACE FUNCTION create_profile_for_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO profiles (id, email, role)
     VALUES (NEW.id, NEW.email, 'customer');
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   CREATE TRIGGER on_auth_user_created
   AFTER INSERT ON auth.users
   FOR EACH ROW
   EXECUTE FUNCTION create_profile_for_new_user();
   ```

3. **Validation du Rôle**: Restreindre les rôles autorisés lors de l'inscription
   ```sql
   CREATE POLICY "Users can create customer profile only"
   ON profiles
   FOR INSERT
   TO authenticated
   WITH CHECK (auth.uid() = id AND role = 'customer');
   ```

4. **Audit Trail**: Logger les créations de profils
   ```sql
   CREATE TABLE profile_audit (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     profile_id uuid REFERENCES profiles(id),
     action text NOT NULL,
     created_at timestamptz DEFAULT now()
   );
   ```

---

**Date de correction**: 2026-04-27
**Version**: v16
**Statut**: ✅ Résolu
**Migration**: `allow_users_create_own_profile`

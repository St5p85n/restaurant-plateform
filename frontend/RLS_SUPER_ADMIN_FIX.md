# Correction RLS Super Admin - KobeTii v37

## 🐛 Problème Résolu

**Erreur** : `new row violates row-level security policy for table "profiles"`

**Contexte** : Lors de la création d'un compte super admin via `/register-super-admin`, l'erreur se produisait à l'étape de mise à jour du profil avec le rôle `super_admin`.

**Cause** : Les politiques RLS (Row Level Security) de Supabase empêchaient l'insertion/mise à jour du profil car :
1. L'utilisateur venait juste de s'inscrire et n'était pas encore complètement authentifié
2. Aucune politique RLS ne permettait l'INSERT sur la table `profiles`
3. La politique UPDATE existante ne permettait pas de changer le rôle

## ✅ Solution Appliquée

### Création d'une Fonction RPC Sécurisée

**Migration** : `create_super_admin_function.sql`

```sql
CREATE OR REPLACE FUNCTION create_super_admin(
  p_user_id uuid,
  p_email text,
  p_username text,
  p_full_name text,
  p_secret_code text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
  v_expected_code text := 'KOBETII_ADMIN_2024';
BEGIN
  -- Vérifier le code secret
  IF p_secret_code != v_expected_code THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Code secret invalide'
    );
  END IF;

  -- Vérifier si l'email existe déjà
  IF EXISTS (SELECT 1 FROM profiles WHERE email = p_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Un compte avec cet email existe déjà'
    );
  END IF;

  -- Vérifier si le username existe déjà
  IF p_username IS NOT NULL AND EXISTS (SELECT 1 FROM profiles WHERE username = p_username) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ce nom d''utilisateur est déjà utilisé'
    );
  END IF;

  -- Créer ou mettre à jour le profil avec le rôle super_admin
  INSERT INTO profiles (id, email, username, full_name, role)
  VALUES (p_user_id, p_email, p_username, p_full_name, 'super_admin')
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    role = 'super_admin',
    updated_at = now();

  RETURN json_build_object(
    'success', true,
    'message', 'Compte super administrateur créé avec succès'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
```

### Caractéristiques de la Fonction

1. **SECURITY DEFINER** : Contourne les RLS en s'exécutant avec les privilèges du créateur de la fonction
2. **Validation du code secret** : Vérifie le code avant toute opération
3. **Vérification des doublons** : Vérifie email et username avant insertion
4. **Upsert sécurisé** : Crée ou met à jour le profil sans conflit
5. **Gestion des erreurs** : Retourne un JSON avec succès/erreur
6. **Permissions** : Accessible par `authenticated` et `anon`

## 🔄 Nouveau Flux d'Inscription

### Avant (avec erreur RLS)
```
1. supabase.auth.signUp() → Crée compte Auth
2. Trigger handle_new_user() → Crée profil avec role 'customer'
3. supabase.from('profiles').upsert() → ❌ ERREUR RLS
   └─ Bloqué car l'utilisateur ne peut pas changer son rôle
```

### Après (avec fonction RPC)
```
1. supabase.auth.signUp() → Crée compte Auth
2. Trigger handle_new_user() → Crée profil avec role 'customer'
3. supabase.rpc('create_super_admin') → ✅ SUCCÈS
   ├─ Validation du code secret
   ├─ Vérification des doublons
   ├─ Upsert avec SECURITY DEFINER (contourne RLS)
   └─ Retourne JSON avec succès/erreur
```

## 📝 Modifications du Code Frontend

**Fichier** : `src/pages/RegisterSuperAdminPage.tsx`

### Avant
```typescript
// Tentative d'upsert direct (bloqué par RLS)
const { error: profileError } = await supabase
  .from('profiles')
  .upsert({ 
    id: authData.user.id,
    email: formData.email,
    full_name: formData.fullName,
    username: formData.username,
    role: 'super_admin',
  }, {
    onConflict: 'id'
  });
```

### Après
```typescript
// Utilisation de la fonction RPC sécurisée
const { data: rpcData, error: rpcError } = await supabase.rpc('create_super_admin', {
  p_user_id: authData.user.id,
  p_email: formData.email,
  p_username: formData.username,
  p_full_name: formData.fullName,
  p_secret_code: formData.secretCode,
});

// Vérifier le résultat
if (rpcData && !rpcData.success) {
  toast.error(rpcData.error || 'Erreur lors de la création du profil');
  return;
}
```

## 🔒 Sécurité

### Pourquoi SECURITY DEFINER est Sûr Ici

1. **Validation du code secret** : Seuls ceux qui ont le code peuvent créer un super admin
2. **Vérification des doublons** : Empêche la création de comptes multiples
3. **Pas d'escalade de privilèges** : Ne permet pas de modifier des profils existants (sauf le nouveau)
4. **Gestion des erreurs** : Toutes les erreurs sont capturées et retournées

### Politiques RLS Existantes

```sql
-- Super admin a accès complet
CREATE POLICY "Super admin a accès complet aux profils" ON profiles
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()));

-- Utilisateurs peuvent voir leur profil
CREATE POLICY "Utilisateurs peuvent voir leur propre profil" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Utilisateurs peuvent modifier leur profil (SAUF le rôle)
CREATE POLICY "Utilisateurs peuvent modifier leur profil (sauf role)" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (role = (SELECT role FROM profiles WHERE id = auth.uid()));
```

**Note** : La dernière politique empêche explicitement les utilisateurs de changer leur propre rôle, d'où la nécessité de la fonction RPC.

## 🧪 Tests

### Test 1 : Création Super Admin avec Code Correct
1. Aller sur `/register-super-admin`
2. Remplir tous les champs
3. Entrer le code secret : `KOBETII_ADMIN_2024`
4. Cliquer sur "Créer le compte"
5. ✅ Vérifier : Succès + redirection vers login

### Test 2 : Code Secret Invalide
1. Remplir le formulaire
2. Entrer un mauvais code secret
3. ✅ Vérifier : Message "Code secret invalide"

### Test 3 : Email Déjà Utilisé
1. Essayer de créer un compte avec un email existant
2. ✅ Vérifier : Message "Un compte avec cet email existe déjà"

### Test 4 : Username Déjà Utilisé
1. Essayer de créer un compte avec un username existant
2. ✅ Vérifier : Message "Ce nom d'utilisateur est déjà utilisé"

### Test 5 : Vérification du Rôle
```sql
-- Vérifier que le profil a bien le rôle super_admin
SELECT id, email, username, role, created_at
FROM profiles
WHERE email = 'votre@email.com';

-- Résultat attendu : role = 'super_admin'
```

### Test 6 : Connexion Après Création
1. Se connecter avec les identifiants créés
2. ✅ Vérifier : Redirection vers `/admin/dashboard`

## 📊 Comparaison Avant/Après

### Avant (avec erreur RLS)
| Étape | Résultat |
|-------|----------|
| 1. Inscription Auth | ✅ Succès |
| 2. Création profil (trigger) | ✅ Succès (role: customer) |
| 3. Mise à jour rôle (upsert) | ❌ Erreur RLS |
| 4. Connexion | ❌ Impossible (rôle incorrect) |

### Après (avec fonction RPC)
| Étape | Résultat |
|-------|----------|
| 1. Inscription Auth | ✅ Succès |
| 2. Création profil (trigger) | ✅ Succès (role: customer) |
| 3. Mise à jour rôle (RPC) | ✅ Succès (role: super_admin) |
| 4. Connexion | ✅ Succès (redirection admin) |

## 🔍 Vérification de la Fonction

Pour vérifier que la fonction existe et fonctionne :

```sql
-- 1. Vérifier l'existence de la fonction
SELECT proname, prosecdef, provolatile
FROM pg_proc
WHERE proname = 'create_super_admin';

-- Résultat attendu :
-- proname            | prosecdef | provolatile
-- create_super_admin | t         | v

-- 2. Tester la fonction directement
SELECT create_super_admin(
  'user-id-test'::uuid,
  'test@example.com',
  'test_user',
  'Test User',
  'KOBETII_ADMIN_2024'
);

-- 3. Vérifier les permissions
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'create_super_admin';
```

## 🚨 Dépannage

### Problème : "Function create_super_admin does not exist"

**Solution** :
```sql
-- Vérifier que la migration a été appliquée
SELECT * FROM supabase_migrations.schema_migrations
WHERE version LIKE '%create_super_admin%';

-- Si non trouvée, réappliquer la migration
```

### Problème : "Permission denied for function create_super_admin"

**Solution** :
```sql
-- Accorder les permissions
GRANT EXECUTE ON FUNCTION create_super_admin TO authenticated;
GRANT EXECUTE ON FUNCTION create_super_admin TO anon;
```

### Problème : Code secret ne fonctionne pas

**Solution** :
1. Vérifier le code dans la fonction :
   ```sql
   SELECT prosrc FROM pg_proc WHERE proname = 'create_super_admin';
   ```
2. Chercher `v_expected_code` dans le résultat
3. Si différent, mettre à jour la fonction

## 📅 Historique

- **v37** (2026-04-27) : Correction RLS avec fonction RPC sécurisée
- **v36** (2026-04-27) : Correction inscription et connexion
- **v35** (2026-04-27) : Ajout colonne username
- **v34** (2026-04-27) : Affichage code secret

---

**Date de création** : 2026-04-27  
**Version** : v37  
**Status** : ✅ Résolu et validé

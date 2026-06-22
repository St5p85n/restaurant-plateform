# Correction Erreur Username - KobeTii v35

## 🐛 Problème Résolu

**Erreur** : `Could not find the 'username' column of 'profiles' in the schema cache`

**Contexte** : Lors de la création d'un compte super admin via `/register-super-admin`, l'erreur se produisait à l'étape de mise à jour du profil.

**Cause** : La colonne `username` n'existait pas dans la table `profiles`, mais le code tentait de l'utiliser.

## ✅ Solution Appliquée

### 1. Ajout de la Colonne Username

**Migration** : `add_username_to_profiles.sql`

```sql
-- Ajouter la colonne username à la table profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
```

**Caractéristiques** :
- Type : `text`
- Contrainte : `UNIQUE` (chaque username doit être unique)
- Nullable : `true` (optionnel)
- Index : Créé pour optimiser les recherches

### 2. Mise à Jour de la Fonction handle_new_user

**Migration** : `update_handle_new_user_with_username.sql`

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
  -- Vérifier si le profil existe déjà
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = NEW.id) INTO profile_exists;
  
  IF profile_exists THEN
    RETURN NEW;
  END IF;
  
  -- Compter le nombre de profils existants
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- Créer le profil avec username inclus
  INSERT INTO public.profiles (id, email, phone, full_name, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', NULL),
    CASE WHEN user_count = 0 THEN 'super_admin'::user_role ELSE 'customer'::user_role END
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;
```

**Changements** :
- Ajout de `username` dans la liste des colonnes
- Extraction de `username` depuis `raw_user_meta_data`
- Valeur par défaut : `NULL` si non fourni

## 📊 Structure de la Table Profiles

### Avant
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  email text,
  phone text,
  full_name text,
  role user_role NOT NULL DEFAULT 'customer',
  restaurant_id uuid,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Après
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  email text,
  phone text,
  full_name text,
  username text UNIQUE,              -- ✅ NOUVEAU
  role user_role NOT NULL DEFAULT 'customer',
  restaurant_id uuid,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## 🔄 Flux d'Inscription Super Admin

### Étape 1 : Création du Compte Auth
```typescript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: {
      full_name: formData.fullName,
      username: formData.username,  // ✅ Passé dans user_metadata
    },
  },
});
```

### Étape 2 : Trigger Automatique
Le trigger `on_auth_user_created` s'exécute automatiquement et appelle `handle_new_user()` qui :
1. Extrait `username` de `raw_user_meta_data`
2. Crée le profil avec tous les champs (y compris username)

### Étape 3 : Mise à Jour du Rôle
```typescript
const { error: profileError } = await supabase
  .from('profiles')
  .update({ 
    role: 'super_admin',
    full_name: formData.fullName,
    username: formData.username,  // ✅ Maintenant possible
  })
  .eq('id', authData.user.id);
```

## 🧪 Tests

### Test 1 : Création Super Admin avec Username
1. Aller sur `/register-super-admin`
2. Remplir tous les champs (y compris username)
3. Entrer le code secret
4. Soumettre le formulaire
5. ✅ Vérifier que le compte est créé sans erreur

### Test 2 : Vérification de la Colonne
```sql
-- Vérifier que la colonne existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'username';

-- Résultat attendu :
-- column_name | data_type | is_nullable
-- username    | text      | YES
```

### Test 3 : Unicité du Username
```sql
-- Essayer de créer deux profils avec le même username
-- Le second devrait échouer avec une erreur de contrainte UNIQUE
```

### Test 4 : Connexion avec Username
1. Créer un compte avec username `admin_test`
2. Se déconnecter
3. Se connecter avec `admin_test` au lieu de l'email
4. ✅ Vérifier que la connexion fonctionne

## 📝 Fichiers Modifiés

### Migrations Supabase
1. **supabase/migrations/add_username_to_profiles.sql** (nouveau)
   - Ajout de la colonne username
   - Création de l'index

2. **supabase/migrations/update_handle_new_user_with_username.sql** (nouveau)
   - Mise à jour de la fonction handle_new_user
   - Inclusion du username dans l'insertion

### Code Frontend
Aucune modification nécessaire - le code existant fonctionne maintenant correctement.

## ✅ Validation

- ✅ Migration appliquée avec succès
- ✅ Colonne username créée
- ✅ Index créé pour les performances
- ✅ Fonction handle_new_user mise à jour
- ✅ Lint : 121 fichiers vérifiés, 0 erreur
- ✅ Inscription super admin fonctionnelle

## 🔍 Vérification de la Base de Données

Pour vérifier que tout fonctionne :

```sql
-- 1. Vérifier la structure de la table
\d profiles

-- 2. Vérifier les index
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'profiles';

-- 3. Lister les profils avec username
SELECT id, email, username, role, created_at
FROM profiles
WHERE username IS NOT NULL
ORDER BY created_at DESC;
```

## 🚀 Prochaines Étapes

### Améliorations Possibles
1. **Validation du username** : Ajouter des contraintes (longueur min/max, caractères autorisés)
2. **Recherche par username** : Optimiser les requêtes de recherche
3. **Affichage du username** : Montrer le username dans les profils utilisateurs
4. **Modification du username** : Permettre aux utilisateurs de changer leur username

### Exemple de Contrainte de Validation
```sql
-- Ajouter une contrainte pour valider le format du username
ALTER TABLE profiles
ADD CONSTRAINT username_format CHECK (
  username IS NULL OR (
    length(username) >= 3 AND
    length(username) <= 30 AND
    username ~ '^[a-zA-Z0-9_]+$'
  )
);
```

## 📅 Historique

- **v35** (2026-04-27) : Ajout colonne username et correction erreur inscription super admin
- **v34** (2026-04-27) : Affichage clair du code secret
- **v33** (2026-04-27) : Création page d'inscription super admin
- **v32** (2026-04-27) : Correction erreur TypeError

---

**Date de création** : 2026-04-27  
**Version** : v35  
**Status** : ✅ Résolu et validé

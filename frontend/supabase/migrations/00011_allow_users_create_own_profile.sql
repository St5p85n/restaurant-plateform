-- Permettre aux utilisateurs authentifiés de créer leur propre profil lors de l'inscription
CREATE POLICY "Users can create their own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Commentaire pour documentation
COMMENT ON POLICY "Users can create their own profile" ON profiles IS 
'Permet aux utilisateurs de créer leur propre profil lors de l''inscription. Le profil doit avoir le même ID que l''utilisateur authentifié (auth.uid()).';

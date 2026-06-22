import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/db/supabase';

export default function RegisterSuperAdminPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    secretCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName || !formData.email || !formData.username || !formData.password || !formData.secretCode) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    // Validation du code secret (vous pouvez le changer)
    const SUPER_ADMIN_SECRET = 'KOBETII_ADMIN_2024';
    if (formData.secretCode !== SUPER_ADMIN_SECRET) {
      toast.error('Code secret invalide');
      return;
    }

    setLoading(true);

    try {
      // 1. Créer le compte utilisateur avec flag super_admin
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            username: formData.username,
            is_super_admin: true,  // Flag pour empêcher le trigger de créer un profil customer
          },
        },
      });

      if (authError) {
        // Gérer les erreurs spécifiques
        if (authError.message.includes('already registered')) {
          toast.error('Un compte avec cet email existe déjà');
        } else {
          toast.error(`Erreur lors de la création du compte: ${authError.message}`);
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error('Erreur lors de la création du compte');
        setLoading(false);
        return;
      }

      // 2. Attendre un peu que le compte soit créé
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Utiliser la fonction RPC pour créer le super admin
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_super_admin', {
        p_user_id: authData.user.id,
        p_email: formData.email,
        p_username: formData.username,
        p_full_name: formData.fullName,
        p_secret_code: formData.secretCode,
      });

      if (rpcError) {
        toast.error(`Erreur lors de la création du profil: ${rpcError.message}`);
        setLoading(false);
        return;
      }

      // Vérifier le résultat de la fonction RPC
      if (rpcData && !rpcData.success) {
        toast.error(rpcData.error || 'Erreur lors de la création du profil');
        setLoading(false);
        return;
      }

      // 4. Se déconnecter automatiquement pour forcer une nouvelle connexion
      await supabase.auth.signOut();

      toast.success('Compte super administrateur créé avec succès!');
      toast.info('Veuillez vous connecter avec vos identifiants');
      
      // Rediriger vers la page de login après 2 secondes
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/10 to-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Super Administrateur</h1>
          <p className="text-muted-foreground">Créer un compte administrateur KobeTii</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inscription Super Admin</CardTitle>
            <CardDescription>
              Créez un compte avec des privilèges d'administration complets
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Diop Moussa"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@kobetii.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="admin_kobetii"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum 8 caractères
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretCode">Code secret</Label>
                <Input
                  id="secretCode"
                  name="secretCode"
                  type="password"
                  placeholder="Code d'accès administrateur"
                  value={formData.secretCode}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-xs font-medium text-primary mb-1">
                    💡 Code secret par défaut :
                  </p>
                  <code className="text-sm font-mono font-bold text-primary">
                    KOBETII_ADMIN_2024
                  </code>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Création en cours...' : 'Créer le compte'}
              </Button>
              <div className="flex items-center justify-between w-full text-sm">
                <Link
                  to="/login"
                  className="text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour à la connexion
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            ⚠️ Cette page est réservée à la création de comptes super administrateurs.
          </p>
          <p className="text-xs text-center">
            <span className="text-muted-foreground">Code secret : </span>
            <code className="font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded">
              KOBETII_ADMIN_2024
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}

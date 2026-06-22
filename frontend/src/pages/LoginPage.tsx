import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { UtensilsCrossed } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithUsername } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from || '/';

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    const { error } = await signInWithUsername(username, password);
    setLoading(false);

    if (error) {
      toast.error(`Erreur de connexion: ${error.message}`);
    } else {
      toast.success('Connexion réussie');
      // Le RouteGuard va gérer la redirection automatique
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/10 to-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <UtensilsCrossed className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">KobeTii</h1>
          <p className="text-muted-foreground">Gestion complète de restaurants</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Connexion</TabsTrigger>
            <TabsTrigger value="signup">Inscription</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Se connecter</CardTitle>
                <CardDescription>
                  Accédez à votre espace (personnel restaurant ou client)
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-username">Nom d'utilisateur ou Email</Label>
                    <Input
                      id="signin-username"
                      type="text"
                      placeholder="votre_nom ou email@exemple.com"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Mot de passe</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="flex items-center justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      Mot de passe oublié?
                    </Link>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Connexion...' : 'Se connecter'}
                  </Button>
                  <div className="text-sm text-center space-y-2">
                    <p className="text-muted-foreground">
                      Pas encore de compte?
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button asChild variant="outline" size="sm">
                        <Link to="/register-client">
                          Inscription Client
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link to="/register-restaurant">
                          Inscription Restaurant
                        </Link>
                      </Button>
                    </div>
                    <div className="pt-3 border-t border-border mt-4">
                      <Link
                        to="/register-super-admin"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1"
                      >
                        <span>🔐</span>
                        Espace Super Administrateur
                      </Link>
                    </div>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Créer un compte</CardTitle>
                <CardDescription>
                  Choisissez votre type de compte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/register-client')}>
                    <CardHeader>
                      <CardTitle className="text-lg">Compte Client</CardTitle>
                      <CardDescription>
                        Pour commander et suivre vos livraisons
                      </CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link to="/register-client">
                          S'inscrire comme Client
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/register-restaurant')}>
                    <CardHeader>
                      <CardTitle className="text-lg">Compte Restaurant</CardTitle>
                      <CardDescription>
                        Pour gérer votre restaurant et vos commandes
                      </CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link to="/register-restaurant">
                          S'inscrire comme Restaurant
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


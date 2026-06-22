import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <ShieldAlert className="h-16 w-16 text-destructive" />
          </div>
        </div>

        <h1 className="mb-4 text-4xl font-bold">403</h1>
        <h2 className="mb-4 text-2xl font-semibold">Accès Refusé</h2>
        <p className="mb-8 text-muted-foreground">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          Veuillez contacter un administrateur si vous pensez qu'il s'agit d'une erreur.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="default">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Link>
          </Button>
          <Button asChild variant="outline" onClick={() => window.history.back()}>
            <span className="cursor-pointer">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Page précédente
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

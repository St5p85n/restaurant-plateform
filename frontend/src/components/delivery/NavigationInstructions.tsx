import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown,
  Navigation,
  MapPin,
  RotateCw,
} from 'lucide-react';
import type { NavigationInstruction } from '@/types';

interface NavigationInstructionsProps {
  instructions: NavigationInstruction[];
  currentStepIndex?: number;
  showAll?: boolean;
}

export default function NavigationInstructions({
  instructions,
  currentStepIndex = 0,
  showAll = false,
}: NavigationInstructionsProps) {
  if (!instructions || instructions.length === 0) {
    return null;
  }

  // Obtenir l'icône selon le type d'instruction
  const getInstructionIcon = (type: number) => {
    // Types OpenRouteService:
    // 0: Tourner à gauche
    // 1: Tourner à droite
    // 2: Tourner légèrement à gauche
    // 3: Tourner légèrement à droite
    // 4: Continuer tout droit
    // 5: Entrer dans un rond-point
    // 6: Sortir du rond-point
    // 7: Faire demi-tour
    // 10: Arrivée
    // 11: Départ

    switch (type) {
      case 0:
      case 2:
        return <ArrowLeft className="w-5 h-5" />;
      case 1:
      case 3:
        return <ArrowRight className="w-5 h-5" />;
      case 4:
        return <ArrowUp className="w-5 h-5" />;
      case 7:
        return <ArrowDown className="w-5 h-5" />;
      case 5:
      case 6:
        return <RotateCw className="w-5 h-5" />;
      case 10:
        return <MapPin className="w-5 h-5" />;
      case 11:
        return <Navigation className="w-5 h-5" />;
      default:
        return <ArrowUp className="w-5 h-5" />;
    }
  };

  // Formater la distance
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Afficher seulement les prochaines instructions si showAll est false
  const displayedInstructions = showAll
    ? instructions
    : instructions.slice(currentStepIndex, currentStepIndex + 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          Instructions de navigation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayedInstructions.map((instruction, index) => {
            const actualIndex = showAll ? index : currentStepIndex + index;
            const isCurrent = actualIndex === currentStepIndex;

            return (
              <div
                key={actualIndex}
                className={`flex items-start gap-4 p-3 rounded-lg transition-colors ${
                  isCurrent
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-muted border border-border'
                }`}
              >
                {/* Icône */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground'
                  }`}
                >
                  {getInstructionIcon(instruction.type)}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium ${
                      isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {instruction.instruction}
                  </p>
                  {instruction.name && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {instruction.name}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{formatDistance(instruction.distance)}</span>
                    {instruction.exit_number && (
                      <span>Sortie {instruction.exit_number}</span>
                    )}
                  </div>
                </div>

                {/* Numéro de l'étape */}
                {showAll && (
                  <div className="text-sm font-medium text-muted-foreground shrink-0">
                    {actualIndex + 1}/{instructions.length}
                  </div>
                )}
              </div>
            );
          })}

          {/* Indicateur s'il y a plus d'instructions */}
          {!showAll && instructions.length > currentStepIndex + 3 && (
            <div className="text-center text-sm text-muted-foreground pt-2">
              + {instructions.length - currentStepIndex - 3} autres instructions
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

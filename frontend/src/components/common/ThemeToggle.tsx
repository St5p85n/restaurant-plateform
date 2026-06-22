import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, Sparkles, Check } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    {
      value: 'light' as const,
      label: 'Clair',
      icon: Sun,
      description: 'Thème lumineux et aéré',
    },
    {
      value: 'dark' as const,
      label: 'Sombre',
      icon: Moon,
      description: 'Thème sombre classique',
    },
    {
      value: 'dark-modern' as const,
      label: 'Sombre Moderne',
      icon: Sparkles,
      description: 'Thème sombre avec accents modernes',
    },
  ];

  const currentTheme = themes.find((t) => t.value === theme);
  const CurrentIcon = currentTheme?.icon || Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <CurrentIcon className="w-5 h-5" />
          <span className="sr-only">Changer de thème</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Apparence</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.value;
          
          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-3 w-full">
                <Icon className="w-4 h-4" />
                <div className="flex-1">
                  <div className="font-medium">{themeOption.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {themeOption.description}
                  </div>
                </div>
                {isActive && <Check className="w-4 h-4 text-primary" />}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

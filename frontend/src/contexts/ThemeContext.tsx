import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'dark-modern';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Récupérer le thème depuis localStorage ou utiliser 'light' par défaut
    const savedTheme = localStorage.getItem('kobetii-theme') as Theme;
    return savedTheme || 'light';
  });

  useEffect(() => {
    // Appliquer le thème au document
    const root = document.documentElement;
    
    // Retirer toutes les classes de thème
    root.classList.remove('light', 'dark', 'dark-modern');
    
    // Ajouter la classe du thème actuel
    root.classList.add(theme);
    
    // Sauvegarder dans localStorage
    localStorage.setItem('kobetii-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

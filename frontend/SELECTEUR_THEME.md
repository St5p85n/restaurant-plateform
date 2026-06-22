# Sélecteur de Thème avec Thème Sombre Moderne - KobeTii

## 🎯 Fonctionnalité Ajoutée

**Besoin:** Permettre aux utilisateurs de l'espace restaurant de choisir entre 3 thèmes d'apparence pour personnaliser leur expérience.

**Solution:** Système complet de gestion de thèmes avec 3 options :
1. **Thème Clair** - Design lumineux et aéré (existant)
2. **Thème Sombre** - Thème sombre classique (existant)
3. **Thème Sombre Moderne** - Nouveau thème sombre avec accents bleus modernes

---

## 📄 Nouveaux Fichiers

### 1. ThemeContext.tsx

**Emplacement:** `src/contexts/ThemeContext.tsx`

**Fonctionnalités:**

#### Context React pour la Gestion des Thèmes
- ✅ Type `Theme`: `'light' | 'dark' | 'dark-modern'`
- ✅ État `theme`: Thème actuel
- ✅ Fonction `setTheme`: Changer de thème
- ✅ Persistance dans `localStorage` (clé: `kobetii-theme`)
- ✅ Application automatique au `document.documentElement`
- ✅ Thème par défaut: `light`

**Code clé:**

```typescript
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
```

**Hook personnalisé:**

```typescript
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

**Utilisation:**
- Envelopper l'application avec `<ThemeProvider>`
- Utiliser `const { theme, setTheme } = useTheme()` dans les composants

### 2. ThemeToggle.tsx

**Emplacement:** `src/components/common/ThemeToggle.tsx`

**Fonctionnalités:**

#### Dropdown Menu pour Sélectionner le Thème
- ✅ Bouton avec icône du thème actuel
- ✅ Dropdown avec 3 options
- ✅ Icônes distinctes pour chaque thème:
  - **Sun** (Soleil) - Thème Clair
  - **Moon** (Lune) - Thème Sombre
  - **Sparkles** (Étincelles) - Thème Sombre Moderne
- ✅ Descriptions pour chaque thème
- ✅ Icône Check pour le thème actif
- ✅ Design minimal et épuré

**Structure du Dropdown:**

```typescript
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
```

**Rendu:**
- Bouton: `variant="ghost"`, `size="icon"`
- Dropdown: Aligné à droite (`align="end"`)
- Largeur: `w-56`
- Label: "Apparence"
- Items: Icône + Label + Description + Check (si actif)

**Code clé:**

```typescript
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
```

---

## 🎨 Thème Sombre Moderne (dark-modern)

### Palette de Couleurs

**Philosophie:**
- Noir profond avec teinte bleue moderne
- Accents bleus électriques
- Contraste élevé pour la lisibilité
- Design moderne et élégant
- Adapté aux longues sessions de travail

### Couleurs Principales

#### Arrière-plans
```css
--background: 222 47% 6%;        /* Noir profond avec teinte bleue */
--foreground: 210 40% 98%;       /* Blanc cassé pour le texte */
```

#### Primary (Bleu Électrique)
```css
--primary: 217 91% 60%;          /* Bleu électrique moderne */
--primary-foreground: 222 47% 11%; /* Texte sur primary */
```

#### Secondary (Gris Bleuté)
```css
--secondary: 217 33% 17%;        /* Gris bleuté foncé */
--secondary-foreground: 210 40% 98%; /* Texte sur secondary */
```

#### Cartes et Surfaces
```css
--card: 222 47% 11%;             /* Gris très foncé avec teinte bleue */
--card-foreground: 210 40% 98%; /* Texte sur cartes */
```

#### Accent
```css
--accent: 217 33% 17%;           /* Bleu foncé avec luminosité */
--accent-foreground: 217 91% 60%; /* Bleu électrique */
```

#### Muted
```css
--muted: 217 33% 17%;            /* Gris bleuté moyen */
--muted-foreground: 215 20% 65%; /* Texte atténué */
```

#### Bordures
```css
--border: 217 33% 17%;           /* Gris bleuté subtil */
--input: 217 33% 17%;            /* Bordure des inputs */
--ring: 217 91% 60%;             /* Focus ring bleu */
```

#### États
```css
--destructive: 0 84% 60%;        /* Rouge moderne */
--success: 160 84% 39%;          /* Vert émeraude moderne */
--warning: 38 92% 50%;           /* Ambre moderne */
--info: 199 89% 48%;             /* Cyan moderne */
```

#### Sidebar
```css
--sidebar-background: 222 47% 8%;    /* Noir profond */
--sidebar-foreground: 210 40% 98%;   /* Texte blanc */
--sidebar-primary: 217 91% 60%;      /* Bleu électrique */
--sidebar-accent: 217 33% 17%;       /* Gris bleuté */
--sidebar-border: 217 33% 17%;       /* Bordure subtile */
```

#### Charts
```css
--chart-1: 217 91% 60%;          /* Bleu électrique */
--chart-2: 160 84% 39%;          /* Vert émeraude */
--chart-3: 199 89% 48%;          /* Cyan */
--chart-4: 271 81% 56%;          /* Violet */
--chart-5: 38 92% 50%;           /* Ambre */
```

### Comparaison des Thèmes

| Élément | Clair | Sombre | Sombre Moderne |
|---------|-------|--------|----------------|
| **Background** | Blanc pur | Gris très foncé | Noir bleuté |
| **Primary** | Orange vif | Orange vif | Bleu électrique |
| **Accent** | Orange clair | Orange foncé | Bleu foncé |
| **Ambiance** | Énergique | Classique | Moderne & Tech |
| **Contraste** | Élevé | Moyen | Élevé |
| **Fatigue oculaire** | Moyenne | Faible | Très faible |

### Avantages du Thème Sombre Moderne

**Pour les utilisateurs:**
- ✅ Réduit la fatigue oculaire lors de longues sessions
- ✅ Design moderne et professionnel
- ✅ Accents bleus apaisants
- ✅ Contraste élevé pour la lisibilité
- ✅ Adapté aux environnements peu éclairés

**Pour l'application:**
- ✅ Se démarque des thèmes classiques
- ✅ Image moderne et technologique
- ✅ Palette cohérente et harmonieuse
- ✅ Adapté aux dashboards et interfaces de gestion

---

## 🔧 Modifications des Fichiers Existants

### 1. App.tsx (Modifié)

**Ajout:** Envelopper l'application avec `ThemeProvider`

**Avant:**
```tsx
<Router>
  <AuthProvider>
    <CartProvider>
      {/* ... */}
    </CartProvider>
  </AuthProvider>
</Router>
```

**Après:**
```tsx
<Router>
  <ThemeProvider>
    <AuthProvider>
      <CartProvider>
        {/* ... */}
      </CartProvider>
    </AuthProvider>
  </ThemeProvider>
</Router>
```

**Position:** Le `ThemeProvider` enveloppe tous les autres providers pour que le thème soit disponible partout.

### 2. RestaurantLayout.tsx (Modifié)

**Ajout:** Sélecteur de thème dans le footer de la sidebar

**Emplacement:** Dans le footer, avant les boutons "Paramètres" et "Déconnexion"

**Code ajouté:**

```tsx
<div className="flex items-center justify-between mb-2">
  <span className="text-xs font-medium text-muted-foreground">Apparence</span>
  <ThemeToggle />
</div>
```

**Design:**
- Label "Apparence" à gauche
- Bouton ThemeToggle à droite
- Espacement: `mb-2` pour séparer des autres boutons
- Taille de texte: `text-xs`
- Couleur: `text-muted-foreground`

### 3. index.css (Modifié)

**Ajout:** Définition complète du thème `dark-modern`

**Structure:**
```css
@layer base {
  :root {
    /* Thème clair (existant) */
  }

  .dark {
    /* Thème sombre (existant) */
  }

  .dark-modern {
    /* Nouveau thème sombre moderne */
    /* 70+ lignes de variables CSS */
  }
}
```

**Variables ajoutées:** 70+ variables CSS pour le thème dark-modern

---

## 🔄 Flux Utilisateur

### Changement de Thème

**Étape 1: Accéder au sélecteur**
1. Utilisateur se connecte à l'espace restaurant
2. Voit la sidebar avec navigation
3. Scroll vers le bas de la sidebar
4. Voit la section "Apparence" avec un bouton d'icône

**Étape 2: Ouvrir le dropdown**
1. Clique sur le bouton d'icône (Sun, Moon, ou Sparkles)
2. Dropdown s'ouvre avec 3 options
3. Voit le thème actuel avec une icône Check

**Étape 3: Sélectionner un thème**
1. Clique sur une option (ex: "Sombre Moderne")
2. Dropdown se ferme
3. ✅ Thème appliqué instantanément
4. ✅ Icône du bouton change (Sparkles)
5. ✅ Toute l'interface change de couleurs
6. ✅ Thème sauvegardé dans localStorage

**Étape 4: Persistance**
1. Utilisateur ferme le navigateur
2. Rouvre l'application
3. ✅ Thème précédemment sélectionné est restauré
4. Pas besoin de resélectionner

### Expérience Visuelle

**Thème Clair → Sombre Moderne:**
1. Background: Blanc → Noir bleuté
2. Cartes: Blanc → Gris foncé bleuté
3. Texte: Noir → Blanc cassé
4. Primary: Orange → Bleu électrique
5. Sidebar: Gris clair → Noir profond
6. Accents: Orange → Bleu

**Transition:**
- ✅ Instantanée (pas d'animation)
- ✅ Tous les composants changent en même temps
- ✅ Pas de flash ou de scintillement
- ✅ Cohérence visuelle maintenue

---

## 🧪 Tests Recommandés

### Test 1: Changement de Thème

**Objectif:** Vérifier que les 3 thèmes fonctionnent

**Étapes:**
1. Se connecter à l'espace restaurant
2. Aller dans la sidebar
3. Cliquer sur le bouton de thème
4. ✅ Vérifier que le dropdown s'ouvre
5. ✅ Vérifier que 3 options sont affichées
6. Sélectionner "Sombre"
7. ✅ Vérifier que le thème change
8. ✅ Vérifier que l'icône devient Moon
9. Sélectionner "Sombre Moderne"
10. ✅ Vérifier que le thème change
11. ✅ Vérifier que l'icône devient Sparkles
12. ✅ Vérifier les couleurs bleues
13. Sélectionner "Clair"
14. ✅ Vérifier le retour au thème clair

### Test 2: Persistance du Thème

**Objectif:** Vérifier que le thème est sauvegardé

**Étapes:**
1. Se connecter à l'espace restaurant
2. Sélectionner "Sombre Moderne"
3. ✅ Vérifier que le thème est appliqué
4. Fermer le navigateur
5. Rouvrir le navigateur
6. Se reconnecter
7. ✅ Vérifier que le thème "Sombre Moderne" est toujours actif
8. ✅ Vérifier que l'icône est Sparkles

### Test 3: Thème sur Différentes Pages

**Objectif:** Vérifier que le thème s'applique partout

**Étapes:**
1. Sélectionner "Sombre Moderne"
2. Naviguer vers "Dashboard"
3. ✅ Vérifier que le thème est appliqué
4. Naviguer vers "Réservations"
5. ✅ Vérifier que le thème est appliqué
6. Naviguer vers "Menu"
7. ✅ Vérifier que le thème est appliqué
8. Naviguer vers "Stock"
9. ✅ Vérifier que le thème est appliqué
10. ✅ Vérifier la cohérence visuelle sur toutes les pages

### Test 4: Contraste et Lisibilité

**Objectif:** Vérifier que le texte est lisible dans tous les thèmes

**Étapes:**
1. Sélectionner "Clair"
2. ✅ Vérifier que le texte est lisible sur tous les backgrounds
3. ✅ Vérifier les boutons, cartes, inputs
4. Sélectionner "Sombre"
5. ✅ Vérifier que le texte est lisible
6. Sélectionner "Sombre Moderne"
7. ✅ Vérifier que le texte est lisible
8. ✅ Vérifier le contraste des accents bleus
9. ✅ Vérifier les états hover, focus, active

### Test 5: Dropdown UX

**Objectif:** Vérifier l'expérience utilisateur du dropdown

**Étapes:**
1. Cliquer sur le bouton de thème
2. ✅ Vérifier que le dropdown s'ouvre
3. ✅ Vérifier que le thème actuel a une icône Check
4. Hover sur une option
5. ✅ Vérifier l'effet hover
6. Cliquer sur une option
7. ✅ Vérifier que le dropdown se ferme
8. ✅ Vérifier que le thème change
9. Cliquer en dehors du dropdown
10. ✅ Vérifier que le dropdown se ferme

### Test 6: Responsive Design

**Objectif:** Vérifier que le sélecteur fonctionne sur mobile

**Étapes:**
1. Ouvrir sur mobile (< 768px)
2. Ouvrir le menu hamburger
3. Scroll vers le bas
4. ✅ Vérifier que le sélecteur est visible
5. Cliquer sur le bouton de thème
6. ✅ Vérifier que le dropdown s'ouvre
7. Sélectionner un thème
8. ✅ Vérifier que le thème change
9. ✅ Vérifier que le menu se ferme

### Test 7: Accessibilité

**Objectif:** Vérifier l'accessibilité du sélecteur

**Étapes:**
1. Utiliser le clavier uniquement
2. Tab jusqu'au bouton de thème
3. ✅ Vérifier le focus visible
4. Appuyer sur Enter
5. ✅ Vérifier que le dropdown s'ouvre
6. Utiliser les flèches pour naviguer
7. ✅ Vérifier la navigation clavier
8. Appuyer sur Enter sur une option
9. ✅ Vérifier que le thème change
10. ✅ Vérifier le `sr-only` text: "Changer de thème"

### Test 8: Performance

**Objectif:** Vérifier que le changement de thème est rapide

**Étapes:**
1. Ouvrir les DevTools
2. Aller dans l'onglet Performance
3. Commencer l'enregistrement
4. Changer de thème
5. Arrêter l'enregistrement
6. ✅ Vérifier que le changement est instantané (< 100ms)
7. ✅ Vérifier qu'il n'y a pas de reflow majeur
8. ✅ Vérifier qu'il n'y a pas de flash

---

## 📊 Comparaison Avant/Après

### Avant

**Problèmes:**
- ❌ Pas de choix de thème
- ❌ Thème clair uniquement (ou sombre uniquement)
- ❌ Pas d'option moderne
- ❌ Pas de personnalisation
- ❌ Fatigue oculaire pour certains utilisateurs

**Impact:**
- Expérience utilisateur limitée
- Pas d'adaptation aux préférences
- Fatigue oculaire lors de longues sessions
- Design moins moderne

### Après

**Améliorations:**
- ✅ 3 thèmes au choix
- ✅ Thème sombre moderne avec accents bleus
- ✅ Sélecteur accessible et intuitif
- ✅ Persistance du choix
- ✅ Application instantanée
- ✅ Design moderne et professionnel
- ✅ Réduction de la fatigue oculaire

**Impact:**
- Meilleure expérience utilisateur
- Personnalisation selon les préférences
- Confort visuel amélioré
- Image moderne et technologique
- Satisfaction utilisateur accrue

---

## 💡 Recommandations Futures

### 1. Thème Automatique (System)

**Actuellement:** 3 thèmes manuels

**Amélioration:**
- Ajouter une option "Système"
- Détecter le thème du système d'exploitation
- Utiliser `window.matchMedia('(prefers-color-scheme: dark)')`
- Changer automatiquement selon l'heure

**Code:**
```typescript
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
  ? 'dark'
  : 'light';
```

### 2. Personnalisation des Couleurs

**Actuellement:** Palettes prédéfinies

**Amélioration:**
- Permettre de personnaliser les couleurs primary
- Color picker pour choisir sa couleur
- Sauvegarder les préférences
- Prévisualisation en temps réel

### 3. Thèmes Supplémentaires

**Actuellement:** 3 thèmes

**Amélioration:**
- Ajouter un thème "High Contrast" pour l'accessibilité
- Ajouter un thème "Sepia" pour la lecture
- Ajouter un thème "Nord" (palette populaire)
- Ajouter un thème "Dracula" (palette populaire)

### 4. Transition Animée

**Actuellement:** Changement instantané

**Amélioration:**
- Ajouter une transition douce entre les thèmes
- Animation de fade ou de slide
- Durée: 300ms
- Easing: ease-in-out

**Code:**
```css
* {
  transition: background-color 300ms ease-in-out,
              color 300ms ease-in-out,
              border-color 300ms ease-in-out;
}
```

### 5. Thème par Rôle

**Actuellement:** Même thème pour tous les rôles

**Amélioration:**
- Thème par défaut différent selon le rôle
- Propriétaire: Thème clair (professionnel)
- Chef: Thème sombre (cuisine peu éclairée)
- Serveur: Thème moderne (jeune, dynamique)
- Permettre de changer quand même

### 6. Prévisualisation

**Actuellement:** Changement direct

**Amélioration:**
- Ajouter une prévisualisation avant d'appliquer
- Modal avec aperçu du thème
- Bouton "Appliquer" et "Annuler"
- Comparaison côte à côte

### 7. Export/Import de Thème

**Actuellement:** Thèmes prédéfinis uniquement

**Amélioration:**
- Permettre d'exporter un thème personnalisé
- Format JSON avec toutes les variables
- Importer un thème depuis un fichier
- Partager des thèmes entre utilisateurs

---

## 📝 Notes Techniques

### localStorage

**Clé:** `kobetii-theme`

**Valeurs possibles:**
- `"light"`
- `"dark"`
- `"dark-modern"`

**Lecture:**
```typescript
const savedTheme = localStorage.getItem('kobetii-theme') as Theme;
```

**Écriture:**
```typescript
localStorage.setItem('kobetii-theme', theme);
```

### Classes CSS

**Application au document:**
```typescript
document.documentElement.classList.add(theme);
```

**Classes possibles:**
- `.light`
- `.dark`
- `.dark-modern`

**Nettoyage:**
```typescript
document.documentElement.classList.remove('light', 'dark', 'dark-modern');
```

### CSS Variables

**Accès en JavaScript:**
```typescript
const primaryColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--primary');
```

**Modification en JavaScript:**
```typescript
document.documentElement.style.setProperty('--primary', '217 91% 60%');
```

### Tailwind CSS

**Utilisation des variables:**
```tsx
<div className="bg-background text-foreground">
  <div className="bg-card text-card-foreground">
    <button className="bg-primary text-primary-foreground">
      Bouton
    </button>
  </div>
</div>
```

**Classes générées:**
- `bg-background` → `background-color: hsl(var(--background))`
- `text-foreground` → `color: hsl(var(--foreground))`
- `bg-primary` → `background-color: hsl(var(--primary))`

---

## 🎨 Guide de Design

### Quand Utiliser Chaque Thème

#### Thème Clair
**Recommandé pour:**
- Environnements bien éclairés
- Bureaux avec lumière naturelle
- Utilisateurs préférant les interfaces lumineuses
- Impression de documents
- Présentations

**Avantages:**
- Contraste élevé
- Familier pour la plupart des utilisateurs
- Professionnel

#### Thème Sombre
**Recommandé pour:**
- Environnements peu éclairés
- Travail de nuit
- Utilisateurs sensibles à la lumière
- Économie de batterie (écrans OLED)

**Avantages:**
- Réduit la fatigue oculaire
- Classique et élégant
- Consomme moins d'énergie

#### Thème Sombre Moderne
**Recommandé pour:**
- Utilisateurs tech-savvy
- Longues sessions de travail
- Dashboards et interfaces de gestion
- Environnements modernes

**Avantages:**
- Design moderne et professionnel
- Accents bleus apaisants
- Contraste élevé
- Se démarque visuellement

### Cohérence Visuelle

**Règles à suivre:**
- ✅ Toujours utiliser les variables CSS
- ✅ Ne jamais hardcoder les couleurs
- ✅ Tester dans les 3 thèmes
- ✅ Vérifier le contraste (WCAG AA minimum)
- ✅ Utiliser les classes Tailwind sémantiques

**Exemples:**
```tsx
// ✅ CORRECT
<div className="bg-card text-card-foreground">

// ❌ INCORRECT
<div className="bg-white text-black">
```

---

**Date**: 2026-04-27  
**Version**: v24  
**Statut**: ✅ Sélecteur de thème avec thème sombre moderne implémenté avec succès

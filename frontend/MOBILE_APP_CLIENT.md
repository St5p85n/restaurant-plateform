# Application Mobile Client - KobeTii

## 📱 Vue d'Ensemble

Application mobile web responsive (PWA) permettant aux clients de commander des plats depuis leur restaurant préféré, suivre leurs commandes en temps réel, et gérer leur programme de fidélité.

---

## 🎯 Fonctionnalités

### 1. Accueil
- **Liste des restaurants** à proximité avec géolocalisation
- **Recherche** par nom, type de cuisine ou ville
- **Filtrage** des restaurants
- **Calcul de distance** automatique
- **Affichage** : Note, avis, temps de livraison estimé

### 2. Menu Restaurant
- **Navigation** par catégories
- **Affichage** des plats avec photo, prix, description
- **Gestion des allergènes**
- **Ajout au panier** avec quantité
- **Panier flottant** avec total en temps réel
- **Indication** de disponibilité des plats

### 3. Commandes
- **Onglet "En cours"** : Commandes actives
- **Onglet "Historique"** : Commandes passées
- **Statuts** : En attente, En préparation, Prêt, Servi, Payé, Annulé
- **Suivi en temps réel** de la livraison
- **Détails** : Articles, montant, restaurant, date

### 4. Programme de Fidélité
- **Affichage des points** accumulés
- **Niveaux** : Bronze, Argent, Or, Platine
- **Barre de progression** vers le niveau suivant
- **Statistiques** : Visites, montant dépensé
- **Historique** des transactions de points
- **Guide** : Comment gagner des points

### 5. Profil
- **Informations personnelles**
- **Gestion des adresses** de livraison
- **Moyens de paiement**
- **Notifications**
- **Paramètres**
- **Aide et support**
- **Déconnexion**

---

## 🎨 Design Minimal

Conformément au template "Minimal" :

### Espaces Blancs
- Padding généreux : `p-4`, `space-y-4`, `gap-4`
- Marges entre sections : `space-y-6`
- Espacement dans les cartes : `space-y-3`

### Typographie
- Hiérarchie claire : `text-xl`, `text-lg`, `text-base`, `text-sm`, `text-xs`
- Poids variés : `font-semibold`, `font-medium`, `font-normal`
- Couleurs subtiles : `text-muted-foreground`

### Couleurs
- Palette restreinte : primary, muted, background
- Pas de dégradés (sauf carte fidélité)
- Bordures subtiles : `border-border/40`
- Fonds neutres : `bg-muted`

### Interactions
- Transitions douces : `transition-all`
- Feedback tactile : `active:scale-[0.98]`
- États hover : `hover:bg-muted/50`

---

## 📂 Structure des Fichiers

### Layouts
```
src/components/layouts/
└── MobileLayout.tsx          # Layout avec bottom navigation
```

### Composants
```
src/components/mobile/
├── RestaurantCard.tsx        # Carte restaurant
├── MenuItemCard.tsx          # Carte plat
└── OrderCard.tsx             # Carte commande
```

### Pages
```
src/pages/mobile/
├── MobileHomePage.tsx        # Accueil - Liste restaurants
├── MobileRestaurantPage.tsx  # Menu restaurant + panier
├── MobileOrdersPage.tsx      # Commandes (en cours + historique)
├── MobileLoyaltyPage.tsx     # Programme de fidélité
└── MobileProfilePage.tsx     # Profil utilisateur
```

### Configuration PWA
```
public/
└── manifest.json             # Manifest PWA
```

---

## 🚀 Navigation

### Bottom Navigation (4 onglets)

1. **🏠 Accueil** (`/mobile`)
   - Liste des restaurants
   - Recherche et filtres

2. **🛒 Commandes** (`/mobile/orders`)
   - Commandes en cours
   - Historique

3. **🎁 Fidélité** (`/mobile/loyalty`)
   - Points et niveau
   - Historique des transactions

4. **👤 Profil** (`/mobile/profile`)
   - Informations personnelles
   - Paramètres

### Navigation Secondaire

- `/mobile/restaurant/:id` - Menu du restaurant
- `/mobile/cart/:id` - Panier (à créer)
- `/mobile/orders/:id` - Détails commande (à créer)
- `/mobile/profile/*` - Sous-pages profil (à créer)

---

## 🔌 Intégration Backend

### Tables Supabase Utilisées

1. **restaurants** - Liste des restaurants
2. **menu_categories** - Catégories du menu
3. **menu_items** - Plats du menu
4. **orders** - Commandes
5. **order_items** - Articles de commande
6. **customers** - Données client fidélité
7. **loyalty_transactions** - Transactions de points
8. **delivery_addresses** - Adresses de livraison

### Authentification

- Utilise le contexte `AuthContext`
- Routes protégées : Commandes, Fidélité, Profil
- Routes publiques : Accueil, Menu restaurant

---

## 📱 Progressive Web App (PWA)

### Caractéristiques

- **Installable** sur l'écran d'accueil
- **Mode standalone** (plein écran)
- **Icônes** adaptatives 192x192 et 512x512
- **Orientation** portrait
- **Thème** noir (#000000)

### Installation

#### iOS (Safari)
1. Ouvrir `/mobile` dans Safari
2. Appuyer sur le bouton "Partager"
3. Sélectionner "Sur l'écran d'accueil"
4. Confirmer

#### Android (Chrome)
1. Ouvrir `/mobile` dans Chrome
2. Appuyer sur le menu (⋮)
3. Sélectionner "Ajouter à l'écran d'accueil"
4. Confirmer

### Métadonnées

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<meta name="theme-color" content="#000000" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<link rel="manifest" href="/manifest.json" />
```

---

## 🎯 Flux Utilisateur

### Scénario 1 : Première Commande

1. **Accueil** : Voir les restaurants à proximité
2. **Sélection** : Cliquer sur un restaurant
3. **Menu** : Parcourir les catégories
4. **Ajout** : Ajouter des plats au panier
5. **Panier** : Voir le panier flottant
6. **Validation** : Cliquer sur "Voir le panier"
7. **Checkout** : Confirmer et payer (à implémenter)
8. **Suivi** : Suivre la commande en temps réel

### Scénario 2 : Consultation Fidélité

1. **Navigation** : Onglet "Fidélité"
2. **Points** : Voir le solde de points
3. **Niveau** : Voir le niveau actuel
4. **Progression** : Voir les points manquants
5. **Historique** : Consulter les transactions

### Scénario 3 : Gestion Profil

1. **Navigation** : Onglet "Profil"
2. **Informations** : Voir les infos personnelles
3. **Adresses** : Gérer les adresses de livraison
4. **Paramètres** : Configurer les préférences
5. **Déconnexion** : Se déconnecter

---

## 🔧 Fonctionnalités à Implémenter

### Priorité Haute

1. **Page Panier** (`/mobile/cart/:restaurantId`)
   - Récapitulatif des articles
   - Modification des quantités
   - Sélection adresse de livraison
   - Choix du mode de paiement
   - Validation de la commande

2. **Page Suivi Commande** (`/mobile/orders/:orderId`)
   - Détails de la commande
   - Timeline des statuts
   - Carte avec position du livreur
   - Estimation du temps de livraison
   - Bouton "Contacter le livreur"

3. **Gestion des Adresses** (`/mobile/profile/addresses`)
   - Liste des adresses
   - Ajout d'adresse avec géolocalisation
   - Modification d'adresse
   - Suppression d'adresse
   - Définir adresse par défaut

### Priorité Moyenne

4. **Notifications Push**
   - Commande confirmée
   - Commande en préparation
   - Livreur en route
   - Commande livrée
   - Points de fidélité gagnés

5. **Recherche Avancée**
   - Filtres : Type de cuisine, Prix, Note
   - Tri : Distance, Note, Popularité
   - Favoris

6. **Historique Détaillé**
   - Détails de chaque commande passée
   - Possibilité de recommander
   - Laisser un avis

### Priorité Basse

7. **Mode Hors Ligne**
   - Service Worker
   - Cache des restaurants
   - Cache des menus
   - Synchronisation en arrière-plan

8. **Partage Social**
   - Partager un restaurant
   - Partager un plat
   - Inviter des amis

---

## 📊 Statistiques

- **5 pages** principales
- **3 composants** réutilisables
- **1 layout** mobile
- **5 routes** configurées
- **8 tables** Supabase utilisées

---

## 🧪 Tests

### Test 1 : Navigation
```
1. Ouvrir /mobile
2. ✅ Vérifier : 4 onglets visibles en bas
3. ✅ Vérifier : Cliquer sur chaque onglet change la page
4. ✅ Vérifier : Onglet actif est surligné
```

### Test 2 : Liste Restaurants
```
1. Ouvrir /mobile
2. ✅ Vérifier : Liste des restaurants affichée
3. ✅ Vérifier : Recherche fonctionne
4. ✅ Vérifier : Cliquer sur restaurant ouvre le menu
```

### Test 3 : Ajout au Panier
```
1. Ouvrir un restaurant
2. ✅ Vérifier : Menu affiché par catégories
3. ✅ Vérifier : Cliquer "Ajouter" ajoute au panier
4. ✅ Vérifier : Panier flottant apparaît
5. ✅ Vérifier : Quantité et total corrects
```

### Test 4 : Commandes
```
1. Onglet "Commandes"
2. ✅ Vérifier : 2 onglets (En cours, Historique)
3. ✅ Vérifier : Commandes affichées
4. ✅ Vérifier : Statuts corrects
```

### Test 5 : Fidélité
```
1. Onglet "Fidélité"
2. ✅ Vérifier : Points affichés
3. ✅ Vérifier : Niveau affiché
4. ✅ Vérifier : Barre de progression
5. ✅ Vérifier : Historique des transactions
```

### Test 6 : Responsive
```
1. Tester sur iPhone SE (375px)
2. Tester sur iPhone 12 (390px)
3. Tester sur iPhone 14 Pro Max (430px)
4. Tester sur iPad Mini (768px)
5. ✅ Vérifier : Layout adapté à chaque taille
```

---

## 🎨 Personnalisation

### Couleurs (index.css)

```css
:root {
  --primary: ...;        /* Couleur principale */
  --background: ...;     /* Fond */
  --foreground: ...;     /* Texte */
  --muted: ...;          /* Éléments secondaires */
  --border: ...;         /* Bordures */
}
```

### Icônes PWA

Remplacer dans `public/` :
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

### Manifest

Modifier `public/manifest.json` :
- `name` : Nom complet
- `short_name` : Nom court
- `theme_color` : Couleur du thème
- `background_color` : Couleur de fond

---

## 🚀 Déploiement

### Prérequis

- Application web déployée (Vercel, Netlify, etc.)
- HTTPS activé (obligatoire pour PWA)
- Manifest.json accessible

### Vérification PWA

1. Ouvrir Chrome DevTools
2. Onglet "Application"
3. Section "Manifest"
4. Vérifier : Toutes les propriétés sont valides
5. Section "Service Workers"
6. Vérifier : Service worker enregistré (si implémenté)

### Lighthouse Audit

1. Ouvrir Chrome DevTools
2. Onglet "Lighthouse"
3. Sélectionner "Progressive Web App"
4. Cliquer "Generate report"
5. Objectif : Score > 90

---

## 📝 Notes Techniques

### Géolocalisation

```javascript
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    // Utiliser les coordonnées
  },
  (error) => {
    // Gérer l'erreur
  }
);
```

### Calcul de Distance

Formule de Haversine pour calculer la distance entre deux points GPS :

```javascript
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
```

### Gestion du Panier

Le panier est géré en état local (useState) dans `MobileRestaurantPage`. Pour persister le panier :

```javascript
// Sauvegarder dans localStorage
localStorage.setItem('cart', JSON.stringify(cart));

// Charger depuis localStorage
const savedCart = localStorage.getItem('cart');
if (savedCart) {
  setCart(JSON.parse(savedCart));
}
```

---

## 🔒 Sécurité

### Authentification

- Routes protégées nécessitent connexion
- Token JWT dans les headers Supabase
- Refresh token automatique

### Données Sensibles

- Pas de stockage de carte bancaire
- Adresses chiffrées en base
- Communications HTTPS uniquement

---

## 📞 Support

Pour toute question ou problème :
- Email : support@kobetii.com
- Documentation : /mobile/profile/help
- FAQ : À implémenter

---

**Date de création** : 2026-04-27  
**Version** : v43  
**Type** : Progressive Web App (PWA)  
**Plateforme** : KobeTii Mobile Client

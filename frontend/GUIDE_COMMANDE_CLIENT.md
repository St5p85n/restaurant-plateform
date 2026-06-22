# Guide d'Utilisation - Espace Client de Commande en Ligne

## 🎯 Comment accéder à l'espace client pour passer commande

### Méthode 1: Depuis la page d'accueil (RECOMMANDÉ)

1. **Ouvrez l'application** → Vous arrivez sur la page d'accueil (`/`)

2. **Cliquez sur le bouton principal** "Commander maintenant" (avec l'icône panier 🛒)
   - Ce bouton est bien visible en haut de la page
   - Il est de couleur primaire (bleu) et de grande taille
   - Il vous redirige vers `/order/restaurants`

3. **Vous arrivez sur la liste des restaurants** disponibles pour la commande en ligne

### Méthode 2: URL directe

Tapez directement dans votre navigateur:
```
/order/restaurants
```

## 📋 Parcours complet de commande

### Étape 1: Liste des restaurants (`/order/restaurants`)

**Ce que vous voyez:**
- Header avec logo "RestauManager"
- Hero section avec titre "Commandez en ligne"
- Filtres de recherche:
  - Barre de recherche (par nom ou description)
  - Filtre par type de cuisine
  - Filtre par ville
- Liste de tous les restaurants disponibles en cartes
- Compteur de résultats

**Actions possibles:**
- Rechercher un restaurant spécifique
- Filtrer par cuisine (ex: Française, Africaine, Italienne)
- Filtrer par ville
- Cliquer sur une carte restaurant pour voir son menu

### Étape 2: Menu du restaurant (`/restaurant/:id`)

**Ce que vous voyez:**
- Header avec:
  - Bouton retour (←)
  - Nom du restaurant
  - Type de cuisine
  - Bouton "Panier" avec badge (nombre d'articles)
- Filtres par catégorie (boutons horizontaux):
  - "Tous"
  - Catégories du restaurant (Entrées, Plats, Desserts, etc.)
- Grille d'articles avec:
  - Image du plat (si disponible)
  - Nom et description
  - Prix
  - Bouton "Ajouter"

**Actions possibles:**
- Filtrer par catégorie
- Cliquer sur un article pour l'ajouter au panier
- Dans le dialog qui s'ouvre:
  - Ajuster la quantité avec les boutons +/-
  - Ajouter des instructions spéciales (ex: "Sans oignons")
  - Voir le total calculé
  - Cliquer sur "Ajouter au panier"
- Cliquer sur le bouton "Panier" pour voir le résumé

**Dialog Panier:**
- Liste de tous les articles ajoutés
- Pour chaque article:
  - Nom et prix unitaire
  - Notes spéciales (si ajoutées)
  - Quantité modifiable (+/-)
  - Bouton supprimer (🗑️)
- Total calculé automatiquement
- Bouton "Commander" pour passer à l'étape suivante

### Étape 3: Finalisation de commande (`/checkout`)

**Ce que vous voyez:**
- Formulaire d'adresse de livraison (colonne gauche):
  - Nom complet *
  - Téléphone *
  - Adresse *
  - Complément d'adresse
  - Ville *
  - Code postal
  - Instructions de livraison
- Choix du mode de paiement:
  - Carte bancaire 💳
  - Wave 📱
  - Orange Money 📱
- Récapitulatif sticky (colonne droite):
  - Liste des articles avec quantités
  - Sous-total
  - TVA (10%)
  - Total
  - Estimation de livraison (45 minutes)

**Actions possibles:**
- Remplir le formulaire d'adresse
- Choisir le mode de paiement
- Cliquer sur "Passer la commande"
- Vous êtes redirigé vers la page de suivi

### Étape 4: Suivi de commande (`/order/:id`)

**Ce que vous voyez:**
- Header avec:
  - Bouton retour
  - Titre "Suivi de commande"
  - Numéro de commande
- Badge de statut coloré
- Timeline des étapes:
  1. ⬜ Commande reçue (pending)
  2. ✅ Confirmée (confirmed)
  3. 👨‍🍳 En préparation (preparing)
  4. ⏰ Prête (ready)
  5. 🚚 En livraison (delivering)
  6. ✅ Livrée (delivered)
- Carte "Adresse de livraison":
  - Nom, téléphone
  - Adresse complète
  - Instructions
- Carte "Détail de la commande":
  - Liste des articles avec notes
  - Sous-total, TVA, Total
  - Mode de paiement
  - Date de commande
- Carte "Restaurant":
  - Nom, adresse, téléphone

**Fonctionnalités:**
- ✅ **Mises à jour en temps réel** via Supabase Realtime
- Quand le restaurant change le statut, la page se met à jour automatiquement
- Pas besoin de rafraîchir la page!

## 🎨 Repères visuels

### Boutons principaux
- **"Commander maintenant"** (page d'accueil):
  - Couleur: Bleu primaire
  - Taille: Grande (h-14)
  - Icône: Panier 🛒
  - Position: Centre de la page, en haut

- **"Panier"** (page menu):
  - Position: En haut à droite du header
  - Badge rouge avec nombre d'articles
  - Toujours visible (sticky header)

- **"Commander"** (dialog panier):
  - Couleur: Bleu primaire
  - Position: En bas du dialog
  - Visible seulement si panier non vide

- **"Passer la commande"** (checkout):
  - Couleur: Bleu primaire
  - Taille: Pleine largeur
  - Position: En bas du formulaire

### Codes couleur des statuts
- 🟡 **Jaune**: En attente (pending)
- 🔵 **Bleu**: Confirmée (confirmed)
- 🟠 **Orange**: En préparation (preparing)
- 🟣 **Violet**: Prête (ready)
- 🔷 **Indigo**: En livraison (delivering)
- 🟢 **Vert**: Livrée (delivered)

## 🔍 Où trouver quoi

### Navigation principale
```
Page d'accueil (/)
  ↓ Clic sur "Commander maintenant"
Liste des restaurants (/order/restaurants)
  ↓ Clic sur une carte restaurant
Menu du restaurant (/restaurant/:id)
  ↓ Ajout d'articles au panier
  ↓ Clic sur "Panier" puis "Commander"
Checkout (/checkout)
  ↓ Remplir formulaire et valider
Suivi de commande (/order/:id)
```

### URLs importantes
- **Page d'accueil**: `/`
- **Liste restaurants**: `/order/restaurants`
- **Menu restaurant**: `/restaurant/[ID_DU_RESTAURANT]`
- **Checkout**: `/checkout`
- **Suivi commande**: `/order/[ID_DE_LA_COMMANDE]`

## 💡 Astuces

1. **Panier persistant**: Votre panier est sauvegardé dans le navigateur. Même si vous fermez la page, vos articles restent!

2. **Changement de restaurant**: Si vous changez de restaurant, le panier se vide automatiquement (on ne peut pas mélanger les restaurants).

3. **Instructions spéciales**: N'oubliez pas d'ajouter vos préférences (ex: "Sans oignons", "Bien cuit") lors de l'ajout au panier.

4. **Suivi en temps réel**: Gardez la page de suivi ouverte pour voir les mises à jour automatiques du statut.

5. **Estimation de livraison**: L'estimation de 45 minutes est indicative. Le restaurant peut ajuster selon la charge.

## ❓ Questions fréquentes

**Q: Je ne vois pas le bouton "Commander maintenant"**
R: Assurez-vous d'être sur la page d'accueil (`/`). Le bouton est en haut, de couleur bleue, avec une icône de panier.

**Q: Mon panier est vide alors que j'avais ajouté des articles**
R: Avez-vous changé de restaurant? Le panier se vide automatiquement si vous consultez un autre restaurant.

**Q: Comment modifier la quantité d'un article dans le panier?**
R: Cliquez sur le bouton "Panier" en haut à droite, puis utilisez les boutons +/- à côté de chaque article.

**Q: Puis-je annuler ma commande?**
R: Une fois la commande passée, contactez directement le restaurant (téléphone affiché sur la page de suivi).

**Q: Le statut ne se met pas à jour**
R: Les mises à jour sont automatiques via Supabase Realtime. Si rien ne change, c'est que le restaurant n'a pas encore mis à jour le statut.

**Q: Dois-je créer un compte?**
R: Non, vous pouvez commander en tant qu'invité. Un compte client sera ajouté dans une future version pour l'historique des commandes.

## 🚀 Prochaines étapes

Après avoir passé votre première commande:
1. Gardez la page de suivi ouverte
2. Vous recevrez des mises à jour automatiques
3. Le restaurant confirmera votre commande
4. Vous verrez la progression en temps réel
5. Profitez de votre repas! 🍽️

---

**Besoin d'aide?**
Contactez le support ou consultez la documentation complète dans `CUSTOMER_ORDER_IMPLEMENTATION.md`.

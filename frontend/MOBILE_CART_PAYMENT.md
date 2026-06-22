# Page Panier et Paiement Mobile - KobeTii

## 📱 Vue d'Ensemble

Système complet de panier et de paiement pour l'application mobile KobeTii, permettant aux clients de finaliser leurs commandes avec plusieurs modes de paiement, incluant l'intégration Stripe pour les paiements par carte bancaire.

---

## 🎯 Fonctionnalités

### 1. Page Panier (`/mobile/cart/:restaurantId`)

#### Récapitulatif des Articles
- **Liste complète** des articles ajoutés au panier
- **Modification des quantités** avec boutons +/-
- **Suppression d'articles** avec bouton corbeille
- **Calcul automatique** des sous-totaux par article
- **Images** des plats avec nom et prix
- **Instructions spéciales** (si ajoutées)

#### Sélection de l'Adresse de Livraison
- **Liste des adresses** enregistrées du client
- **Sélection visuelle** avec radio buttons
- **Adresse par défaut** mise en avant avec badge
- **Affichage complet** : Nom, téléphone, adresse complète
- **Bouton "Ajouter une adresse"** (fonctionnalité à venir)
- **Chargement automatique** depuis la base de données

#### Choix du Mode de Paiement
- **4 options disponibles** :
  1. 💳 **Carte bancaire** (Visa, Mastercard) - via Stripe
  2. 📱 **Wave** - Paiement mobile (à implémenter)
  3. 💰 **Orange Money** - Paiement mobile (à implémenter)
  4. 💵 **Espèces** - Paiement à la livraison
- **Sélection visuelle** avec icônes et descriptions
- **Note informative** pour le paiement en espèces

#### Récapitulatif des Coûts
- **Sous-total** : Somme des articles
- **Frais de livraison** : 1000 FCFA (fixe)
- **Total** : Montant final à payer
- **Affichage clair** avec séparateur visuel

#### Validation de Commande
- **Bouton fixe** en bas de l'écran
- **Affichage du total** sur le bouton
- **État de chargement** pendant le traitement
- **Désactivation** si aucune adresse sélectionnée
- **Vérifications** avant validation :
  - Utilisateur connecté
  - Adresse sélectionnée
  - Panier non vide

### 2. Intégration Stripe

#### Edge Function : `create_stripe_checkout`
- **Création de session** Stripe Checkout
- **Récupération de la commande** depuis la base de données
- **Génération des line items** depuis les articles
- **Configuration** :
  - Devise : XOF (Franc CFA)
  - Mode : payment (paiement unique)
  - Méthodes : card (carte bancaire)
- **URLs de redirection** :
  - Succès : `/mobile/payment-success?session_id={CHECKOUT_SESSION_ID}`
  - Annulation : `/mobile/cart/:restaurantId`
- **Métadonnées** : order_id, restaurant_id
- **Mise à jour** de la commande avec session_id et payment_intent_id

#### Edge Function : `verify_stripe_payment`
- **Vérification du statut** de paiement via Stripe API
- **Récupération de la session** Stripe
- **Validation** : payment_status === "paid"
- **Mise à jour de la commande** :
  - payment_status → 'paid'
  - paid_at → timestamp
  - customer_email, customer_name depuis Stripe
- **Prévention des doublons** avec vérification du statut actuel
- **Retour des détails** : verified, status, amount, currency

#### Flux de Paiement par Carte
1. **Utilisateur clique** "Commander"
2. **Création de la commande** en base (status: pending, payment_status: unpaid)
3. **Appel** à `create_stripe_checkout` Edge Function
4. **Ouverture** de Stripe Checkout dans un nouvel onglet (`window.open`)
5. **Utilisateur paie** sur la page Stripe
6. **Redirection** vers `/mobile/payment-success?session_id=xxx`
7. **Appel** à `verify_stripe_payment` Edge Function
8. **Mise à jour** de la commande (payment_status: paid)
9. **Affichage** de la confirmation de paiement
10. **Navigation** vers la page de confirmation de commande

### 3. Page Succès de Paiement (`/mobile/payment-success`)

#### Vérification Automatique
- **Extraction** du session_id depuis l'URL
- **Appel automatique** à `verify_stripe_payment`
- **État de chargement** pendant la vérification
- **Gestion des erreurs** avec messages clairs

#### Affichage Succès
- **Icône de succès** (CheckCircle2) en vert
- **Message de confirmation** : "Paiement réussi !"
- **Carte informative** avec détails
- **Boutons d'action** :
  - "Voir ma commande" → `/mobile/order-confirmation/:orderId`
  - "Retour à l'accueil" → `/mobile`

#### Affichage Échec
- **Icône d'erreur** (XCircle) en rouge
- **Message d'erreur** : "Paiement échoué"
- **Explication** de l'erreur
- **Carte informative** avec conseils
- **Bouton** "Retour à l'accueil"

### 4. Page Confirmation de Commande (`/mobile/order-confirmation/:orderId`)

#### Affichage
- **Icône de succès** (CheckCircle2)
- **Message** : "Commande confirmée !"
- **Détails de la commande** :
  - Numéro de commande (format : #XXXXXX)
  - Nom du restaurant
  - Montant total
- **Informations** sur les prochaines étapes
- **Actions** :
  - "Suivre ma commande" (à implémenter)
  - "Retour à l'accueil"

---

## 📂 Structure des Fichiers

### Composants
```
src/components/mobile/
├── CartItemCard.tsx           # Carte article du panier
├── AddressSelector.tsx        # Sélecteur d'adresse
└── PaymentMethodSelector.tsx  # Sélecteur de paiement
```

### Pages
```
src/pages/mobile/
├── MobileCartPage.tsx                # Page panier principale
├── MobilePaymentSuccessPage.tsx      # Page succès de paiement
└── MobileOrderConfirmationPage.tsx   # Page confirmation de commande
```

### Edge Functions
```
supabase/functions/
├── create_stripe_checkout/
│   └── index.ts                      # Création session Stripe
└── verify_stripe_payment/
    └── index.ts                      # Vérification paiement
```

### Migrations
```
supabase/migrations/
└── add_stripe_fields_to_orders.sql   # Champs Stripe dans orders
```

---

## 🗄️ Base de Données

### Table `orders` - Nouveaux Champs

```sql
stripe_session_id TEXT UNIQUE          -- ID de session Stripe Checkout
stripe_payment_intent_id TEXT          -- ID de PaymentIntent Stripe
customer_email TEXT                    -- Email du client depuis Stripe
customer_name TEXT                     -- Nom du client depuis Stripe
paid_at TIMESTAMPTZ                    -- Date et heure du paiement confirmé
```

### Index
```sql
CREATE INDEX idx_orders_stripe_session_id ON orders(stripe_session_id);
```

### Tables Utilisées
- **orders** : Commandes
- **order_items** : Articles de commande
- **delivery_addresses** : Adresses de livraison
- **customers** : Données client
- **menu_items** : Plats du menu
- **restaurants** : Restaurants

---

## 🎨 Design Minimal

### Espaces Blancs
- Padding généreux : `p-4`, `space-y-4`, `gap-3`
- Marges entre sections : `space-y-4`
- Espacement dans les cartes : `space-y-3`

### Typographie
- Titres : `text-lg`, `text-base` font-semibold
- Corps : `text-sm`, `text-xs`
- Couleurs : `text-muted-foreground` pour le secondaire

### Couleurs
- Primary : Boutons d'action, prix, sélections
- Muted : Fonds neutres, éléments secondaires
- Border : Bordures subtiles (`border-border/40`)
- Destructive : Bouton supprimer

### Interactions
- Transitions : `transition-all`
- Hover : `hover:border-primary/50`
- Active : `active:scale-[0.98]`
- États de chargement : Spinner animé

---

## 🔌 Intégration API

### Appel à `create_stripe_checkout`

```typescript
const { data, error } = await supabase.functions.invoke(
  'create_stripe_checkout',
  {
    body: { orderId: 'uuid-de-la-commande' },
  }
);

if (data?.code === 'SUCCESS') {
  window.open(data.data.url, '_blank'); // Ouvrir Stripe Checkout
}
```

### Appel à `verify_stripe_payment`

```typescript
const { data, error } = await supabase.functions.invoke(
  'verify_stripe_payment',
  {
    body: { sessionId: 'cs_test_xxx' },
  }
);

if (data?.code === 'SUCCESS' && data?.data?.verified) {
  // Paiement confirmé
}
```

---

## 🚀 Routes

### Routes Ajoutées

1. **`/mobile/cart/:restaurantId`** (protégée)
   - Page panier avec récapitulatif et validation

2. **`/mobile/payment-success`** (protégée)
   - Page de vérification et confirmation de paiement

3. **`/mobile/order-confirmation/:orderId`** (protégée)
   - Page de confirmation de commande

### Navigation

```
MobileRestaurantPage
  ↓ (Clic "Voir le panier")
MobileCartPage
  ↓ (Clic "Commander" avec carte)
Stripe Checkout (nouvel onglet)
  ↓ (Paiement réussi)
MobilePaymentSuccessPage
  ↓ (Vérification OK)
MobileOrderConfirmationPage
```

---

## 🔒 Sécurité

### Authentification
- **Routes protégées** : Panier, paiement, confirmation
- **Vérification** de l'utilisateur connecté
- **Token JWT** dans les headers Supabase

### Paiement Stripe
- **Clé secrète** stockée dans les variables d'environnement
- **Jamais exposée** au client
- **Validation côté serveur** dans les Edge Functions
- **Vérification** du statut de paiement via Stripe API

### Données Sensibles
- **Pas de stockage** de carte bancaire
- **Adresses** liées au customer_id
- **Communications HTTPS** uniquement

---

## ⚙️ Configuration Stripe

### Variables d'Environnement

**IMPORTANT** : Vous devez configurer votre clé secrète Stripe :

1. **Obtenir la clé** :
   - Connectez-vous à https://dashboard.stripe.com/apikeys
   - Copiez votre "Secret key" (commence par `sk_test_` ou `sk_live_`)

2. **Ajouter la clé** :
   - Via l'interface Supabase : Project Settings → Edge Functions → Secrets
   - Nom : `STRIPE_SECRET_KEY`
   - Valeur : Votre clé secrète Stripe

3. **Tester** :
   - Utilisez une carte de test Stripe : `4242 4242 4242 4242`
   - Date d'expiration : N'importe quelle date future
   - CVC : N'importe quel code à 3 chiffres

### Mode Test vs Production

**Mode Test** (recommandé pour le développement) :
- Clé : `sk_test_...`
- Cartes de test : https://stripe.com/docs/testing

**Mode Production** :
- Clé : `sk_live_...`
- Cartes réelles
- Paiements réels

---

## 🧪 Tests

### Test 1 : Ajout au Panier
```
1. Ouvrir un restaurant
2. Ajouter des plats au panier
3. Cliquer "Voir le panier"
4. ✅ Vérifier : Articles affichés avec quantités correctes
5. ✅ Vérifier : Sous-totaux corrects
6. ✅ Vérifier : Total correct (sous-total + livraison)
```

### Test 2 : Modification du Panier
```
1. Dans le panier, cliquer "+"
2. ✅ Vérifier : Quantité augmente
3. ✅ Vérifier : Sous-total mis à jour
4. ✅ Vérifier : Total mis à jour
5. Cliquer "-"
6. ✅ Vérifier : Quantité diminue
7. Cliquer "Supprimer"
8. ✅ Vérifier : Article retiré du panier
```

### Test 3 : Sélection Adresse
```
1. Dans le panier, voir la section "Adresse de livraison"
2. ✅ Vérifier : Adresses chargées depuis la base
3. ✅ Vérifier : Adresse par défaut pré-sélectionnée
4. Cliquer sur une autre adresse
5. ✅ Vérifier : Sélection visuelle mise à jour
```

### Test 4 : Sélection Paiement
```
1. Dans le panier, voir la section "Mode de paiement"
2. ✅ Vérifier : 4 options affichées
3. Cliquer sur "Carte bancaire"
4. ✅ Vérifier : Sélection visuelle mise à jour
5. Cliquer sur "Espèces"
6. ✅ Vérifier : Note informative affichée
```

### Test 5 : Paiement par Carte
```
1. Sélectionner "Carte bancaire"
2. Cliquer "Commander"
3. ✅ Vérifier : Commande créée en base (status: pending, payment_status: unpaid)
4. ✅ Vérifier : Nouvel onglet Stripe Checkout ouvert
5. Entrer carte de test : 4242 4242 4242 4242
6. Compléter le paiement
7. ✅ Vérifier : Redirection vers /mobile/payment-success
8. ✅ Vérifier : Vérification automatique du paiement
9. ✅ Vérifier : Message "Paiement réussi !"
10. ✅ Vérifier : Commande mise à jour (payment_status: paid)
```

### Test 6 : Paiement en Espèces
```
1. Sélectionner "Espèces"
2. Cliquer "Commander"
3. ✅ Vérifier : Commande créée (payment_status: pending)
4. ✅ Vérifier : Redirection directe vers confirmation
5. ✅ Vérifier : Message "Commande confirmée !"
```

### Test 7 : Validation
```
1. Panier vide, cliquer "Commander"
2. ✅ Vérifier : Message d'erreur "Panier vide"
3. Ajouter articles, ne pas sélectionner d'adresse
4. ✅ Vérifier : Bouton "Commander" désactivé
5. Sélectionner adresse
6. ✅ Vérifier : Bouton "Commander" activé
```

---

## 🎯 Flux Utilisateur Complet

### Scénario : Commande avec Paiement par Carte

1. **Accueil** : Voir les restaurants
2. **Restaurant** : Parcourir le menu
3. **Ajout** : Ajouter des plats au panier
4. **Panier** : Cliquer "Voir le panier"
5. **Vérification** : Vérifier les articles et quantités
6. **Adresse** : Sélectionner l'adresse de livraison
7. **Paiement** : Choisir "Carte bancaire"
8. **Validation** : Cliquer "Commander"
9. **Stripe** : Compléter le paiement sur Stripe
10. **Vérification** : Attendre la vérification automatique
11. **Confirmation** : Voir la confirmation de commande
12. **Suivi** : Cliquer "Suivre ma commande" (à implémenter)

---

## 🔧 Fonctionnalités à Implémenter

### Priorité Haute

1. **Ajout d'Adresse**
   - Formulaire d'ajout d'adresse
   - Géolocalisation automatique
   - Validation des champs
   - Définir comme adresse par défaut

2. **Paiements Mobiles**
   - Intégration Wave
   - Intégration Orange Money
   - Webhooks pour confirmation

3. **Suivi de Commande en Temps Réel**
   - Page de suivi détaillée
   - Carte avec position du livreur
   - Timeline des statuts
   - Notifications push

### Priorité Moyenne

4. **Instructions Spéciales**
   - Champ de saisie par article
   - Affichage dans le panier
   - Transmission au restaurant

5. **Codes Promo**
   - Champ de saisie du code
   - Validation du code
   - Application de la réduction
   - Affichage du montant économisé

6. **Historique des Commandes**
   - Liste des commandes passées
   - Détails de chaque commande
   - Possibilité de recommander
   - Télécharger la facture

### Priorité Basse

7. **Pourboire**
   - Option d'ajouter un pourboire
   - Montants suggérés (5%, 10%, 15%)
   - Montant personnalisé

8. **Partage de Panier**
   - Générer un lien de partage
   - Commande groupée
   - Paiement partagé

---

## 📊 Statistiques

- **3 composants** réutilisables
- **3 pages** principales
- **2 Edge Functions** Stripe
- **1 migration** base de données
- **5 champs** ajoutés à la table orders
- **4 modes de paiement** (1 fonctionnel, 3 à implémenter)
- **3 routes** ajoutées

---

## 🐛 Dépannage

### Erreur : "STRIPE_SECRET_KEY non configuré"

**Solution** :
1. Vérifier que la clé est bien ajoutée dans Supabase
2. Redéployer les Edge Functions si nécessaire
3. Vérifier que la clé commence par `sk_test_` ou `sk_live_`

### Erreur : "Commande introuvable"

**Solution** :
1. Vérifier que la commande existe en base
2. Vérifier que l'ID de commande est correct
3. Vérifier les permissions RLS sur la table orders

### Paiement non vérifié

**Solution** :
1. Vérifier que le session_id est présent dans l'URL
2. Vérifier les logs de l'Edge Function `verify_stripe_payment`
3. Vérifier le statut de la session dans le Dashboard Stripe

### Stripe Checkout ne s'ouvre pas

**Solution** :
1. Vérifier que le popup n'est pas bloqué par le navigateur
2. Vérifier que l'URL de checkout est valide
3. Vérifier les logs de l'Edge Function `create_stripe_checkout`

---

## 📝 Notes Techniques

### Devise : Franc CFA (XOF)

Stripe utilise les montants en centimes, mais le Franc CFA n'a pas de subdivision. Les montants sont donc passés tels quels (sans multiplication par 100).

```typescript
unit_amount: Math.round(item.unit_price) // Pas de * 100
```

### Ouverture de Stripe Checkout

Utilisation de `window.open` au lieu de `window.location.href` pour éviter les problèmes CORS et de redirection dans les SPA.

```typescript
window.open(checkoutData.data.url, '_blank');
```

### Gestion des Erreurs Edge Functions

Les erreurs des Edge Functions sont récupérées via `error.context.text()` :

```typescript
const errorMsg = await error?.context?.text?.();
```

### Prévention des Doublons

La vérification du paiement utilise une condition WHERE pour éviter les mises à jour multiples :

```sql
UPDATE orders SET payment_status = 'paid'
WHERE id = ? AND payment_status = 'unpaid'
```

---

## 📞 Support

Pour toute question ou problème :
- Documentation Stripe : https://stripe.com/docs
- Dashboard Stripe : https://dashboard.stripe.com
- Support KobeTii : support@kobetii.com

---

**Date de création** : 2026-04-27  
**Version** : v44  
**Type** : Progressive Web App (PWA)  
**Plateforme** : KobeTii Mobile Client - Panier et Paiement

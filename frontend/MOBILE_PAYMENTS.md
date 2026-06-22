# Paiements Mobiles Wave et Orange Money - KobeTii

## 📱 Vue d'Ensemble

Système complet d'intégration des paiements mobiles Wave et Orange Money pour l'application mobile KobeTii, permettant aux clients de payer leurs commandes directement depuis leur téléphone mobile.

---

## 🎯 Fonctionnalités

### 1. Paiement Wave

#### Caractéristiques
- **Initiation de paiement** via numéro de téléphone
- **Notification push** envoyée au téléphone du client
- **Confirmation** par code PIN
- **Vérification automatique** du statut de paiement
- **Expiration** après 5 minutes
- **Mode simulation** pour le développement

#### Flux de Paiement
1. Client sélectionne "Wave" comme mode de paiement
2. Client entre son numéro de téléphone
3. Système envoie une demande de paiement
4. Client reçoit une notification sur son téléphone
5. Client entre son code PIN Wave
6. Système vérifie automatiquement le paiement
7. Commande confirmée si paiement réussi

### 2. Paiement Orange Money

#### Caractéristiques
- **Initiation de paiement** via numéro de téléphone
- **Notification USSD** ou push
- **Confirmation** par code PIN
- **Vérification automatique** du statut
- **Expiration** après 5 minutes
- **Mode simulation** pour le développement

#### Flux de Paiement
1. Client sélectionne "Orange Money" comme mode de paiement
2. Client entre son numéro de téléphone
3. Système envoie une demande de paiement
4. Client reçoit une notification ou code USSD
5. Client entre son code PIN Orange Money
6. Système vérifie automatiquement le paiement
7. Commande confirmée si paiement réussi

---

## 📂 Structure des Fichiers

### Composants
```
src/components/mobile/
└── MobilePaymentModal.tsx         # Modal de saisie du numéro
```

### Pages
```
src/pages/mobile/
├── MobileCartPage.tsx             # Page panier (mise à jour)
└── MobilePaymentPendingPage.tsx   # Page d'attente de paiement
```

### Edge Functions
```
supabase/functions/
├── create_wave_payment/
│   └── index.ts                   # Initier paiement Wave
├── verify_wave_payment/
│   └── index.ts                   # Vérifier paiement Wave
├── create_orange_money_payment/
│   └── index.ts                   # Initier paiement Orange Money
└── verify_orange_money_payment/
    └── index.ts                   # Vérifier paiement Orange Money
```

### Base de Données
```
supabase/migrations/
└── create_mobile_payments_table.sql
```

---

## 🗄️ Base de Données

### Table `mobile_payments`

```sql
CREATE TABLE mobile_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method mobile_payment_method NOT NULL,  -- 'wave' ou 'orange_money'
    phone_number TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'XOF',
    status mobile_payment_status NOT NULL DEFAULT 'pending',
    transaction_id TEXT UNIQUE,
    provider_reference TEXT,
    provider_response JSONB,
    error_message TEXT,
    initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Statuts de Paiement

- **pending** : En attente de confirmation du client
- **processing** : Paiement en cours de traitement
- **paid** : Paiement confirmé et réussi
- **failed** : Paiement échoué
- **cancelled** : Paiement annulé par le client
- **expired** : Délai de paiement expiré (5 minutes)

### Index
```sql
CREATE INDEX idx_mobile_payments_order_id ON mobile_payments(order_id);
CREATE INDEX idx_mobile_payments_transaction_id ON mobile_payments(transaction_id);
CREATE INDEX idx_mobile_payments_status ON mobile_payments(status);
CREATE INDEX idx_mobile_payments_phone_number ON mobile_payments(phone_number);
```

---

## 🔌 API Edge Functions

### 1. `create_wave_payment`

**Endpoint** : `/functions/v1/create_wave_payment`

**Méthode** : POST

**Body** :
```json
{
  "orderId": "uuid-de-la-commande",
  "phoneNumber": "+221771234567"
}
```

**Réponse Succès** :
```json
{
  "code": "SUCCESS",
  "message": "Succès",
  "data": {
    "paymentId": "uuid-du-paiement",
    "transactionId": "WAVE_1234567890_abc123",
    "status": "processing",
    "message": "Demande de paiement envoyée",
    "expiresAt": "2026-04-27T12:35:00Z"
  }
}
```

**Réponse Erreur** :
```json
{
  "code": "FAIL",
  "message": "Description de l'erreur"
}
```

### 2. `verify_wave_payment`

**Endpoint** : `/functions/v1/verify_wave_payment`

**Méthode** : POST

**Body** :
```json
{
  "paymentId": "uuid-du-paiement"
}
```

**Réponse Succès** :
```json
{
  "code": "SUCCESS",
  "message": "Succès",
  "data": {
    "verified": true,
    "status": "paid",
    "paymentId": "uuid-du-paiement",
    "transactionId": "WAVE_1234567890_abc123",
    "completedAt": "2026-04-27T12:32:15Z"
  }
}
```

### 3. `create_orange_money_payment`

**Endpoint** : `/functions/v1/create_orange_money_payment`

**Méthode** : POST

**Body** :
```json
{
  "orderId": "uuid-de-la-commande",
  "phoneNumber": "+221771234567"
}
```

**Réponse Succès** :
```json
{
  "code": "SUCCESS",
  "message": "Succès",
  "data": {
    "paymentId": "uuid-du-paiement",
    "transactionId": "OM_1234567890_xyz789",
    "status": "processing",
    "message": "Demande de paiement envoyée",
    "expiresAt": "2026-04-27T12:35:00Z"
  }
}
```

### 4. `verify_orange_money_payment`

**Endpoint** : `/functions/v1/verify_orange_money_payment`

**Méthode** : POST

**Body** :
```json
{
  "paymentId": "uuid-du-paiement"
}
```

**Réponse Succès** :
```json
{
  "code": "SUCCESS",
  "message": "Succès",
  "data": {
    "verified": true,
    "status": "paid",
    "paymentId": "uuid-du-paiement",
    "transactionId": "OM_1234567890_xyz789",
    "completedAt": "2026-04-27T12:32:15Z"
  }
}
```

---

## 🎨 Composants UI

### MobilePaymentModal

Modal pour saisir le numéro de téléphone du client.

**Props** :
```typescript
interface MobilePaymentModalProps {
  open: boolean;                          // État d'ouverture du modal
  onClose: () => void;                    // Callback de fermeture
  onConfirm: (phoneNumber: string) => void; // Callback de confirmation
  paymentMethod: 'wave' | 'orange_money'; // Méthode de paiement
  amount: number;                         // Montant à payer
  processing?: boolean;                   // État de traitement
}
```

**Fonctionnalités** :
- Sélection du code pays (Sénégal, Côte d'Ivoire, Burkina Faso, Mali, Niger)
- Validation du format de numéro (8-10 chiffres)
- Affichage du montant à payer
- Instructions pour l'utilisateur
- Design minimal avec espaces blancs

**Utilisation** :
```tsx
<MobilePaymentModal
  open={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={(phone) => handlePayment(phone)}
  paymentMethod="wave"
  amount={15000}
  processing={false}
/>
```

### MobilePaymentPendingPage

Page d'attente pendant le traitement du paiement mobile.

**Fonctionnalités** :
- Affichage du statut en temps réel
- Polling automatique toutes les 3 secondes
- Compte à rebours (5 minutes)
- Instructions pour l'utilisateur
- Bouton d'annulation
- Redirection automatique si paiement réussi
- Gestion des expirations et échecs

**États Affichés** :
- **En attente** : Animation pulse, instructions, compte à rebours
- **Payé** : Icône de succès, message de confirmation
- **Échoué** : Icône d'erreur, message d'échec
- **Expiré** : Icône d'alerte, message d'expiration

---

## ⚙️ Configuration

### Variables d'Environnement

#### Wave

**IMPORTANT** : Wave n'a pas d'API publique officielle. Le système fonctionne en mode simulation par défaut.

Si vous avez accès à l'API Wave :

1. **WAVE_API_KEY** : Clé API Wave
2. **WAVE_API_URL** : URL de l'API Wave

Configuration dans Supabase :
```
Project Settings → Edge Functions → Secrets
```

#### Orange Money

Orange Money a une API officielle mais nécessite un contrat commercial.

Si vous avez un contrat Orange Money :

1. **ORANGE_MONEY_API_KEY** : Clé API Orange Money
2. **ORANGE_MONEY_API_URL** : URL de l'API Orange Money
3. **ORANGE_MONEY_MERCHANT_ID** : ID marchand Orange Money

Configuration dans Supabase :
```
Project Settings → Edge Functions → Secrets
```

### Mode Simulation

Par défaut, si les variables d'environnement ne sont pas configurées, le système fonctionne en **mode simulation** :

- Les paiements sont créés en base avec le statut `pending`
- Aucun appel API réel n'est effectué
- Les paiements doivent être confirmés manuellement en base de données
- Utile pour le développement et les tests

**Pour simuler un paiement réussi** :
```sql
UPDATE mobile_payments
SET status = 'paid', completed_at = NOW()
WHERE id = 'uuid-du-paiement';

UPDATE orders
SET payment_status = 'paid', paid_at = NOW()
WHERE id = 'uuid-de-la-commande';
```

---

## 🔄 Flux Complet

### Scénario : Paiement Wave

1. **Client dans le panier** :
   - Sélectionne "Wave" comme mode de paiement
   - Clique sur "Commander"

2. **Modal de saisie** :
   - Modal s'ouvre
   - Client sélectionne le pays (+221)
   - Client entre son numéro (77 123 45 67)
   - Client clique sur "Confirmer"

3. **Création de la commande** :
   - Commande créée en base (status: pending, payment_status: unpaid)
   - Articles de commande créés

4. **Initiation du paiement** :
   - Appel à `create_wave_payment` Edge Function
   - Enregistrement créé dans `mobile_payments` (status: processing)
   - Transaction ID généré : `WAVE_1234567890_abc123`
   - Expiration définie : NOW() + 5 minutes

5. **Page d'attente** :
   - Redirection vers `/mobile/payment-pending/:paymentId`
   - Affichage du statut "En attente"
   - Instructions affichées
   - Compte à rebours démarre (5:00)
   - Polling démarre (toutes les 3 secondes)

6. **Notification Wave** :
   - Client reçoit une notification sur son téléphone
   - Client ouvre l'app Wave
   - Client entre son code PIN
   - Wave confirme le paiement

7. **Vérification automatique** :
   - Polling appelle `verify_wave_payment`
   - Edge Function interroge l'API Wave
   - Statut récupéré : "paid"
   - Base de données mise à jour :
     - `mobile_payments.status` → 'paid'
     - `mobile_payments.completed_at` → NOW()
     - `orders.payment_status` → 'paid'
     - `orders.paid_at` → NOW()

8. **Confirmation** :
   - Page d'attente détecte le changement de statut
   - Toast de succès affiché
   - Redirection vers `/mobile/order-confirmation/:orderId`
   - Client voit la confirmation de commande

### Scénario : Paiement Expiré

1. **Client ne confirme pas** dans les 5 minutes
2. **Compte à rebours** atteint 0:00
3. **Statut mis à jour** : `expired`
4. **Polling arrêté**
5. **Message d'erreur** affiché
6. **Bouton** "Retour à l'accueil"

### Scénario : Paiement Annulé

1. **Client clique** sur "Annuler le paiement"
2. **Statut mis à jour** : `cancelled`
3. **Toast** "Paiement annulé"
4. **Redirection** vers `/mobile`

---

## 🧪 Tests

### Test 1 : Saisie du Numéro de Téléphone

```
1. Ouvrir le panier
2. Sélectionner "Wave"
3. Cliquer "Commander"
4. ✅ Vérifier : Modal s'ouvre
5. ✅ Vérifier : Montant affiché correctement
6. ✅ Vérifier : Code pays par défaut (+221)
7. Entrer un numéro invalide (lettres)
8. ✅ Vérifier : Message d'erreur affiché
9. Entrer un numéro valide (77 123 45 67)
10. ✅ Vérifier : Pas d'erreur
11. Cliquer "Confirmer"
12. ✅ Vérifier : Modal se ferme
13. ✅ Vérifier : Redirection vers page d'attente
```

### Test 2 : Page d'Attente

```
1. Être sur la page d'attente
2. ✅ Vérifier : Statut "En attente" affiché
3. ✅ Vérifier : Numéro de téléphone affiché
4. ✅ Vérifier : Montant affiché
5. ✅ Vérifier : Compte à rebours démarre à 5:00
6. ✅ Vérifier : Instructions affichées
7. ✅ Vérifier : Bouton "Annuler" présent
8. Attendre 10 secondes
9. ✅ Vérifier : Compte à rebours diminue (4:50)
10. ✅ Vérifier : Message "Vérification automatique en cours..."
```

### Test 3 : Paiement Réussi (Simulation)

```
1. Créer un paiement Wave
2. Noter le paymentId
3. En base de données, exécuter :
   UPDATE mobile_payments SET status = 'paid', completed_at = NOW() WHERE id = 'paymentId';
   UPDATE orders SET payment_status = 'paid', paid_at = NOW() WHERE id = 'orderId';
4. Attendre le prochain polling (max 3 secondes)
5. ✅ Vérifier : Toast "Paiement confirmé !"
6. ✅ Vérifier : Redirection vers page de confirmation
7. ✅ Vérifier : Détails de la commande affichés
```

### Test 4 : Paiement Expiré

```
1. Créer un paiement avec expiration dans 10 secondes :
   UPDATE mobile_payments SET expires_at = NOW() + INTERVAL '10 seconds' WHERE id = 'paymentId';
2. Attendre 10 secondes
3. ✅ Vérifier : Compte à rebours atteint 0:00
4. ✅ Vérifier : Statut change à "Expiré"
5. ✅ Vérifier : Icône d'erreur affichée
6. ✅ Vérifier : Message "Le délai de paiement a expiré"
7. ✅ Vérifier : Bouton "Retour à l'accueil"
```

### Test 5 : Annulation de Paiement

```
1. Être sur la page d'attente
2. Cliquer "Annuler le paiement"
3. ✅ Vérifier : Toast "Paiement annulé"
4. ✅ Vérifier : Redirection vers /mobile
5. En base, vérifier :
   SELECT status FROM mobile_payments WHERE id = 'paymentId';
6. ✅ Vérifier : status = 'cancelled'
```

### Test 6 : Orange Money

```
1. Répéter les tests 1-5 avec "Orange Money"
2. ✅ Vérifier : Icône 🍊 affichée
3. ✅ Vérifier : Nom "Orange Money" affiché
4. ✅ Vérifier : Edge Functions Orange Money appelées
5. ✅ Vérifier : payment_method = 'orange_money' en base
```

---

## 🔧 Intégration API Réelles

### Wave API

**Note** : Wave n'a pas d'API publique officielle. Cette section est basée sur des structures génériques.

Si vous obtenez un accès à l'API Wave :

1. **Obtenir les credentials** :
   - Contacter Wave pour un partenariat
   - Obtenir la clé API et l'URL

2. **Configurer les secrets** :
   ```
   WAVE_API_KEY=votre_cle_api
   WAVE_API_URL=https://api.wave.com
   ```

3. **Adapter le code** dans `create_wave_payment/index.ts` :
   ```typescript
   const waveResponse = await fetch(`${waveApiUrl}/payments`, {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${waveApiKey}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       amount: order.total,
       currency: 'XOF',
       phone: request.phoneNumber,
       reference: transactionId,
       description: `Commande #${order.order_number}`,
     }),
   });
   ```

4. **Adapter le code** dans `verify_wave_payment/index.ts` :
   ```typescript
   const waveResponse = await fetch(
     `${waveApiUrl}/payments/${payment.provider_reference}`,
     {
       method: 'GET',
       headers: {
         'Authorization': `Bearer ${waveApiKey}`,
       },
     }
   );
   ```

### Orange Money API

Orange Money a une API officielle : https://developer.orange.com/apis/orange-money-webpay/

1. **Créer un compte développeur** :
   - Aller sur https://developer.orange.com
   - Créer un compte
   - Souscrire à l'API Orange Money WebPay

2. **Obtenir les credentials** :
   - Client ID
   - Client Secret
   - Merchant Key

3. **Configurer les secrets** :
   ```
   ORANGE_MONEY_API_KEY=votre_access_token
   ORANGE_MONEY_API_URL=https://api.orange.com/orange-money-webpay
   ORANGE_MONEY_MERCHANT_ID=votre_merchant_key
   ```

4. **Le code est déjà adapté** pour l'API Orange Money officielle dans les Edge Functions

5. **Tester en sandbox** :
   - Utiliser l'environnement de test Orange
   - Numéros de test fournis par Orange
   - Pas de paiement réel

---

## 📊 Statistiques

- **1 table** : mobile_payments
- **2 enums** : mobile_payment_method, mobile_payment_status
- **4 Edge Functions** : create/verify pour Wave et Orange Money
- **1 composant** : MobilePaymentModal
- **1 page** : MobilePaymentPendingPage
- **1 route** : /mobile/payment-pending/:paymentId
- **6 statuts** : pending, processing, paid, failed, cancelled, expired
- **5 pays** supportés : Sénégal, Côte d'Ivoire, Burkina Faso, Mali, Niger
- **5 minutes** : Délai d'expiration
- **3 secondes** : Intervalle de polling

---

## 🐛 Dépannage

### Erreur : "Paramètres manquants"

**Cause** : orderId ou phoneNumber manquant

**Solution** :
1. Vérifier que la commande est créée avant l'appel
2. Vérifier que le numéro de téléphone est au bon format
3. Vérifier les logs de l'Edge Function

### Erreur : "Commande introuvable"

**Cause** : L'ID de commande n'existe pas en base

**Solution** :
1. Vérifier que la commande a bien été créée
2. Vérifier l'ID passé à l'Edge Function
3. Vérifier les permissions RLS sur la table orders

### Paiement bloqué en "pending"

**Cause** : Mode simulation actif

**Solution** :
1. Vérifier que les variables d'environnement sont configurées
2. Si en mode simulation, mettre à jour manuellement en base :
   ```sql
   UPDATE mobile_payments SET status = 'paid', completed_at = NOW() WHERE id = 'xxx';
   UPDATE orders SET payment_status = 'paid', paid_at = NOW() WHERE id = 'xxx';
   ```

### Polling ne fonctionne pas

**Cause** : Erreur dans l'Edge Function de vérification

**Solution** :
1. Ouvrir la console du navigateur
2. Vérifier les erreurs dans les appels API
3. Vérifier les logs de l'Edge Function dans Supabase
4. Vérifier que l'Edge Function est bien déployée

### Paiement expire immédiatement

**Cause** : expires_at mal configuré

**Solution** :
1. Vérifier que expires_at est bien défini à NOW() + 5 minutes
2. Vérifier le fuseau horaire du serveur
3. Vérifier la logique de comparaison des dates

---

## 🔒 Sécurité

### Validation des Numéros

- **Format** : Uniquement des chiffres
- **Longueur** : 8-10 chiffres
- **Code pays** : Préfixes valides uniquement
- **Nettoyage** : Suppression des espaces et tirets

### Protection des Données

- **Numéros de téléphone** : Stockés en clair (nécessaire pour le paiement)
- **Pas de code PIN** : Jamais stocké ni transmis
- **RLS activé** : Les utilisateurs ne voient que leurs paiements
- **Service role** : Seules les Edge Functions peuvent modifier les paiements

### Expiration

- **Délai** : 5 minutes maximum
- **Vérification** : À chaque polling
- **Nettoyage** : Statut mis à jour automatiquement

### Prévention des Doublons

- **Transaction ID unique** : Contrainte UNIQUE en base
- **Vérification du statut** : Avant toute mise à jour
- **Condition WHERE** : Empêche les mises à jour multiples

---

## 📞 Support

### Wave
- Site : https://www.wave.com
- Support : support@wave.com

### Orange Money
- Site : https://www.orange.com/en/orange-money
- API : https://developer.orange.com
- Support : https://developer.orange.com/support

### KobeTii
- Support : support@kobetii.com

---

## 🚀 Prochaines Étapes

### Priorité Haute

1. **Webhooks** :
   - Créer les Edge Functions webhook pour Wave et Orange Money
   - Recevoir les notifications en temps réel
   - Mettre à jour les paiements automatiquement

2. **Tests Réels** :
   - Obtenir un accès API Wave
   - Tester avec l'API Orange Money sandbox
   - Valider le flux complet

3. **Gestion des Erreurs** :
   - Améliorer les messages d'erreur
   - Ajouter des logs détaillés
   - Implémenter des retry automatiques

### Priorité Moyenne

4. **Historique des Paiements** :
   - Page listant tous les paiements mobiles
   - Filtres par statut et date
   - Export en PDF

5. **Notifications** :
   - Email de confirmation de paiement
   - SMS de confirmation
   - Notifications push

6. **Statistiques** :
   - Dashboard des paiements mobiles
   - Taux de succès par méthode
   - Montants par période

### Priorité Basse

7. **Autres Méthodes** :
   - Free Money
   - E-money
   - Wizall

8. **Remboursements** :
   - Initier un remboursement
   - Suivre le statut du remboursement
   - Historique des remboursements

---

**Date de création** : 2026-04-27  
**Version** : v45  
**Type** : Progressive Web App (PWA)  
**Plateforme** : KobeTii Mobile Client - Paiements Mobiles

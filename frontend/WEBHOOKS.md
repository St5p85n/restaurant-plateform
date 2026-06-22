# Webhooks Wave et Orange Money - KobeTii

## 📡 Vue d'Ensemble

Système de webhooks pour recevoir les notifications de paiement en temps réel depuis Wave et Orange Money, mettre à jour automatiquement les statuts des paiements et des commandes, valider les signatures pour la sécurité, et logger toutes les notifications pour l'audit.

---

## 🎯 Fonctionnalités

### 1. Réception des Notifications

- **Endpoints dédiés** pour Wave et Orange Money
- **Traitement asynchrone** des notifications
- **Réponse immédiate** (200 OK) pour éviter les timeouts
- **Support JSON et form-urlencoded** (Orange Money)

### 2. Validation des Signatures

- **HMAC SHA-256** pour vérifier l'authenticité
- **Secrets configurables** par fournisseur
- **Rejet automatique** des signatures invalides
- **Mode développement** sans signature

### 3. Mise à Jour Automatique

- **Paiements mobiles** : Statut mis à jour automatiquement
- **Commandes** : payment_status et paid_at mis à jour si payé
- **Prévention des doublons** avec condition WHERE
- **Gestion des statuts** : paid, failed, processing

### 4. Logging Complet

- **Toutes les notifications** loggées dans webhook_logs
- **Informations capturées** :
  - Payload complet
  - Signature reçue et validité
  - Statut du traitement
  - Temps de traitement (ms)
  - Messages d'erreur
- **Accessible aux super_admins** uniquement

---

## 📂 Structure des Fichiers

### Edge Functions
```
supabase/functions/
├── wave_webhook/
│   └── index.ts                    # Webhook Wave
└── orange_money_webhook/
    └── index.ts                    # Webhook Orange Money
```

### Base de Données
```
supabase/migrations/
└── create_webhook_logs_table.sql
```

---

## 🗄️ Base de Données

### Table `webhook_logs`

```sql
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES mobile_payments(id) ON DELETE SET NULL,
    provider payment_provider NOT NULL,  -- 'wave', 'orange_money', 'stripe'
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    signature TEXT,
    signature_valid BOOLEAN,
    status webhook_status NOT NULL DEFAULT 'received',  -- 'received', 'processed', 'failed', 'ignored'
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);
```

### Index
```sql
CREATE INDEX idx_webhook_logs_payment_id ON webhook_logs(payment_id);
CREATE INDEX idx_webhook_logs_provider ON webhook_logs(provider);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
```

### Statuts de Webhook

- **received** : Notification reçue mais pas encore traitée
- **processed** : Notification traitée avec succès
- **failed** : Erreur lors du traitement
- **ignored** : Notification ignorée (doublon, etc.)

---

## 🔌 Endpoints Webhook

### 1. Wave Webhook

**URL** : `https://votre-projet.supabase.co/functions/v1/wave_webhook`

**Méthode** : POST

**Headers** :
```
Content-Type: application/json
X-Wave-Signature: <signature_hmac_sha256>
```

**Payload Attendu** :
```json
{
  "event": "payment.success",
  "data": {
    "id": "wave_payment_id",
    "reference": "WAVE_1234567890_abc123",
    "amount": 15000,
    "currency": "XOF",
    "status": "completed",
    "phone": "+221771234567",
    "created_at": "2026-04-27T12:30:00Z",
    "completed_at": "2026-04-27T12:32:15Z"
  }
}
```

**Statuts Reconnus** :
- `completed`, `success`, `successful` → Paiement réussi
- `failed`, `rejected`, `cancelled` → Paiement échoué
- Autres → En cours de traitement

**Réponse Succès** :
```json
{
  "received": true,
  "paymentId": "uuid-du-paiement"
}
```

**Réponse Erreur** :
```json
{
  "error": "Description de l'erreur"
}
```

### 2. Orange Money Webhook

**URL** : `https://votre-projet.supabase.co/functions/v1/orange_money_webhook`

**Méthode** : POST

**Headers** :
```
Content-Type: application/json
X-Orange-Signature: <signature_hmac_sha256>
```

**Payload Attendu (JSON)** :
```json
{
  "order_id": "OM_1234567890_xyz789",
  "amount": 15000,
  "status": "SUCCESS",
  "pay_token": "orange_payment_token",
  "txnid": "orange_transaction_id",
  "payment_method": "orange_money",
  "currency": "XOF",
  "notif_date": "2026-04-27T12:32:15Z"
}
```

**Payload Attendu (Form-Urlencoded)** :
```
order_id=OM_1234567890_xyz789&amount=15000&status=SUCCESS&pay_token=orange_payment_token&txnid=orange_transaction_id
```

**Statuts Reconnus** :
- `SUCCESS`, `SUCCESSFUL`, `COMPLETED` → Paiement réussi
- `FAILED`, `EXPIRED`, `CANCELLED` → Paiement échoué
- Autres → En cours de traitement

**Réponse Succès** :
```json
{
  "received": true,
  "paymentId": "uuid-du-paiement"
}
```

**Réponse Erreur** :
```json
{
  "error": "Description de l'erreur"
}
```

---

## 🔒 Validation des Signatures

### Algorithme HMAC SHA-256

Les webhooks utilisent HMAC SHA-256 pour garantir l'authenticité des notifications.

### Génération de la Signature (Côté Fournisseur)

```javascript
const crypto = require('crypto');

const payload = JSON.stringify(data);
const secret = 'votre_webhook_secret';

const signature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');
```

### Vérification de la Signature (Côté Serveur)

```typescript
async function verifySignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return expectedSignature === signature;
}
```

### Headers de Signature

- **Wave** : `X-Wave-Signature` ou `Wave-Signature`
- **Orange Money** : `X-Orange-Signature` ou `Orange-Signature`

---

## ⚙️ Configuration

### Variables d'Environnement

#### Wave Webhook Secret

```
WAVE_WEBHOOK_SECRET=votre_secret_wave
```

Configuration dans Supabase :
```
Project Settings → Edge Functions → Secrets
Name: WAVE_WEBHOOK_SECRET
Value: <secret fourni par Wave>
```

#### Orange Money Webhook Secret

```
ORANGE_MONEY_WEBHOOK_SECRET=votre_secret_orange_money
```

Configuration dans Supabase :
```
Project Settings → Edge Functions → Secrets
Name: ORANGE_MONEY_WEBHOOK_SECRET
Value: <secret fourni par Orange Money>
```

### Configuration chez les Fournisseurs

#### Wave

1. **Se connecter** au dashboard Wave
2. **Aller dans** Paramètres → Webhooks
3. **Ajouter un webhook** :
   - URL : `https://votre-projet.supabase.co/functions/v1/wave_webhook`
   - Événements : `payment.success`, `payment.failed`
   - Secret : Généré automatiquement
4. **Copier le secret** et l'ajouter dans Supabase

#### Orange Money

1. **Se connecter** au portail développeur Orange
2. **Aller dans** Mon Application → Webhooks
3. **Configurer l'URL de notification** :
   - URL : `https://votre-projet.supabase.co/functions/v1/orange_money_webhook`
4. **Configurer le secret** (si disponible)
5. **Sauvegarder** la configuration

---

## 🔄 Flux de Traitement

### Scénario : Notification Wave

1. **Client confirme** le paiement sur son téléphone Wave
2. **Wave envoie** une notification POST au webhook
3. **Webhook reçoit** la notification :
   - Timestamp de début enregistré
   - Payload parsé
   - Signature extraite des headers
4. **Validation de la signature** :
   - Si secret configuré : Vérification HMAC SHA-256
   - Si signature invalide : Retour 401, log 'failed'
   - Si signature manquante : Retour 401, log 'failed'
5. **Extraction des données** :
   - Transaction ID (reference)
   - Statut (status)
6. **Recherche du paiement** :
   - Query sur mobile_payments par transaction_id
   - Si introuvable : Log 'failed', retour 500
7. **Vérification du statut actuel** :
   - Si déjà 'paid' : Log 'processed', retour 200 (idempotence)
8. **Mapping du statut** :
   - 'completed'/'success' → 'paid'
   - 'failed'/'rejected' → 'failed'
   - Autres → 'processing'
9. **Mise à jour du paiement** :
   - mobile_payments.status → nouveau statut
   - mobile_payments.completed_at → NOW()
   - mobile_payments.provider_response → payload complet
   - Condition WHERE : status = ancien statut (prévention doublons)
10. **Mise à jour de la commande** (si paid) :
    - orders.payment_status → 'paid'
    - orders.paid_at → NOW()
    - Condition WHERE : payment_status = 'unpaid'
11. **Logging** :
    - webhook_logs.payment_id → ID du paiement
    - webhook_logs.provider → 'wave'
    - webhook_logs.event_type → 'payment.success'
    - webhook_logs.payload → payload complet
    - webhook_logs.signature → signature reçue
    - webhook_logs.signature_valid → true/false
    - webhook_logs.status → 'processed'
    - webhook_logs.processing_time_ms → temps écoulé
12. **Réponse** : 200 OK avec { received: true, paymentId: "..." }

### Scénario : Notification Orange Money

Le flux est identique à Wave, avec ces différences :

- **Payload** : Peut être JSON ou form-urlencoded
- **Parsing** : Tentative JSON d'abord, puis URLSearchParams
- **Statuts** : 'SUCCESS'/'SUCCESSFUL' → 'paid', 'FAILED'/'EXPIRED' → 'failed'
- **Provider** : 'orange_money' dans les logs

---

## 🧪 Tests

### Test 1 : Webhook Wave avec Signature Valide

**Commande curl** :
```bash
# Générer la signature
PAYLOAD='{"event":"payment.success","data":{"id":"wave_123","reference":"WAVE_1234567890_abc123","amount":15000,"currency":"XOF","status":"completed","phone":"+221771234567","created_at":"2026-04-27T12:30:00Z","completed_at":"2026-04-27T12:32:15Z"}}'
SECRET="votre_secret_wave"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

# Envoyer le webhook
curl -X POST https://votre-projet.supabase.co/functions/v1/wave_webhook \
  -H "Content-Type: application/json" \
  -H "X-Wave-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

**Résultat Attendu** :
```json
{
  "received": true,
  "paymentId": "uuid-du-paiement"
}
```

**Vérifications** :
```sql
-- Vérifier le paiement
SELECT status, completed_at FROM mobile_payments WHERE transaction_id = 'WAVE_1234567890_abc123';
-- Résultat : status = 'paid', completed_at = NOW()

-- Vérifier la commande
SELECT payment_status, paid_at FROM orders WHERE id = (SELECT order_id FROM mobile_payments WHERE transaction_id = 'WAVE_1234567890_abc123');
-- Résultat : payment_status = 'paid', paid_at = NOW()

-- Vérifier le log
SELECT * FROM webhook_logs WHERE provider = 'wave' ORDER BY created_at DESC LIMIT 1;
-- Résultat : status = 'processed', signature_valid = true
```

### Test 2 : Webhook Wave avec Signature Invalide

**Commande curl** :
```bash
PAYLOAD='{"event":"payment.success","data":{"reference":"WAVE_1234567890_abc123","status":"completed"}}'
SIGNATURE="signature_invalide"

curl -X POST https://votre-projet.supabase.co/functions/v1/wave_webhook \
  -H "Content-Type: application/json" \
  -H "X-Wave-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

**Résultat Attendu** :
```json
{
  "error": "Signature invalide"
}
```

**Code HTTP** : 401

**Vérifications** :
```sql
SELECT * FROM webhook_logs WHERE provider = 'wave' ORDER BY created_at DESC LIMIT 1;
-- Résultat : status = 'failed', signature_valid = false, error_message = 'Signature invalide'
```

### Test 3 : Webhook Orange Money (JSON)

**Commande curl** :
```bash
PAYLOAD='{"order_id":"OM_1234567890_xyz789","amount":15000,"status":"SUCCESS","pay_token":"token123","txnid":"txn456"}'
SECRET="votre_secret_orange_money"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

curl -X POST https://votre-projet.supabase.co/functions/v1/orange_money_webhook \
  -H "Content-Type: application/json" \
  -H "X-Orange-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

**Résultat Attendu** :
```json
{
  "received": true,
  "paymentId": "uuid-du-paiement"
}
```

### Test 4 : Webhook Orange Money (Form-Urlencoded)

**Commande curl** :
```bash
PAYLOAD="order_id=OM_1234567890_xyz789&amount=15000&status=SUCCESS&pay_token=token123"
SECRET="votre_secret_orange_money"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

curl -X POST https://votre-projet.supabase.co/functions/v1/orange_money_webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Orange-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

**Résultat Attendu** :
```json
{
  "received": true,
  "paymentId": "uuid-du-paiement"
}
```

### Test 5 : Webhook sans Secret (Mode Développement)

Si les secrets ne sont pas configurés, les webhooks acceptent toutes les notifications sans vérification de signature.

**Commande curl** :
```bash
curl -X POST https://votre-projet.supabase.co/functions/v1/wave_webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.success","data":{"reference":"WAVE_TEST","status":"completed"}}'
```

**Résultat Attendu** :
```json
{
  "received": true,
  "paymentId": "uuid-du-paiement"
}
```

**⚠️ ATTENTION** : Ce mode est uniquement pour le développement. En production, TOUJOURS configurer les secrets.

### Test 6 : Idempotence (Doublon)

**Scénario** : Envoyer deux fois la même notification

**Commande curl** :
```bash
# Première fois
curl -X POST https://votre-projet.supabase.co/functions/v1/wave_webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.success","data":{"reference":"WAVE_IDEMPOTENT","status":"completed"}}'

# Deuxième fois (même payload)
curl -X POST https://votre-projet.supabase.co/functions/v1/wave_webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.success","data":{"reference":"WAVE_IDEMPOTENT","status":"completed"}}'
```

**Résultat Attendu** :
- Première fois : Paiement mis à jour, log 'processed'
- Deuxième fois : Paiement déjà 'paid', log 'processed', pas de mise à jour

**Vérifications** :
```sql
-- Vérifier qu'il n'y a qu'une seule mise à jour
SELECT COUNT(*) FROM webhook_logs WHERE payload->>'data'->>'reference' = 'WAVE_IDEMPOTENT';
-- Résultat : 2 (deux logs)

-- Vérifier que le paiement n'a été mis à jour qu'une fois
SELECT status, completed_at FROM mobile_payments WHERE transaction_id = 'WAVE_IDEMPOTENT';
-- Résultat : status = 'paid', completed_at = <première notification>
```

---

## 📊 Monitoring et Audit

### Consulter les Logs de Webhook

**Tous les webhooks reçus** :
```sql
SELECT 
    id,
    provider,
    event_type,
    status,
    signature_valid,
    processing_time_ms,
    created_at
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 100;
```

**Webhooks échoués** :
```sql
SELECT 
    id,
    provider,
    event_type,
    error_message,
    payload,
    created_at
FROM webhook_logs
WHERE status = 'failed'
ORDER BY created_at DESC;
```

**Webhooks par fournisseur** :
```sql
SELECT 
    provider,
    status,
    COUNT(*) as count
FROM webhook_logs
GROUP BY provider, status
ORDER BY provider, status;
```

**Temps de traitement moyen** :
```sql
SELECT 
    provider,
    AVG(processing_time_ms) as avg_time_ms,
    MAX(processing_time_ms) as max_time_ms,
    MIN(processing_time_ms) as min_time_ms
FROM webhook_logs
WHERE status = 'processed'
GROUP BY provider;
```

**Webhooks avec signature invalide** :
```sql
SELECT 
    id,
    provider,
    signature,
    payload,
    created_at
FROM webhook_logs
WHERE signature_valid = false
ORDER BY created_at DESC;
```

### Dashboard de Monitoring

**Statistiques quotidiennes** :
```sql
SELECT 
    DATE(created_at) as date,
    provider,
    status,
    COUNT(*) as count
FROM webhook_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), provider, status
ORDER BY date DESC, provider, status;
```

**Taux de succès** :
```sql
SELECT 
    provider,
    COUNT(*) FILTER (WHERE status = 'processed') as success,
    COUNT(*) FILTER (WHERE status = 'failed') as failed,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE status = 'processed') / COUNT(*),
        2
    ) as success_rate
FROM webhook_logs
GROUP BY provider;
```

---

## 🐛 Dépannage

### Erreur : "Signature invalide"

**Cause** : La signature HMAC ne correspond pas

**Solutions** :
1. Vérifier que le secret est correct dans Supabase
2. Vérifier que le fournisseur utilise le même secret
3. Vérifier que le payload n'est pas modifié (espaces, encodage)
4. Vérifier l'algorithme (doit être HMAC SHA-256)
5. Consulter les logs :
   ```sql
   SELECT signature, payload FROM webhook_logs WHERE signature_valid = false ORDER BY created_at DESC LIMIT 1;
   ```

### Erreur : "Paiement introuvable"

**Cause** : Le transaction_id ne correspond à aucun paiement en base

**Solutions** :
1. Vérifier que le paiement a bien été créé
2. Vérifier le transaction_id dans le payload
3. Vérifier la correspondance entre le payload et la base :
   ```sql
   SELECT transaction_id FROM mobile_payments WHERE transaction_id LIKE 'WAVE%' ORDER BY created_at DESC LIMIT 10;
   ```
4. Consulter le payload du webhook :
   ```sql
   SELECT payload FROM webhook_logs WHERE status = 'failed' AND error_message = 'Paiement introuvable' ORDER BY created_at DESC LIMIT 1;
   ```

### Erreur : "Transaction ID manquant"

**Cause** : Le payload ne contient pas le champ requis

**Solutions** :
1. Vérifier le format du payload
2. Pour Wave : Vérifier `data.reference`
3. Pour Orange Money : Vérifier `order_id`
4. Consulter le payload reçu :
   ```sql
   SELECT payload FROM webhook_logs WHERE error_message = 'Transaction ID manquant' ORDER BY created_at DESC LIMIT 1;
   ```

### Webhook non reçu

**Cause** : Le fournisseur n'envoie pas la notification

**Solutions** :
1. Vérifier la configuration de l'URL webhook chez le fournisseur
2. Vérifier que l'URL est accessible publiquement
3. Tester manuellement avec curl
4. Consulter les logs du fournisseur (si disponibles)
5. Vérifier les règles de firewall

### Paiement non mis à jour

**Cause** : Le webhook est reçu mais le paiement n'est pas mis à jour

**Solutions** :
1. Vérifier les logs de webhook :
   ```sql
   SELECT status, error_message FROM webhook_logs WHERE payment_id = 'uuid-du-paiement' ORDER BY created_at DESC;
   ```
2. Vérifier le statut du paiement :
   ```sql
   SELECT status FROM mobile_payments WHERE id = 'uuid-du-paiement';
   ```
3. Vérifier la condition WHERE (prévention doublons)
4. Consulter les logs de l'Edge Function dans Supabase

---

## 🔒 Sécurité

### Validation des Signatures

- **HMAC SHA-256** : Algorithme cryptographique robuste
- **Secrets uniques** : Un secret différent par fournisseur
- **Vérification systématique** : Toutes les notifications sont vérifiées
- **Rejet immédiat** : Signatures invalides rejetées avec 401

### Protection contre les Attaques

- **Replay attacks** : Idempotence via vérification du statut actuel
- **Man-in-the-middle** : HTTPS obligatoire
- **Injection SQL** : Paramètres bindés dans les requêtes
- **DoS** : Rate limiting au niveau de Supabase

### Logging et Audit

- **Toutes les notifications** loggées
- **Signatures invalides** enregistrées
- **Temps de traitement** mesuré
- **Accessible aux super_admins** uniquement

### Bonnes Pratiques

1. **Toujours configurer les secrets** en production
2. **Vérifier les signatures** systématiquement
3. **Monitorer les logs** régulièrement
4. **Alerter** sur les signatures invalides
5. **Tester** les webhooks avant la mise en production
6. **Documenter** les formats de payload attendus
7. **Versionner** les webhooks si nécessaire

---

## 📈 Métriques

### Statistiques Actuelles

- **2 Edge Functions** : wave_webhook, orange_money_webhook
- **1 table** : webhook_logs
- **2 enums** : payment_provider, webhook_status
- **5 index** : Optimisation des recherches
- **4 statuts** : received, processed, failed, ignored
- **3 fournisseurs** : wave, orange_money, stripe
- **HMAC SHA-256** : Algorithme de signature
- **Idempotence** : Gestion des doublons

---

## 🚀 Prochaines Étapes

### Priorité Haute

1. **Retry automatique** :
   - Réessayer les webhooks échoués
   - Backoff exponentiel
   - Limite de tentatives

2. **Alertes** :
   - Email si signature invalide
   - Slack si taux d'échec > 5%
   - SMS si webhook critique échoue

3. **Dashboard** :
   - Interface admin pour voir les logs
   - Graphiques de monitoring
   - Filtres et recherche

### Priorité Moyenne

4. **Webhooks Stripe** :
   - Créer stripe_webhook Edge Function
   - Gérer les événements Stripe
   - Logger dans webhook_logs

5. **Replay manuel** :
   - Interface pour rejouer un webhook
   - Utile pour le debugging
   - Historique des replays

6. **Tests automatisés** :
   - Suite de tests pour les webhooks
   - Simulation de payloads
   - Vérification des mises à jour

### Priorité Basse

7. **Webhooks sortants** :
   - Notifier d'autres services
   - Webhooks personnalisés
   - Configuration par restaurant

8. **Versioning** :
   - Support de plusieurs versions
   - Migration progressive
   - Dépréciation gracieuse

---

## 📞 Support

### Wave
- Dashboard : https://dashboard.wave.com
- Support : support@wave.com
- Documentation : (non publique)

### Orange Money
- Portail développeur : https://developer.orange.com
- Support : https://developer.orange.com/support
- Documentation : https://developer.orange.com/apis/orange-money-webpay/

### KobeTii
- Support : support@kobetii.com
- Documentation : Ce fichier

---

**Date de création** : 2026-04-27  
**Version** : v46  
**Type** : Progressive Web App (PWA)  
**Plateforme** : KobeTii Mobile Client - Webhooks Paiements Mobiles

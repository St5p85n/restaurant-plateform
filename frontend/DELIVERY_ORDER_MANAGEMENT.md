# Gestion de Livraison et Commandes - KobeTii

## 🎯 Fonctionnalités Ajoutées

### 1. Gestion des Commandes (Restaurant)
- Page de gestion des commandes avec filtres par statut
- Changement de statut des commandes
- Assignation de livreurs aux commandes
- Suivi de la livraison en temps réel
- Vue détaillée de chaque commande avec adresse et livreur

### 2. Gestion des Livreurs (Restaurant)
- Page de gestion de l'équipe de livraison
- Ajout/modification/suppression de livreurs
- Gestion des statuts (disponible, occupé, hors ligne)
- Informations sur les véhicules
- Assignation automatique aux commandes

### 3. Annulation et Modification de Commandes (Client)
- Possibilité d'annuler une commande en attente
- Bouton d'annulation avec confirmation
- Restrictions selon le statut de la commande
- Feedback visuel clair

---

## 📊 Base de Données

### Migration: `add_delivery_management_v2`

#### Nouvelle Table: `delivery_personnel`

```sql
CREATE TABLE delivery_personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  vehicle_type text, -- 'bike', 'motorcycle', 'car', 'scooter'
  vehicle_number text,
  status text DEFAULT 'available', -- 'available', 'busy', 'offline'
  current_location jsonb, -- {lat, lng}
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Champs:**
- `id`: Identifiant unique du livreur
- `restaurant_id`: Restaurant auquel appartient le livreur
- `profile_id`: Lien vers le profil utilisateur (optionnel)
- `full_name`: Nom complet du livreur
- `phone`: Numéro de téléphone
- `vehicle_type`: Type de véhicule (vélo, moto, scooter, voiture)
- `vehicle_number`: Numéro d'immatriculation
- `status`: Statut actuel (disponible, occupé, hors ligne)
- `current_location`: Position GPS actuelle (pour suivi en temps réel)
- `is_active`: Livreur actif ou non

#### Modification Table: `orders`

```sql
ALTER TABLE orders ADD COLUMN delivery_person_id uuid REFERENCES delivery_personnel(id);
```

**Nouveau champ:**
- `delivery_person_id`: Livreur assigné à la commande

#### Index pour Performance

```sql
CREATE INDEX idx_delivery_personnel_restaurant ON delivery_personnel(restaurant_id);
CREATE INDEX idx_delivery_personnel_status ON delivery_personnel(status);
CREATE INDEX idx_orders_delivery_person ON orders(delivery_person_id);
CREATE INDEX idx_orders_status ON orders(status);
```

---

## 🔒 Politiques RLS

### Table `delivery_personnel`

#### 1. Lecture pour le Personnel Restaurant

```sql
CREATE POLICY "Restaurant staff can view their delivery personnel"
ON delivery_personnel
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.restaurant_id = delivery_personnel.restaurant_id
  )
);
```

**Permet:** Personnel du restaurant de voir les livreurs de leur restaurant

#### 2. Gestion pour Propriétaires et Gérants

```sql
CREATE POLICY "Restaurant staff can manage delivery personnel"
ON delivery_personnel
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.restaurant_id = delivery_personnel.restaurant_id
    AND profiles.role IN ('owner', 'manager')
  )
);
```

**Permet:** Propriétaires et gérants de créer, modifier et supprimer des livreurs

#### 3. Accès Super Admin

```sql
CREATE POLICY "Super admin has full access to delivery personnel"
ON delivery_personnel
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()));
```

**Permet:** Super admin d'accéder à tous les livreurs

### Table `orders`

#### 1. Annulation par les Clients

```sql
CREATE POLICY "Customers can cancel their pending orders"
ON orders
FOR UPDATE
TO authenticated
USING (
  customer_id = auth.uid() 
  AND status = 'pending'
)
WITH CHECK (
  customer_id = auth.uid() 
  AND status IN ('pending', 'cancelled')
);
```

**Permet:** Clients d'annuler leurs commandes en attente uniquement

#### 2. Mise à Jour par le Personnel Restaurant

```sql
CREATE POLICY "Restaurant staff can update orders"
ON orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.restaurant_id = orders.restaurant_id
  )
);
```

**Permet:** Personnel du restaurant de mettre à jour toutes les commandes de leur restaurant

---

## 📄 Nouveaux Fichiers

### 1. OrderManagementPage.tsx

**Emplacement:** `src/pages/OrderManagementPage.tsx`

**Fonctionnalités:**
- Liste des commandes avec filtres par statut
- Affichage des détails de commande
- Changement de statut de commande
- Assignation de livreurs
- Changement de statut de livraison
- Affichage de l'adresse de livraison
- Affichage du livreur assigné

**Composants utilisés:**
- Card, CardContent, CardHeader, CardTitle, CardDescription
- Button, Badge
- Select, SelectContent, SelectItem, SelectTrigger, SelectValue
- Dialog pour l'assignation de livreurs

**Statuts de commande:**
- `pending`: En attente
- `in_progress`: En préparation
- `ready`: Prêt
- `served`: Servi
- `paid`: Payé
- `completed`: Terminé
- `cancelled`: Annulé

**Statuts de livraison:**
- `pending`: En attente
- `assigned`: Assigné
- `picked_up`: Récupéré
- `in_transit`: En route
- `delivered`: Livré
- `failed`: Échec

### 2. DeliveryManagementPage.tsx

**Emplacement:** `src/pages/DeliveryManagementPage.tsx`

**Fonctionnalités:**
- Liste des livreurs
- Ajout de nouveaux livreurs
- Modification des livreurs existants
- Suppression de livreurs
- Changement de statut (disponible, occupé, hors ligne)
- Gestion des informations de véhicule

**Formulaire de livreur:**
- Nom complet (requis)
- Téléphone (requis)
- Type de véhicule (optionnel)
- Numéro de véhicule (optionnel)
- Statut (disponible par défaut)

**Types de véhicules:**
- `bike`: Vélo
- `motorcycle`: Moto
- `scooter`: Scooter
- `car`: Voiture

### 3. ClientDashboardPage.tsx (Amélioré)

**Modifications:**
- Ajout du bouton d'annulation de commande
- Dialog de confirmation avant annulation
- Fonction `cancelOrder()` pour annuler une commande
- Fonction `canCancelOrder()` pour vérifier si l'annulation est possible
- Fonction `canModifyOrder()` pour vérifier si la modification est possible

**Conditions d'annulation:**
- Statut de commande = `pending`
- Statut de livraison = `pending`
- Client doit être le propriétaire de la commande

---

## 🎨 Types TypeScript

### Nouveaux Types

```typescript
export type DeliveryStatus = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
export type DeliveryPersonnelStatus = 'available' | 'busy' | 'offline';
export type VehicleType = 'bike' | 'motorcycle' | 'car' | 'scooter';
```

### Nouvelles Interfaces

```typescript
export interface DeliveryPersonnel {
  id: string;
  restaurant_id: string;
  profile_id: string | null;
  full_name: string;
  phone: string;
  vehicle_type: VehicleType | null;
  vehicle_number: string | null;
  status: DeliveryPersonnelStatus;
  current_location: { lat: number; lng: number } | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryAddress {
  id: string;
  customer_id: string;
  label: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postal_code: string | null;
  country: string;
  phone: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}
```

### Interface Order Étendue

```typescript
export interface Order {
  // ... champs existants
  delivery_status: string | null;
  delivery_address_id: string | null;
  delivery_notes: string | null;
  delivery_person_id: string | null;
  estimated_delivery_time: string | null;
  delivered_at: string | null;
  order_type: string | null;
}
```

---

## 🛣️ Nouvelles Routes

### Routes Restaurant

```typescript
{
  name: 'Order Management',
  path: '/dashboard/orders',
  element: <RestaurantLayout><OrderManagementPage /></RestaurantLayout>,
  public: false,
}

{
  name: 'Delivery Management',
  path: '/dashboard/delivery',
  element: <RestaurantLayout><DeliveryManagementPage /></RestaurantLayout>,
  public: false,
}
```

### Navigation Restaurant

**Ajouts dans RestaurantLayout:**
- **Commandes** (`/dashboard/orders`) - Icône: ClipboardList
  - Rôles: owner, manager, server
- **Livraison** (`/dashboard/delivery`) - Icône: Truck
  - Rôles: owner, manager

---

## 🔄 Flux de Travail

### 1. Gestion des Livreurs

**Étape 1: Ajouter des livreurs**
1. Aller sur `/dashboard/delivery`
2. Cliquer sur "Ajouter un livreur"
3. Remplir le formulaire:
   - Nom complet
   - Téléphone
   - Type de véhicule (optionnel)
   - Numéro de véhicule (optionnel)
   - Statut (disponible par défaut)
4. Cliquer sur "Ajouter"

**Étape 2: Gérer les statuts**
- Changer le statut d'un livreur via le dropdown
- Statuts disponibles:
  - Disponible: Prêt à prendre une livraison
  - Occupé: En cours de livraison
  - Hors ligne: Non disponible

### 2. Gestion des Commandes

**Étape 1: Voir les commandes**
1. Aller sur `/dashboard/orders`
2. Filtrer par statut si nécessaire
3. Voir la liste des commandes avec:
   - Numéro de commande
   - Date et heure
   - Type (sur place / livraison)
   - Montant total
   - Statut de commande
   - Statut de livraison

**Étape 2: Changer le statut de commande**
1. Sélectionner le nouveau statut dans le dropdown
2. Le statut est mis à jour automatiquement
3. Progression typique:
   - En attente → En préparation → Prêt → Servi → Payé → Terminé

**Étape 3: Assigner un livreur (pour livraisons)**
1. Cliquer sur "Assigner un livreur"
2. Sélectionner un livreur disponible
3. Le livreur est assigné et son statut passe à "Occupé"
4. Le statut de livraison passe à "Assigné"

**Étape 4: Suivre la livraison**
1. Changer le statut de livraison via le dropdown
2. Progression typique:
   - En attente → Assigné → Récupéré → En route → Livré

### 3. Annulation de Commande (Client)

**Conditions:**
- Commande doit être en statut `pending`
- Livraison doit être en statut `pending`

**Étapes:**
1. Aller sur `/client/dashboard`
2. Trouver la commande à annuler
3. Cliquer sur le bouton "Annuler"
4. Confirmer l'annulation dans le dialog
5. La commande passe en statut `cancelled`

---

## 🧪 Tests Recommandés

### Test 1: Gestion des Livreurs

**Étapes:**
1. Se connecter en tant que gérant
2. Aller sur `/dashboard/delivery`
3. ✅ Vérifier que la page se charge
4. Cliquer sur "Ajouter un livreur"
5. Remplir le formulaire avec:
   - Nom: "Jean Dupont"
   - Téléphone: "+221 77 123 45 67"
   - Véhicule: "Moto"
   - Numéro: "DK-1234-AB"
6. ✅ Vérifier que le livreur est ajouté
7. Changer le statut à "Occupé"
8. ✅ Vérifier que le statut est mis à jour
9. Modifier le livreur
10. ✅ Vérifier que les modifications sont sauvegardées
11. Supprimer le livreur
12. ✅ Vérifier que le livreur est supprimé

### Test 2: Gestion des Commandes

**Étapes:**
1. Se connecter en tant que gérant
2. Aller sur `/dashboard/orders`
3. ✅ Vérifier que les commandes s'affichent
4. Filtrer par statut "En attente"
5. ✅ Vérifier que seules les commandes en attente s'affichent
6. Sélectionner une commande de livraison
7. ✅ Vérifier que l'adresse de livraison s'affiche
8. Cliquer sur "Assigner un livreur"
9. ✅ Vérifier que la liste des livreurs disponibles s'affiche
10. Sélectionner un livreur
11. ✅ Vérifier que le livreur est assigné
12. ✅ Vérifier que le statut de livraison passe à "Assigné"
13. Changer le statut de commande à "En préparation"
14. ✅ Vérifier que le statut est mis à jour
15. Changer le statut de livraison à "En route"
16. ✅ Vérifier que le statut est mis à jour

### Test 3: Annulation de Commande (Client)

**Étapes:**
1. Se connecter en tant que client
2. Passer une commande
3. Aller sur `/client/dashboard`
4. ✅ Vérifier que la commande s'affiche
5. ✅ Vérifier que le bouton "Annuler" est visible
6. Cliquer sur "Annuler"
7. ✅ Vérifier que le dialog de confirmation s'affiche
8. Confirmer l'annulation
9. ✅ Vérifier que la commande passe en statut "Annulé"
10. ✅ Vérifier que le bouton "Annuler" n'est plus visible

### Test 4: Restrictions d'Annulation

**Étapes:**
1. Se connecter en tant que client
2. Aller sur `/client/dashboard`
3. Trouver une commande en statut "En préparation"
4. ✅ Vérifier que le bouton "Annuler" n'est PAS visible
5. Trouver une commande en statut "Livré"
6. ✅ Vérifier que le bouton "Annuler" n'est PAS visible

### Test 5: Politiques RLS

**Test SQL:**
```sql
-- En tant que client, essayer d'annuler une commande d'un autre client
UPDATE orders 
SET status = 'cancelled' 
WHERE customer_id != auth.uid();
-- ❌ Devrait échouer avec erreur RLS

-- En tant que client, annuler sa propre commande pending
UPDATE orders 
SET status = 'cancelled' 
WHERE customer_id = auth.uid() AND status = 'pending';
-- ✅ Devrait réussir

-- En tant que personnel restaurant, voir les livreurs d'un autre restaurant
SELECT * FROM delivery_personnel 
WHERE restaurant_id != (SELECT restaurant_id FROM profiles WHERE id = auth.uid());
-- ❌ Devrait retourner 0 résultats
```

---

## 📊 Statistiques et Métriques

### Métriques de Livraison

**À implémenter (optionnel):**
- Nombre de livraisons par livreur
- Temps moyen de livraison
- Taux de réussite des livraisons
- Distance parcourue par livreur
- Commandes en cours de livraison

### Dashboard Livreur

**À implémenter (optionnel):**
- Vue pour les livreurs
- Liste des livraisons assignées
- Navigation GPS vers l'adresse
- Bouton pour changer le statut de livraison
- Historique des livraisons

---

## 🚀 Prochaines Améliorations

### 1. Suivi GPS en Temps Réel

**Fonctionnalités:**
- Intégration avec une API de cartographie (Google Maps, Mapbox)
- Mise à jour de la position du livreur en temps réel
- Affichage de la position sur une carte pour le client
- Estimation du temps d'arrivée

**Implémentation:**
```typescript
// Mettre à jour la position du livreur
const updateLocation = async (deliveryPersonId: string, lat: number, lng: number) => {
  await supabase
    .from('delivery_personnel')
    .update({ current_location: { lat, lng } })
    .eq('id', deliveryPersonId);
};

// Écouter les changements de position
supabase
  .channel('delivery_tracking')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'delivery_personnel',
    filter: `id=eq.${deliveryPersonId}`
  }, (payload) => {
    // Mettre à jour la carte
  })
  .subscribe();
```

### 2. Notifications Push

**Fonctionnalités:**
- Notification au livreur quand une commande lui est assignée
- Notification au client quand le livreur est en route
- Notification au client quand la livraison est proche
- Notification au restaurant quand la livraison est terminée

### 3. Historique des Livraisons

**Fonctionnalités:**
- Page d'historique pour chaque livreur
- Statistiques de performance
- Évaluations des clients
- Revenus générés

### 4. Optimisation des Routes

**Fonctionnalités:**
- Algorithme pour assigner le livreur le plus proche
- Optimisation des trajets pour plusieurs livraisons
- Prise en compte du trafic en temps réel

### 5. Application Mobile pour Livreurs

**Fonctionnalités:**
- Application dédiée pour les livreurs
- Réception des commandes
- Navigation GPS intégrée
- Changement de statut simplifié
- Historique et statistiques

---

## 💡 Conseils d'Utilisation

### Pour les Restaurants

1. **Ajouter des livreurs avant de commencer**
   - Enregistrer tous vos livreurs dans le système
   - Vérifier leurs informations de contact
   - Assigner les bons types de véhicules

2. **Gérer les statuts en temps réel**
   - Mettre à jour le statut des commandes rapidement
   - Assigner les livreurs dès que la commande est prête
   - Communiquer avec les livreurs pour le suivi

3. **Optimiser les livraisons**
   - Assigner les livreurs les plus proches
   - Grouper les livraisons dans la même zone
   - Prévoir des créneaux de livraison

### Pour les Clients

1. **Annuler rapidement si nécessaire**
   - Annuler dès que possible si vous changez d'avis
   - Une fois la préparation commencée, l'annulation n'est plus possible
   - Contacter le restaurant pour les cas urgents

2. **Suivre votre commande**
   - Vérifier régulièrement le statut
   - Préparer-vous quand le livreur est en route
   - Avoir votre téléphone à portée de main

---

**Date**: 2026-04-27  
**Version**: v21  
**Statut**: ✅ Fonctionnalités de livraison et gestion des commandes implémentées

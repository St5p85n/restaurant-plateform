# Gestion Complète des Utilisateurs et Livreurs - KobeTii

## 🎯 Fonctionnalité Ajoutée

**Besoin:** Gérer de manière unifiée le personnel du restaurant et les livreurs pour optimiser le processus de livraison complet.

**Solution:** Page unifiée de gestion des utilisateurs avec deux onglets distincts :
1. **Personnel Restaurant** - Gérants, chefs, serveurs, comptables
2. **Livreurs** - Gestion complète des livreurs avec statuts en temps réel

---

## 📄 Nouveau Fichier

### UserManagementPage.tsx

**Emplacement:** `src/pages/UserManagementPage.tsx`

**Fonctionnalités Principales:**

#### 1. Interface Unifiée avec Onglets
- ✅ Onglet "Personnel Restaurant" - Gestion des employés
- ✅ Onglet "Livreurs" - Gestion des livreurs
- ✅ Navigation fluide entre les deux sections
- ✅ État persistant lors du changement d'onglet

#### 2. Statistiques en Temps Réel
- ✅ **Personnel Total** - Nombre total d'employés
- ✅ **Livreurs Total** - Nombre total de livreurs
- ✅ **Livreurs Disponibles** - Compteur en vert
- ✅ **Livreurs Occupés** - Compteur en jaune

#### 3. Gestion du Personnel Restaurant

**Fonctionnalités:**
- ✅ Liste complète du personnel avec avatars
- ✅ Recherche par nom ou email
- ✅ Filtrage par rôle (Gérant, Chef, Serveur, Comptable)
- ✅ Badges de rôle colorés
- ✅ Affichage email et téléphone
- ✅ Modification des informations
- ✅ Suppression avec confirmation

**Formulaire Personnel:**
```typescript
{
  email: string;           // Email (obligatoire, non modifiable après création)
  full_name: string;       // Nom complet (obligatoire)
  role: string;            // Rôle (obligatoire)
  phone: string;           // Téléphone (optionnel)
}
```

**Rôles Disponibles:**
- **Gérant** (manager) - Badge default
- **Chef** (chef) - Badge secondary
- **Serveur** (server) - Badge outline
- **Comptable** (accountant) - Badge secondary

**Actions:**
- ✅ Ajouter un personnel (bouton + en haut)
- ✅ Modifier un personnel (icône Edit)
- ✅ Supprimer un personnel (icône Trash avec confirmation)

#### 4. Gestion des Livreurs

**Fonctionnalités:**
- ✅ Liste complète des livreurs avec avatars
- ✅ Recherche par nom ou téléphone
- ✅ Filtrage par statut (Disponible, Occupé, Hors ligne)
- ✅ Badges de statut avec icônes
- ✅ Affichage téléphone, véhicule et numéro
- ✅ Ajout de nouveaux livreurs
- ✅ Modification des informations
- ✅ Suppression avec confirmation

**Formulaire Livreurs:**
```typescript
{
  full_name: string;           // Nom complet (obligatoire)
  phone: string;               // Téléphone (obligatoire)
  vehicle_type: VehicleType;   // Type de véhicule (obligatoire)
  vehicle_number: string;      // Numéro de véhicule (optionnel)
  status: DeliveryPersonnelStatus; // Statut (obligatoire)
}
```

**Types de Véhicules:**
- **Vélo** (bike)
- **Moto** (motorcycle)
- **Scooter** (scooter)
- **Voiture** (car)

**Statuts des Livreurs:**
- **Disponible** (available) - Badge vert avec icône CheckCircle
- **Occupé** (busy) - Badge jaune avec icône Clock
- **Hors ligne** (offline) - Badge gris avec icône Ban

**Actions:**
- ✅ Ajouter un livreur (bouton + en haut)
- ✅ Modifier un livreur (icône Edit)
- ✅ Supprimer un livreur (icône Trash avec confirmation)

#### 5. Recherche et Filtrage

**Personnel Restaurant:**
- Recherche en temps réel par nom ou email
- Filtrage par rôle (Tous, Gérant, Chef, Serveur, Comptable)
- Résultats instantanés

**Livreurs:**
- Recherche en temps réel par nom ou téléphone
- Filtrage par statut (Tous, Disponible, Occupé, Hors ligne)
- Résultats instantanés

#### 6. Design Minimal et Épuré

**Principes Appliqués:**
- ✅ Beaucoup d'espace blanc entre les éléments
- ✅ Hiérarchie claire avec titres et sous-titres
- ✅ Typographie lisible (font-medium, text-sm)
- ✅ Contraste doux avec muted-foreground
- ✅ Pas de shadows excessives
- ✅ Icônes minimalistes (lucide-react)
- ✅ Cards avec padding généreux (p-4)
- ✅ Espacement cohérent (space-y-3, space-y-4, gap-4)

**Couleurs:**
- Background: bg-background
- Cartes: bg-card
- Texte: text-foreground, text-muted-foreground
- Primary: bg-primary, text-primary
- Badges: Variants sémantiques (default, secondary, outline)

---

## 🔧 Modifications des Fichiers Existants

### 1. routes.tsx (Modifié)

**Ajout:** Import et route pour UserManagementPage

**Import ajouté:**
```typescript
import UserManagementPage from './pages/UserManagementPage';
```

**Route ajoutée:**
```typescript
{
  name: 'User Management',
  path: '/dashboard/users',
  element: (
    <RestaurantLayout>
      <UserManagementPage />
    </RestaurantLayout>
  ),
  public: false,
}
```

**Accès:** `/dashboard/users`

**Protection:** Route privée (authentification requise)

### 2. RestaurantLayout.tsx (Modifié)

**Ajout:** Lien de navigation dans la sidebar

**Item de navigation ajouté:**
```typescript
{
  title: 'Utilisateurs & Livreurs',
  href: '/dashboard/users',
  icon: Users,
  roles: ['owner', 'manager'],
}
```

**Position:** Entre "Personnel" et "Finances"

**Accès:** Propriétaire et Gérant uniquement

**Icône:** Users (lucide-react)

---

## 🔄 Flux Utilisateur

### Accès à la Page

**Étape 1: Navigation**
1. Utilisateur se connecte à l'espace restaurant
2. Voit la sidebar avec navigation
3. Clique sur "Utilisateurs & Livreurs"
4. Page s'ouvre avec l'onglet "Personnel Restaurant" actif par défaut

**Étape 2: Vue d'ensemble**
1. Voit 4 cartes de statistiques en haut
   - Personnel Total
   - Livreurs Total
   - Livreurs Disponibles (vert)
   - Livreurs Occupés (jaune)
2. Voit les onglets "Personnel Restaurant" et "Livreurs"
3. Peut basculer entre les deux onglets

### Gestion du Personnel Restaurant

**Ajouter un Personnel:**
1. Clique sur le bouton "+ Ajouter" en haut à droite
2. Dialog s'ouvre avec formulaire
3. Remplit les champs:
   - Email (obligatoire)
   - Nom complet (obligatoire)
   - Rôle (sélection obligatoire)
   - Téléphone (optionnel)
4. Clique sur "Ajouter"
5. ✅ Personnel ajouté (toast de succès)
6. ✅ Liste mise à jour automatiquement

**Modifier un Personnel:**
1. Clique sur l'icône Edit à droite d'un personnel
2. Dialog s'ouvre avec formulaire pré-rempli
3. Email est désactivé (non modifiable)
4. Modifie les champs souhaités
5. Clique sur "Modifier"
6. ✅ Personnel modifié (toast de succès)
7. ✅ Liste mise à jour automatiquement

**Supprimer un Personnel:**
1. Clique sur l'icône Trash à droite d'un personnel
2. Confirmation s'affiche
3. Confirme la suppression
4. ✅ Personnel supprimé (toast de succès)
5. ✅ Liste mise à jour automatiquement

**Rechercher un Personnel:**
1. Tape dans le champ de recherche
2. ✅ Résultats filtrés en temps réel
3. Recherche dans nom et email

**Filtrer par Rôle:**
1. Clique sur le select "Filtrer par rôle"
2. Sélectionne un rôle (ou "Tous les rôles")
3. ✅ Liste filtrée instantanément

### Gestion des Livreurs

**Ajouter un Livreur:**
1. Bascule sur l'onglet "Livreurs"
2. Clique sur le bouton "+ Ajouter" en haut à droite
3. Dialog s'ouvre avec formulaire
4. Remplit les champs:
   - Nom complet (obligatoire)
   - Téléphone (obligatoire)
   - Type de véhicule (sélection obligatoire)
   - Numéro de véhicule (optionnel)
   - Statut (sélection obligatoire)
5. Clique sur "Ajouter"
6. ✅ Livreur ajouté (toast de succès)
7. ✅ Liste mise à jour automatiquement
8. ✅ Statistiques mises à jour

**Modifier un Livreur:**
1. Clique sur l'icône Edit à droite d'un livreur
2. Dialog s'ouvre avec formulaire pré-rempli
3. Modifie les champs souhaités (ex: changer le statut)
4. Clique sur "Modifier"
5. ✅ Livreur modifié (toast de succès)
6. ✅ Liste mise à jour automatiquement
7. ✅ Statistiques mises à jour

**Supprimer un Livreur:**
1. Clique sur l'icône Trash à droite d'un livreur
2. Confirmation s'affiche
3. Confirme la suppression
4. ✅ Livreur supprimé (toast de succès)
5. ✅ Liste mise à jour automatiquement
6. ✅ Statistiques mises à jour

**Rechercher un Livreur:**
1. Tape dans le champ de recherche
2. ✅ Résultats filtrés en temps réel
3. Recherche dans nom et téléphone

**Filtrer par Statut:**
1. Clique sur le select "Filtrer par statut"
2. Sélectionne un statut (ou "Tous les statuts")
3. ✅ Liste filtrée instantanément
4. Utile pour voir rapidement les livreurs disponibles

### Processus de Livraison Complet

**Scénario: Nouvelle Commande avec Livraison**

**Étape 1: Commande reçue**
1. Client passe une commande en ligne
2. Commande apparaît dans "Commandes" (OrderManagementPage)
3. Statut: "En attente"

**Étape 2: Assigner un livreur**
1. Gérant va dans "Utilisateurs & Livreurs"
2. Onglet "Livreurs"
3. Filtre par "Disponible"
4. Voit les livreurs disponibles
5. Retourne dans "Commandes"
6. Assigne un livreur disponible à la commande
7. ✅ Statut du livreur passe à "Occupé"

**Étape 3: Livraison en cours**
1. Livreur reçoit la commande
2. Statut de la commande: "En livraison"
3. Statut du livreur: "Occupé"
4. Gérant peut suivre dans "Commandes"

**Étape 4: Livraison terminée**
1. Livreur livre la commande
2. Statut de la commande: "Livrée"
3. Gérant retourne dans "Utilisateurs & Livreurs"
4. Modifie le statut du livreur à "Disponible"
5. ✅ Livreur prêt pour une nouvelle livraison

**Étape 5: Statistiques mises à jour**
1. Compteur "Livreurs Disponibles" augmente
2. Compteur "Livreurs Occupés" diminue
3. Gérant a une vue d'ensemble en temps réel

---

## 📊 Comparaison Avant/Après

### Avant

**Problèmes:**
- ❌ Pages séparées pour personnel et livreurs
- ❌ Navigation complexe entre les pages
- ❌ Pas de vue d'ensemble unifiée
- ❌ Pas de statistiques en temps réel
- ❌ Difficile de voir les livreurs disponibles
- ❌ Processus de livraison fragmenté

**Impact:**
- Perte de temps à naviguer entre les pages
- Difficulté à assigner rapidement un livreur
- Pas de vue d'ensemble de l'équipe
- Gestion inefficace des livraisons

### Après

**Améliorations:**
- ✅ Page unifiée avec onglets
- ✅ Navigation fluide entre personnel et livreurs
- ✅ Vue d'ensemble avec statistiques
- ✅ Compteurs en temps réel (disponibles, occupés)
- ✅ Filtrage rapide par statut
- ✅ Processus de livraison optimisé
- ✅ Design minimal et épuré
- ✅ Recherche et filtrage puissants

**Impact:**
- Gain de temps significatif
- Assignation rapide des livreurs
- Vue d'ensemble complète de l'équipe
- Gestion efficace des livraisons
- Meilleure expérience utilisateur
- Processus de livraison fluide

---

## 🧪 Tests Recommandés

### Test 1: Navigation et Onglets

**Objectif:** Vérifier la navigation entre les onglets

**Étapes:**
1. Se connecter en tant que propriétaire
2. Aller dans "Utilisateurs & Livreurs"
3. ✅ Vérifier que l'onglet "Personnel Restaurant" est actif par défaut
4. ✅ Vérifier que les statistiques s'affichent
5. Cliquer sur l'onglet "Livreurs"
6. ✅ Vérifier que l'onglet change
7. ✅ Vérifier que la liste des livreurs s'affiche
8. Revenir sur "Personnel Restaurant"
9. ✅ Vérifier que la liste du personnel s'affiche

### Test 2: Statistiques en Temps Réel

**Objectif:** Vérifier que les statistiques sont correctes

**Étapes:**
1. Aller dans "Utilisateurs & Livreurs"
2. ✅ Vérifier "Personnel Total" = nombre d'employés
3. ✅ Vérifier "Livreurs Total" = nombre de livreurs
4. ✅ Vérifier "Livreurs Disponibles" = nombre de livreurs avec statut "available"
5. ✅ Vérifier "Livreurs Occupés" = nombre de livreurs avec statut "busy"
6. Ajouter un livreur
7. ✅ Vérifier que "Livreurs Total" augmente
8. Modifier le statut d'un livreur à "Occupé"
9. ✅ Vérifier que "Livreurs Occupés" augmente
10. ✅ Vérifier que "Livreurs Disponibles" diminue

### Test 3: Gestion du Personnel

**Objectif:** Vérifier les opérations CRUD sur le personnel

**Étapes:**
1. Onglet "Personnel Restaurant"
2. Cliquer sur "+ Ajouter"
3. ✅ Vérifier que le dialog s'ouvre
4. Remplir le formulaire
5. Cliquer sur "Ajouter"
6. ✅ Vérifier le toast de succès
7. ✅ Vérifier que le personnel apparaît dans la liste
8. Cliquer sur Edit
9. ✅ Vérifier que le formulaire est pré-rempli
10. ✅ Vérifier que l'email est désactivé
11. Modifier le nom
12. Cliquer sur "Modifier"
13. ✅ Vérifier le toast de succès
14. ✅ Vérifier que le nom est mis à jour
15. Cliquer sur Trash
16. ✅ Vérifier la confirmation
17. Confirmer
18. ✅ Vérifier le toast de succès
19. ✅ Vérifier que le personnel est supprimé

### Test 4: Gestion des Livreurs

**Objectif:** Vérifier les opérations CRUD sur les livreurs

**Étapes:**
1. Onglet "Livreurs"
2. Cliquer sur "+ Ajouter"
3. ✅ Vérifier que le dialog s'ouvre
4. Remplir le formulaire:
   - Nom: "Jean Dupont"
   - Téléphone: "0612345678"
   - Véhicule: "Moto"
   - Numéro: "AB-123-CD"
   - Statut: "Disponible"
5. Cliquer sur "Ajouter"
6. ✅ Vérifier le toast de succès
7. ✅ Vérifier que le livreur apparaît dans la liste
8. ✅ Vérifier le badge "Disponible" vert
9. Cliquer sur Edit
10. Changer le statut à "Occupé"
11. Cliquer sur "Modifier"
12. ✅ Vérifier le toast de succès
13. ✅ Vérifier le badge "Occupé" jaune
14. ✅ Vérifier que les statistiques sont mises à jour
15. Cliquer sur Trash
16. Confirmer
17. ✅ Vérifier le toast de succès
18. ✅ Vérifier que le livreur est supprimé

### Test 5: Recherche et Filtrage

**Objectif:** Vérifier les fonctionnalités de recherche et filtrage

**Étapes Personnel:**
1. Onglet "Personnel Restaurant"
2. Taper "jean" dans la recherche
3. ✅ Vérifier que seuls les personnels avec "jean" s'affichent
4. Effacer la recherche
5. Sélectionner "Chef" dans le filtre
6. ✅ Vérifier que seuls les chefs s'affichent
7. Sélectionner "Tous les rôles"
8. ✅ Vérifier que tous les personnels s'affichent

**Étapes Livreurs:**
1. Onglet "Livreurs"
2. Taper "06" dans la recherche
3. ✅ Vérifier que seuls les livreurs avec "06" dans le téléphone s'affichent
4. Effacer la recherche
5. Sélectionner "Disponible" dans le filtre
6. ✅ Vérifier que seuls les livreurs disponibles s'affichent
7. Sélectionner "Occupé"
8. ✅ Vérifier que seuls les livreurs occupés s'affichent
9. Sélectionner "Tous les statuts"
10. ✅ Vérifier que tous les livreurs s'affichent

### Test 6: Processus de Livraison Complet

**Objectif:** Vérifier le workflow de livraison de bout en bout

**Étapes:**
1. Aller dans "Utilisateurs & Livreurs"
2. Onglet "Livreurs"
3. ✅ Vérifier qu'il y a au moins 1 livreur disponible
4. Noter le nom du livreur disponible
5. Aller dans "Commandes"
6. Créer ou sélectionner une commande
7. Assigner le livreur disponible
8. ✅ Vérifier que la commande est assignée
9. Retourner dans "Utilisateurs & Livreurs"
10. ✅ Vérifier que le compteur "Livreurs Disponibles" a diminué
11. ✅ Vérifier que le compteur "Livreurs Occupés" a augmenté
12. Filtrer par "Occupé"
13. ✅ Vérifier que le livreur assigné apparaît
14. Modifier le statut du livreur à "Disponible"
15. ✅ Vérifier que les compteurs sont mis à jour

### Test 7: Responsive Design

**Objectif:** Vérifier que la page fonctionne sur mobile

**Étapes:**
1. Ouvrir sur mobile (< 768px)
2. ✅ Vérifier que les statistiques s'affichent en colonne
3. ✅ Vérifier que les onglets sont accessibles
4. ✅ Vérifier que les listes s'affichent correctement
5. ✅ Vérifier que les dialogs sont responsive
6. ✅ Vérifier que les boutons sont cliquables
7. ✅ Vérifier que la recherche fonctionne

### Test 8: Permissions

**Objectif:** Vérifier que seuls les propriétaires et gérants ont accès

**Étapes:**
1. Se connecter en tant que serveur
2. ✅ Vérifier que "Utilisateurs & Livreurs" n'apparaît pas dans la sidebar
3. Essayer d'accéder à `/dashboard/users` directement
4. ✅ Vérifier que l'accès est refusé ou redirigé
5. Se connecter en tant que gérant
6. ✅ Vérifier que "Utilisateurs & Livreurs" apparaît
7. ✅ Vérifier que la page est accessible
8. Se connecter en tant que propriétaire
9. ✅ Vérifier que "Utilisateurs & Livreurs" apparaît
10. ✅ Vérifier que la page est accessible

---

## 💡 Recommandations Futures

### 1. Notifications en Temps Réel

**Actuellement:** Pas de notifications

**Amélioration:**
- Notifier le livreur quand une commande lui est assignée
- Notifier le gérant quand un livreur change de statut
- Utiliser Supabase Realtime pour les notifications
- Afficher un badge de notification dans la sidebar

**Code:**
```typescript
// Écouter les changements de statut des livreurs
const channel = supabase
  .channel('delivery-changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'delivery_personnel',
    },
    (payload) => {
      // Afficher une notification
      toast.info(`Livreur ${payload.new.full_name} est maintenant ${payload.new.status}`);
    }
  )
  .subscribe();
```

### 2. Suivi GPS des Livreurs

**Actuellement:** Pas de suivi GPS

**Amélioration:**
- Ajouter une colonne `current_location` (latitude, longitude)
- Afficher les livreurs sur une carte
- Suivre la position en temps réel
- Estimer le temps de livraison
- Afficher le trajet sur la carte

**Technologies:**
- Leaflet ou Google Maps pour la carte
- Geolocation API pour la position
- Supabase Realtime pour les mises à jour

### 3. Historique des Livraisons

**Actuellement:** Pas d'historique

**Amélioration:**
- Ajouter une table `delivery_history`
- Enregistrer chaque livraison (livreur, commande, durée)
- Afficher l'historique pour chaque livreur
- Calculer des statistiques (nombre de livraisons, temps moyen)
- Afficher un graphique de performance

**Colonnes:**
```sql
CREATE TABLE delivery_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_person_id UUID REFERENCES delivery_personnel(id),
  order_id UUID REFERENCES orders(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  distance_km DECIMAL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5)
);
```

### 4. Évaluation des Livreurs

**Actuellement:** Pas d'évaluation

**Amélioration:**
- Permettre aux clients d'évaluer les livreurs (1-5 étoiles)
- Afficher la note moyenne pour chaque livreur
- Afficher les commentaires des clients
- Badge "Top Livreur" pour les meilleurs
- Bonus pour les livreurs bien notés

### 5. Planning des Livreurs

**Actuellement:** Pas de planning

**Amélioration:**
- Ajouter un calendrier de disponibilité
- Planifier les horaires de travail
- Gérer les congés et absences
- Afficher les livreurs disponibles par créneau horaire
- Optimiser l'assignation selon le planning

### 6. Statistiques Avancées

**Actuellement:** Statistiques basiques

**Amélioration:**
- Nombre de livraisons par livreur (jour, semaine, mois)
- Temps moyen de livraison par livreur
- Distance totale parcourue
- Taux de satisfaction client
- Graphiques de performance
- Comparaison entre livreurs
- Rapport d'activité exportable (PDF, Excel)

### 7. Gestion des Zones de Livraison

**Actuellement:** Pas de zones

**Amélioration:**
- Définir des zones de livraison (quartiers, villes)
- Assigner des livreurs à des zones spécifiques
- Optimiser l'assignation selon la zone
- Calculer les frais de livraison par zone
- Afficher les zones sur une carte

### 8. Communication Intégrée

**Actuellement:** Pas de communication

**Amélioration:**
- Chat entre gérant et livreurs
- Appel téléphonique direct depuis l'interface
- Notifications push pour les livreurs
- Messagerie de groupe pour l'équipe
- Historique des conversations

### 9. Gestion des Véhicules

**Actuellement:** Informations basiques

**Amélioration:**
- Ajouter des photos des véhicules
- Gérer l'entretien (révisions, réparations)
- Suivre les dépenses (essence, assurance)
- Alertes pour les révisions
- Historique des interventions

### 10. Optimisation des Tournées

**Actuellement:** Assignation manuelle

**Amélioration:**
- Algorithme d'optimisation des tournées
- Assigner plusieurs commandes à un livreur
- Calculer le meilleur itinéraire
- Minimiser le temps et la distance
- Maximiser le nombre de livraisons

---

## 📝 Notes Techniques

### Base de Données

**Tables Utilisées:**

**profiles:**
```sql
- id: UUID (PK)
- email: TEXT
- full_name: TEXT
- role: TEXT (owner, manager, chef, server, accountant)
- phone: TEXT
- restaurant_id: UUID (FK)
```

**delivery_personnel:**
```sql
- id: UUID (PK)
- restaurant_id: UUID (FK)
- full_name: TEXT
- phone: TEXT
- vehicle_type: TEXT (bike, motorcycle, scooter, car)
- vehicle_number: TEXT
- status: TEXT (available, busy, offline)
```

### Types TypeScript

**Profile:**
```typescript
interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  restaurant_id?: string;
}
```

**DeliveryPersonnel:**
```typescript
interface DeliveryPersonnel {
  id: string;
  restaurant_id: string;
  full_name: string;
  phone: string;
  vehicle_type: VehicleType;
  vehicle_number?: string;
  status: DeliveryPersonnelStatus;
}

type VehicleType = 'bike' | 'motorcycle' | 'scooter' | 'car';
type DeliveryPersonnelStatus = 'available' | 'busy' | 'offline';
```

### Requêtes Supabase

**Charger le personnel:**
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('restaurant_id', restaurantId)
  .order('full_name');
```

**Charger les livreurs:**
```typescript
const { data, error } = await supabase
  .from('delivery_personnel')
  .select('*')
  .eq('restaurant_id', restaurantId)
  .order('full_name');
```

**Ajouter un livreur:**
```typescript
const { error } = await supabase
  .from('delivery_personnel')
  .insert({
    restaurant_id: restaurantId,
    full_name: form.full_name,
    phone: form.phone,
    vehicle_type: form.vehicle_type,
    vehicle_number: form.vehicle_number,
    status: form.status,
  });
```

**Modifier un livreur:**
```typescript
const { error } = await supabase
  .from('delivery_personnel')
  .update({
    full_name: form.full_name,
    phone: form.phone,
    vehicle_type: form.vehicle_type,
    vehicle_number: form.vehicle_number,
    status: form.status,
  })
  .eq('id', deliveryId);
```

**Supprimer un livreur:**
```typescript
const { error } = await supabase
  .from('delivery_personnel')
  .delete()
  .eq('id', deliveryId);
```

### Gestion de l'État

**États React:**
```typescript
// Onglet actif
const [activeTab, setActiveTab] = useState('staff');

// Personnel
const [staff, setStaff] = useState<Profile[]>([]);
const [filteredStaff, setFilteredStaff] = useState<Profile[]>([]);
const [staffSearchQuery, setStaffSearchQuery] = useState('');
const [roleFilter, setRoleFilter] = useState<string>('all');

// Livreurs
const [deliveryPersonnel, setDeliveryPersonnel] = useState<DeliveryPersonnel[]>([]);
const [filteredDelivery, setFilteredDelivery] = useState<DeliveryPersonnel[]>([]);
const [deliverySearchQuery, setDeliverySearchQuery] = useState('');
const [statusFilter, setStatusFilter] = useState<string>('all');
```

**Effets:**
```typescript
// Charger les données au montage
useEffect(() => {
  if (restaurantId) {
    loadStaff();
    loadDeliveryPersonnel();
  }
}, [restaurantId]);

// Filtrer en temps réel
useEffect(() => {
  filterStaff();
}, [staffSearchQuery, roleFilter, staff]);

useEffect(() => {
  filterDelivery();
}, [deliverySearchQuery, statusFilter, deliveryPersonnel]);
```

---

## 🎨 Guide de Design

### Composants Utilisés

**shadcn/ui:**
- ✅ Card, CardContent, CardDescription, CardHeader, CardTitle
- ✅ Button (variants: default, ghost, outline)
- ✅ Input (avec icône Search)
- ✅ Label
- ✅ Badge (variants: default, secondary, outline, custom)
- ✅ Tabs, TabsContent, TabsList, TabsTrigger
- ✅ Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
- ✅ Select, SelectContent, SelectItem, SelectTrigger, SelectValue

**lucide-react:**
- ✅ Users, Truck, Plus, Edit, Trash2, Search
- ✅ Mail, Phone, MapPin, User
- ✅ AlertCircle, CheckCircle, Clock, Ban

### Palette de Couleurs

**Badges de Rôle:**
- Propriétaire: variant="default" (primary)
- Gérant: variant="default" (primary)
- Chef: variant="secondary" (gris)
- Serveur: variant="outline" (bordure)
- Comptable: variant="secondary" (gris)

**Badges de Statut:**
- Disponible: bg-green-500/10 text-green-700 dark:text-green-400
- Occupé: bg-yellow-500/10 text-yellow-700 dark:text-yellow-400
- Hors ligne: bg-gray-500/10 text-gray-700 dark:text-gray-400

**Statistiques:**
- Personnel Total: text-foreground
- Livreurs Total: text-foreground
- Livreurs Disponibles: text-green-600
- Livreurs Occupés: text-yellow-600

### Espacement

**Cards:**
- Padding: p-4
- Espacement vertical: space-y-3, space-y-4
- Gap horizontal: gap-4

**Formulaires:**
- Espacement entre champs: space-y-4
- Espacement dans les champs: space-y-2

**Listes:**
- Espacement entre items: space-y-3

### Typographie

**Titres:**
- H1: text-3xl font-bold
- CardTitle: text-sm font-medium (statistiques)
- CardTitle: default (sections)

**Texte:**
- Normal: text-foreground
- Atténué: text-muted-foreground
- Petit: text-sm
- Très petit: text-xs

**Badges:**
- Font: font-medium (implicite)

---

**Date**: 2026-04-27  
**Version**: v25  
**Statut**: ✅ Gestion complète des utilisateurs et livreurs implémentée avec succès

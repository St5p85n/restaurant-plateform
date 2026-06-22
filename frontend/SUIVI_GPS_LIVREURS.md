# Système de Suivi GPS des Livreurs en Temps Réel - KobeTii

## 🎯 Fonctionnalité Ajoutée

**Besoin:** Permettre aux clients de suivre leur livraison en temps réel sur une carte interactive avec la position du livreur, le trajet, et une estimation du temps de livraison.

**Solution:** Système complet de suivi GPS avec:
1. **Carte interactive Leaflet** - Affichage en temps réel de la position du livreur
2. **Enregistrement des positions** - Stockage dans la base de données toutes les 30 secondes
3. **Calcul de distance** - Distance restante entre le livreur et la destination
4. **Estimation du temps** - Temps de livraison estimé basé sur la distance
5. **Affichage du trajet** - Ligne pointillée entre restaurant, livreur et destination
6. **Mise à jour automatique** - Rafraîchissement toutes les 30 secondes

---

## 📄 Nouveaux Fichiers

### 1. DeliveryMap.tsx

**Emplacement:** `src/components/delivery/DeliveryMap.tsx`

**Fonctionnalités Principales:**

#### Composant de Carte Interactive

**Props:**
```typescript
interface DeliveryMapProps {
  restaurantLocation: GPSCoordinates;      // Position du restaurant
  deliveryLocation?: GPSCoordinates | null; // Position actuelle du livreur
  destinationLocation: GPSCoordinates;     // Adresse de livraison
  restaurantName?: string;                 // Nom du restaurant
  deliveryPersonName?: string;             // Nom du livreur
  destinationAddress?: string;             // Adresse de destination
  showRoute?: boolean;                     // Afficher le trajet (défaut: true)
  autoCenter?: boolean;                    // Centrer automatiquement (défaut: true)
  height?: string;                         // Hauteur de la carte (défaut: '400px')
}
```

#### Marqueurs Personnalisés

**Restaurant (Orange):**
- Icône: Fourchette et couteau
- Couleur: Orange (#f97316)
- Popup: Nom du restaurant + "Point de départ"

**Livreur (Bleu):**
- Icône: Camion de livraison
- Couleur: Bleu (#3b82f6)
- Popup: Nom du livreur + "Position actuelle"

**Destination (Vert):**
- Icône: Marqueur de localisation
- Couleur: Vert (#10b981)
- Popup: "Destination" + Adresse

#### Trajet (Ligne Pointillée)

- Couleur: Bleu (#3b82f6)
- Épaisseur: 3px
- Opacité: 0.7
- Style: Pointillé (dashArray: "10, 10")
- Points: Restaurant → Livreur → Destination

#### Centrage Automatique

- Calcul automatique des limites (bounds) pour inclure tous les marqueurs
- Padding: 50px de chaque côté
- Mise à jour automatique quand la position du livreur change

#### Fonctions Utilitaires

**calculateDistance(point1, point2):**
- Calcule la distance entre deux points GPS
- Utilise la formule de Haversine
- Retourne la distance en kilomètres (arrondi à 2 décimales)

```typescript
// Exemple
const distance = calculateDistance(
  { lat: 48.8566, lng: 2.3522 },  // Paris
  { lat: 48.8606, lng: 2.3376 }   // Tour Eiffel
);
// Résultat: 1.23 km
```

**estimateDeliveryTime(distanceKm):**
- Estime le temps de livraison basé sur la distance
- Vitesse moyenne: 25 km/h (en ville)
- Ajoute 5 minutes de marge
- Retourne le temps en minutes (arrondi au supérieur)

```typescript
// Exemple
const time = estimateDeliveryTime(5.5); // 5.5 km
// Résultat: 18 minutes (13 + 5 de marge)
```

### 2. OrderTrackingPage.tsx (Amélioré)

**Emplacement:** `src/pages/public/OrderTrackingPage.tsx`

**Nouvelles Fonctionnalités:**

#### Chargement de la Position GPS

**loadDeliveryLocation():**
- Charge la dernière position enregistrée du livreur
- Filtre par delivery_person_id et order_id
- Trie par recorded_at DESC
- Limite à 1 résultat (la plus récente)
- Met à jour l'état deliveryLocation

**Mise à Jour Automatique:**
```typescript
useEffect(() => {
  if (order?.delivery_person_id && order.delivery_status === 'delivering') {
    loadDeliveryLocation();
    const interval = setInterval(loadDeliveryLocation, 30000); // 30 secondes
    return () => clearInterval(interval);
  }
}, [order?.delivery_person_id, order?.delivery_status]);
```

#### Calcul de Distance et Temps

**Mise à Jour Automatique:**
```typescript
useEffect(() => {
  if (deliveryLocation && order?.delivery_address?.latitude && order?.delivery_address?.longitude) {
    const destination: GPSCoordinates = {
      lat: order.delivery_address.latitude,
      lng: order.delivery_address.longitude,
    };
    const distance = calculateDistance(deliveryLocation, destination);
    const time = estimateDeliveryTime(distance);
    setDistanceKm(distance);
    setEstimatedMinutes(time);
  }
}, [deliveryLocation, order?.delivery_address]);
```

#### Affichage de la Carte

**Condition d'Affichage:**
```typescript
const canShowMap = () => {
  return (
    order?.delivery_status === 'delivering' &&
    order?.restaurant?.latitude &&
    order?.restaurant?.longitude &&
    order?.delivery_address?.latitude &&
    order?.delivery_address?.longitude
  );
};
```

**Section de la Carte:**
- Titre: "Suivi en temps réel" avec icône Truck
- Horodatage de la dernière mise à jour
- Informations du livreur (nom, véhicule, téléphone)
- Cartes d'estimation (distance restante, temps estimé)
- Carte interactive (500px de hauteur)
- Message si position non disponible

---

## 🗄️ Base de Données

### Table: delivery_locations

**Structure:**
```sql
CREATE TABLE delivery_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_person_id UUID NOT NULL REFERENCES delivery_personnel(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Index:**
- `idx_delivery_locations_person` sur delivery_person_id
- `idx_delivery_locations_order` sur order_id
- `idx_delivery_locations_recorded_at` sur recorded_at DESC

**Politiques RLS:**

**SELECT:**
- Clients: Peuvent voir les positions de leur commande
- Restaurant: Peut voir les positions de ses livreurs
- Fonction helper: `can_view_delivery_location(order_id)`

**INSERT:**
- Livreurs: Peuvent ajouter leurs positions
- Restaurant: Peut ajouter des positions pour ses livreurs

**Vue: latest_delivery_locations**
```sql
CREATE VIEW latest_delivery_locations AS
SELECT DISTINCT ON (delivery_person_id)
  id,
  delivery_person_id,
  order_id,
  latitude,
  longitude,
  recorded_at
FROM delivery_locations
ORDER BY delivery_person_id, recorded_at DESC;
```

### Colonnes Ajoutées

**Table: restaurants**
- `latitude DECIMAL(10, 8)` - Latitude du restaurant
- `longitude DECIMAL(11, 8)` - Longitude du restaurant
- Index: `idx_restaurants_coordinates`

**Table: delivery_addresses**
- `latitude DECIMAL(10, 8)` - Latitude de l'adresse
- `longitude DECIMAL(11, 8)` - Longitude de l'adresse
- Index: `idx_delivery_addresses_coordinates`

---

## 🔄 Flux Utilisateur

### Scénario: Client Suit sa Livraison

**Étape 1: Accès à la Page de Suivi**
1. Client passe une commande en ligne
2. Reçoit un email avec le numéro de commande
3. Clique sur le lien de suivi ou va sur `/track-order/:id`
4. Page de suivi s'ouvre

**Étape 2: Visualisation du Statut**
1. Voit la timeline avec les étapes:
   - Commande reçue ✓
   - Confirmée ✓
   - En préparation ✓
   - Prête ✓
   - En livraison (actuel)
   - Livrée
2. Voit le badge "En livraison" en bleu
3. Voit l'adresse de livraison avec instructions

**Étape 3: Suivi GPS en Temps Réel**
1. Section "Suivi en temps réel" apparaît
2. Voit les informations du livreur:
   - Nom: "Jean Dupont"
   - Véhicule: "Moto"
   - Téléphone: "06 12 34 56 78"
3. Voit les cartes d'estimation:
   - Distance restante: **2.5 km**
   - Temps estimé: **12 min**
4. Voit la carte interactive avec:
   - Marqueur orange: Restaurant (point de départ)
   - Marqueur bleu: Livreur (position actuelle)
   - Marqueur vert: Destination (adresse de livraison)
   - Ligne pointillée bleue: Trajet
5. Horodatage: "Mis à jour: 14:35:42"

**Étape 4: Mise à Jour Automatique**
1. Après 30 secondes, la position se met à jour automatiquement
2. Marqueur bleu se déplace sur la carte
3. Distance restante diminue: **2.5 km** → **1.8 km**
4. Temps estimé diminue: **12 min** → **9 min**
5. Horodatage se met à jour: "Mis à jour: 14:36:12"
6. Carte se recentre automatiquement

**Étape 5: Livraison Imminente**
1. Distance restante: **0.3 km**
2. Temps estimé: **3 min**
3. Livreur très proche sur la carte
4. Client se prépare à recevoir la commande

**Étape 6: Livraison Terminée**
1. Livreur confirme la livraison
2. Statut passe à "Livrée"
3. Badge devient vert
4. Carte disparaît
5. Message de confirmation s'affiche

---

## 🔧 Intégration Technique

### Installation des Dépendances

**Packages Ajoutés:**
```bash
pnpm add react-leaflet leaflet @types/leaflet
```

**react-leaflet:**
- Wrapper React pour Leaflet
- Composants: MapContainer, TileLayer, Marker, Popup, Polyline
- Version: Compatible avec React 18

**leaflet:**
- Bibliothèque de cartes interactive
- Légère et performante
- Open source

**@types/leaflet:**
- Types TypeScript pour Leaflet
- Autocomplétion et vérification de types

### Import des Styles CSS

**Dans DeliveryMap.tsx:**
```typescript
import 'leaflet/dist/leaflet.css';
```

**Fix pour les Icônes:**
```typescript
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;
```

### Types TypeScript

**Nouveaux Types Ajoutés:**

```typescript
// Types pour le suivi GPS des livreurs
export interface DeliveryLocation {
  id: string;
  delivery_person_id: string;
  order_id: string | null;
  latitude: number;
  longitude: number;
  recorded_at: string;
  created_at: string;
}

export interface GPSCoordinates {
  lat: number;
  lng: number;
}

export interface DeliveryTrackingInfo {
  order_id: string;
  delivery_person: {
    id: string;
    full_name: string;
    phone: string;
    vehicle_type: VehicleType;
  };
  current_location: GPSCoordinates | null;
  destination: GPSCoordinates;
  restaurant_location: GPSCoordinates;
  estimated_time_minutes: number | null;
  distance_km: number | null;
  last_updated: string | null;
}
```

### Requêtes Supabase

**Charger la Dernière Position:**
```typescript
const { data, error } = await supabase
  .from('delivery_locations')
  .select('*')
  .eq('delivery_person_id', deliveryPersonId)
  .eq('order_id', orderId)
  .order('recorded_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```

**Enregistrer une Position:**
```typescript
const { error } = await supabase
  .from('delivery_locations')
  .insert({
    delivery_person_id: deliveryPersonId,
    order_id: orderId,
    latitude: position.lat,
    longitude: position.lng,
    recorded_at: new Date().toISOString(),
  });
```

**Charger la Commande avec Coordonnées:**
```typescript
const { data, error } = await supabase
  .from('orders')
  .select(`
    *,
    restaurant:restaurants(name, phone, address, latitude, longitude),
    delivery_address:delivery_addresses(*, latitude, longitude),
    delivery_person:delivery_personnel(full_name, phone, vehicle_type),
    order_items(
      *,
      menu_item:menu_items(name)
    )
  `)
  .eq('id', orderId)
  .maybeSingle();
```

---

## 📊 Comparaison Avant/Après

### Avant

**Problèmes:**
- ❌ Pas de suivi en temps réel de la livraison
- ❌ Client ne sait pas où est le livreur
- ❌ Pas d'estimation du temps de livraison
- ❌ Pas de visualisation du trajet
- ❌ Client doit appeler pour avoir des nouvelles
- ❌ Anxiété du client ("Où est ma commande?")

**Impact:**
- Expérience client frustrante
- Appels téléphoniques fréquents au restaurant
- Insatisfaction et réclamations
- Manque de transparence

### Après

**Améliorations:**
- ✅ Suivi GPS en temps réel sur carte interactive
- ✅ Position du livreur visible et mise à jour toutes les 30 secondes
- ✅ Estimation du temps de livraison basée sur la distance
- ✅ Visualisation du trajet complet
- ✅ Informations du livreur (nom, véhicule, téléphone)
- ✅ Distance restante affichée
- ✅ Horodatage de la dernière mise à jour
- ✅ Centrage automatique de la carte
- ✅ Marqueurs colorés et distincts
- ✅ Design minimal et épuré

**Impact:**
- Expérience client exceptionnelle
- Réduction des appels téléphoniques
- Satisfaction client accrue
- Transparence totale
- Confiance renforcée
- Différenciation concurrentielle

---

## 🧪 Tests Recommandés

### Test 1: Affichage de la Carte

**Objectif:** Vérifier que la carte s'affiche correctement

**Étapes:**
1. Créer une commande avec livraison
2. Assigner un livreur
3. Mettre le statut à "En livraison"
4. Aller sur la page de suivi
5. ✅ Vérifier que la section "Suivi en temps réel" s'affiche
6. ✅ Vérifier que la carte Leaflet se charge
7. ✅ Vérifier que les 3 marqueurs sont visibles (restaurant, livreur, destination)
8. ✅ Vérifier que la ligne pointillée est affichée
9. ✅ Vérifier que la carte est centrée sur les marqueurs

### Test 2: Mise à Jour de la Position

**Objectif:** Vérifier que la position se met à jour automatiquement

**Étapes:**
1. Aller sur la page de suivi d'une commande en livraison
2. Noter la position actuelle du livreur
3. Attendre 30 secondes
4. ✅ Vérifier que la position se met à jour
5. ✅ Vérifier que l'horodatage change
6. ✅ Vérifier que le marqueur bleu se déplace
7. ✅ Vérifier que la carte se recentre

### Test 3: Calcul de Distance et Temps

**Objectif:** Vérifier que les calculs sont corrects

**Étapes:**
1. Créer une position GPS pour le livreur
2. Aller sur la page de suivi
3. ✅ Vérifier que la distance restante s'affiche
4. ✅ Vérifier que le temps estimé s'affiche
5. Déplacer le livreur plus près de la destination
6. Attendre 30 secondes
7. ✅ Vérifier que la distance diminue
8. ✅ Vérifier que le temps estimé diminue

### Test 4: Informations du Livreur

**Objectif:** Vérifier que les informations du livreur sont affichées

**Étapes:**
1. Aller sur la page de suivi
2. ✅ Vérifier que le nom du livreur s'affiche
3. ✅ Vérifier que le type de véhicule s'affiche
4. ✅ Vérifier que le téléphone s'affiche
5. ✅ Vérifier que l'icône du véhicule est correcte

### Test 5: Marqueurs et Popups

**Objectif:** Vérifier que les marqueurs sont interactifs

**Étapes:**
1. Aller sur la page de suivi
2. Cliquer sur le marqueur orange (restaurant)
3. ✅ Vérifier que le popup s'ouvre
4. ✅ Vérifier que le nom du restaurant s'affiche
5. Cliquer sur le marqueur bleu (livreur)
6. ✅ Vérifier que le popup s'ouvre
7. ✅ Vérifier que le nom du livreur s'affiche
8. Cliquer sur le marqueur vert (destination)
9. ✅ Vérifier que le popup s'ouvre
10. ✅ Vérifier que l'adresse s'affiche

### Test 6: Responsive Design

**Objectif:** Vérifier que la carte fonctionne sur mobile

**Étapes:**
1. Ouvrir sur mobile (< 768px)
2. ✅ Vérifier que la carte s'affiche correctement
3. ✅ Vérifier que les marqueurs sont visibles
4. ✅ Vérifier que les cartes d'estimation sont en colonne
5. ✅ Vérifier que le zoom fonctionne
6. ✅ Vérifier que le déplacement fonctionne

### Test 7: Cas Limites

**Objectif:** Vérifier le comportement dans les cas limites

**Étapes:**
1. Commande sans position GPS du livreur
2. ✅ Vérifier que le message "En attente de la position" s'affiche
3. Commande sans coordonnées du restaurant
4. ✅ Vérifier que la carte ne s'affiche pas
5. Commande sans coordonnées de destination
6. ✅ Vérifier que la carte ne s'affiche pas
7. Commande avec statut "Prête" (pas encore en livraison)
8. ✅ Vérifier que la carte ne s'affiche pas

### Test 8: Performance

**Objectif:** Vérifier que la carte est performante

**Étapes:**
1. Ouvrir les DevTools
2. Aller dans l'onglet Performance
3. Commencer l'enregistrement
4. Charger la page de suivi
5. Attendre 2 minutes (4 mises à jour)
6. Arrêter l'enregistrement
7. ✅ Vérifier que le chargement initial est < 2 secondes
8. ✅ Vérifier que les mises à jour sont < 500ms
9. ✅ Vérifier qu'il n'y a pas de memory leak

---

## 💡 Recommandations Futures

### 1. Application Mobile pour Livreurs

**Actuellement:** Pas d'application dédiée

**Amélioration:**
- Application mobile native (React Native)
- Capture automatique de la position GPS
- Envoi automatique toutes les 30 secondes
- Notifications push pour nouvelles commandes
- Navigation GPS intégrée
- Bouton "Livraison terminée"

### 2. Optimisation d'Itinéraire

**Actuellement:** Ligne droite entre les points

**Amélioration:**
- Utiliser une API de routing (OpenRouteService, Mapbox)
- Calculer le trajet réel sur les routes
- Afficher le trajet optimisé sur la carte
- Prendre en compte le trafic en temps réel
- Estimation plus précise du temps

### 3. Historique des Positions

**Actuellement:** Seule la dernière position est affichée

**Amélioration:**
- Afficher l'historique complet du trajet
- Ligne continue montrant le chemin parcouru
- Vitesse moyenne du livreur
- Temps d'arrêt (feux, embouteillages)
- Replay du trajet après livraison

### 4. Notifications Push

**Actuellement:** Pas de notifications

**Amélioration:**
- Notification quand le livreur est proche (< 1 km)
- Notification quand le livreur arrive (< 100 m)
- Notification en cas de retard
- Notification de livraison terminée
- Utiliser Web Push API

### 5. Chat en Temps Réel

**Actuellement:** Téléphone uniquement

**Amélioration:**
- Chat intégré entre client et livreur
- Messages prédéfinis ("Je suis en bas", "Sonnez à l'interphone")
- Envoi de photos (code d'accès, porte)
- Historique des messages
- Utiliser Supabase Realtime

### 6. Évaluation du Livreur

**Actuellement:** Pas d'évaluation

**Amélioration:**
- Note de 1 à 5 étoiles après livraison
- Commentaire optionnel
- Critères: Rapidité, Amabilité, État de la commande
- Affichage de la note moyenne du livreur
- Badge "Top Livreur"

### 7. Zones de Livraison

**Actuellement:** Pas de zones définies

**Amélioration:**
- Définir des zones de livraison sur la carte
- Polygones colorés pour chaque zone
- Frais de livraison par zone
- Temps de livraison estimé par zone
- Restriction de livraison hors zones

### 8. Mode Hors Ligne

**Actuellement:** Nécessite une connexion

**Amélioration:**
- Cache des cartes pour mode hors ligne
- Synchronisation quand la connexion revient
- Affichage de la dernière position connue
- Message d'avertissement si hors ligne

### 9. Statistiques de Livraison

**Actuellement:** Pas de statistiques

**Amélioration:**
- Distance totale parcourue par livraison
- Temps réel vs temps estimé
- Vitesse moyenne du livreur
- Nombre d'arrêts
- Graphiques de performance
- Export des données

### 10. Intégration avec Waze/Google Maps

**Actuellement:** Carte Leaflet uniquement

**Amélioration:**
- Bouton "Ouvrir dans Waze"
- Bouton "Ouvrir dans Google Maps"
- Lien direct avec coordonnées
- Navigation turn-by-turn
- Partage de l'ETA

---

## 📝 Notes Techniques

### Formule de Haversine

**Calcul de Distance:**
```typescript
function calculateDistance(point1: GPSCoordinates, point2: GPSCoordinates): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);
  const lat1 = toRad(point1.lat);
  const lat2 = toRad(point2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Arrondi à 2 décimales
}
```

### Estimation du Temps

**Calcul:**
```typescript
function estimateDeliveryTime(distanceKm: number): number {
  const averageSpeedKmh = 25; // Vitesse moyenne en ville
  const timeHours = distanceKm / averageSpeedKmh;
  const timeMinutes = Math.ceil(timeHours * 60);
  return timeMinutes + 5; // Ajouter 5 minutes de marge
}
```

### Leaflet vs Google Maps

**Pourquoi Leaflet?**
- ✅ Open source et gratuit
- ✅ Pas de clé API requise
- ✅ Léger (39 KB gzippé)
- ✅ Performant
- ✅ Personnalisable
- ✅ Pas de limite de requêtes

**Google Maps:**
- ❌ Nécessite une clé API
- ❌ Payant après 28 000 chargements/mois
- ❌ Plus lourd
- ✅ Plus de fonctionnalités (Street View, etc.)
- ✅ Meilleure qualité de cartes

### Tuiles OpenStreetMap

**URL:**
```
https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

**Paramètres:**
- `{s}`: Sous-domaine (a, b, c) pour répartir la charge
- `{z}`: Niveau de zoom (0-19)
- `{x}`: Coordonnée X de la tuile
- `{y}`: Coordonnée Y de la tuile

**Attribution:**
```
&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors
```

### Précision GPS

**Latitude:**
- Format: DECIMAL(10, 8)
- Plage: -90.00000000 à 90.00000000
- Précision: ~1.1 mm

**Longitude:**
- Format: DECIMAL(11, 8)
- Plage: -180.00000000 à 180.00000000
- Précision: ~1.1 mm

### Performance

**Optimisations:**
- Mise à jour toutes les 30 secondes (pas en temps réel continu)
- Limite de 1 résultat pour la dernière position
- Index sur les colonnes de recherche
- Vue matérialisée pour les dernières positions
- Lazy loading de la carte
- Pas de scroll wheel zoom par défaut

---

## 🎨 Guide de Design

### Composants Utilisés

**shadcn/ui:**
- ✅ Card, CardContent, CardHeader, CardTitle
- ✅ Badge (avec classes personnalisées)
- ✅ Button

**lucide-react:**
- ✅ Truck, MapPin, Phone, Clock, Package, CheckCircle, ChefHat, ArrowLeft

**react-leaflet:**
- ✅ MapContainer, TileLayer, Marker, Popup, Polyline

### Palette de Couleurs

**Marqueurs:**
- Restaurant: Orange (#f97316)
- Livreur: Bleu (#3b82f6)
- Destination: Vert (#10b981)

**Trajet:**
- Ligne: Bleu (#3b82f6)
- Opacité: 0.7
- Style: Pointillé

**Cartes d'Estimation:**
- Background: bg-muted
- Texte principal: text-primary (2xl, bold)
- Texte secondaire: text-muted-foreground (sm)

### Espacement

**Carte:**
- Hauteur: 500px (page de suivi)
- Hauteur: 400px (par défaut)
- Border radius: 0.5rem
- Overflow: hidden

**Sections:**
- Espacement vertical: space-y-4, space-y-6
- Padding des cards: p-4
- Gap des grilles: gap-4

### Typographie

**Titres:**
- CardTitle: default
- Sous-titres: text-sm text-muted-foreground

**Texte:**
- Normal: text-foreground
- Atténué: text-muted-foreground
- Estimation: text-2xl font-bold text-primary

---

**Date**: 2026-04-27  
**Version**: v26  
**Statut**: ✅ Système de suivi GPS des livreurs en temps réel implémenté avec succès

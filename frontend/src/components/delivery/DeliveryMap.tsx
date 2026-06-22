import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GPSCoordinates, RouteGeometry } from '@/types';

// Fix pour les icônes Leaflet avec Vite
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

// Icône personnalisée pour le restaurant
const restaurantIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
      <path d="M7 2v20"/>
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Icône personnalisée pour le livreur
const deliveryIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
      <path d="M15 18H9"/>
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
      <circle cx="17" cy="18" r="2"/>
      <circle cx="7" cy="18" r="2"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Icône personnalisée pour la destination
const destinationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface DeliveryMapProps {
  restaurantLocation: GPSCoordinates;
  deliveryLocation?: GPSCoordinates | null;
  destinationLocation: GPSCoordinates;
  restaurantName?: string;
  deliveryPersonName?: string;
  destinationAddress?: string;
  showRoute?: boolean;
  autoCenter?: boolean;
  height?: string;
  routeGeometry?: RouteGeometry | null; // Trajet routier optimisé
}

// Composant pour centrer automatiquement la carte
function MapCenterController({ 
  bounds, 
  autoCenter 
}: { 
  bounds: L.LatLngBounds; 
  autoCenter: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (autoCenter) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, autoCenter, map]);

  return null;
}

export default function DeliveryMap({
  restaurantLocation,
  deliveryLocation,
  destinationLocation,
  restaurantName = 'Restaurant',
  deliveryPersonName = 'Livreur',
  destinationAddress = 'Destination',
  showRoute = true,
  autoCenter = true,
  height = '400px',
  routeGeometry = null,
}: DeliveryMapProps) {
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);

  // Calculer les limites de la carte pour inclure tous les marqueurs
  useEffect(() => {
    const points: [number, number][] = [
      [restaurantLocation.lat, restaurantLocation.lng],
      [destinationLocation.lat, destinationLocation.lng],
    ];

    if (deliveryLocation) {
      points.push([deliveryLocation.lat, deliveryLocation.lng]);
    }

    // Ajouter les points du trajet routier si disponible
    if (routeGeometry && routeGeometry.coordinates.length > 0) {
      routeGeometry.coordinates.forEach(([lng, lat]) => {
        points.push([lat, lng]);
      });
    }

    const newBounds = L.latLngBounds(points);
    setBounds(newBounds);
  }, [restaurantLocation, deliveryLocation, destinationLocation, routeGeometry]);

  // Centre par défaut (moyenne des positions)
  const center: [number, number] = deliveryLocation
    ? [deliveryLocation.lat, deliveryLocation.lng]
    : [
        (restaurantLocation.lat + destinationLocation.lat) / 2,
        (restaurantLocation.lng + destinationLocation.lng) / 2,
      ];

  // Points pour le trajet
  let routePoints: [number, number][] = [];
  
  if (showRoute) {
    if (routeGeometry && routeGeometry.coordinates.length > 0) {
      // Utiliser le trajet routier optimisé (convertir [lng, lat] en [lat, lng])
      routePoints = routeGeometry.coordinates.map(([lng, lat]) => [lat, lng]);
    } else {
      // Fallback: ligne droite
      routePoints.push([restaurantLocation.lat, restaurantLocation.lng]);
      if (deliveryLocation) {
        routePoints.push([deliveryLocation.lat, deliveryLocation.lng]);
      }
      routePoints.push([destinationLocation.lat, destinationLocation.lng]);
    }
  }

  return (
    <div style={{ height, width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marqueur Restaurant */}
        <Marker
          position={[restaurantLocation.lat, restaurantLocation.lng]}
          icon={restaurantIcon}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-medium">{restaurantName}</div>
              <div className="text-muted-foreground">Point de départ</div>
            </div>
          </Popup>
        </Marker>

        {/* Marqueur Livreur (si position disponible) */}
        {deliveryLocation && (
          <Marker
            position={[deliveryLocation.lat, deliveryLocation.lng]}
            icon={deliveryIcon}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-medium">{deliveryPersonName}</div>
                <div className="text-muted-foreground">Position actuelle</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marqueur Destination */}
        <Marker
          position={[destinationLocation.lat, destinationLocation.lng]}
          icon={destinationIcon}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-medium">Destination</div>
              <div className="text-muted-foreground">{destinationAddress}</div>
            </div>
          </Popup>
        </Marker>

        {/* Trajet */}
        {showRoute && routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            color={routeGeometry ? "#10b981" : "#3b82f6"} // Vert si trajet routier, bleu sinon
            weight={4}
            opacity={0.8}
            dashArray={routeGeometry ? undefined : "10, 10"} // Ligne continue si trajet routier
          />
        )}

        {/* Contrôleur de centrage automatique */}
        {bounds && autoCenter && (
          <MapCenterController bounds={bounds} autoCenter={autoCenter} />
        )}
      </MapContainer>
    </div>
  );
}

// Fonction utilitaire pour calculer la distance entre deux points GPS (formule de Haversine)
export function calculateDistance(
  point1: GPSCoordinates,
  point2: GPSCoordinates
): number {
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

// Fonction utilitaire pour estimer le temps de livraison
export function estimateDeliveryTime(distanceKm: number): number {
  // Vitesse moyenne en ville: 25 km/h
  const averageSpeedKmh = 25;
  const timeHours = distanceKm / averageSpeedKmh;
  const timeMinutes = Math.ceil(timeHours * 60);

  // Ajouter 5 minutes de marge
  return timeMinutes + 5;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

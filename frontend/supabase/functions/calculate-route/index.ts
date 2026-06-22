import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RouteRequest {
  start: [number, number]; // [longitude, latitude]
  end: [number, number]; // [longitude, latitude]
  profile?: 'driving-car' | 'driving-hgv' | 'cycling-regular' | 'foot-walking';
}

interface OpenRouteServiceResponse {
  routes: Array<{
    summary: {
      distance: number; // en mètres
      duration: number; // en secondes
    };
    geometry: {
      coordinates: [number, number][];
      type: 'LineString';
    };
    segments: Array<{
      distance: number;
      duration: number;
      steps: Array<{
        distance: number;
        duration: number;
        type: number;
        instruction: string;
        name: string;
        exit_number?: number;
      }>;
    }>;
  }>;
}

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Récupérer la clé API depuis les secrets
    const apiKey = Deno.env.get('OPENROUTESERVICE_API_KEY');
    if (!apiKey) {
      throw new Error('OPENROUTESERVICE_API_KEY non configurée');
    }

    // Parser la requête
    const { start, end, profile = 'driving-car' }: RouteRequest = await req.json();

    // Valider les paramètres
    if (!start || !end || start.length !== 2 || end.length !== 2) {
      return new Response(
        JSON.stringify({ error: 'Paramètres invalides. Format attendu: start=[lng,lat], end=[lng,lat]' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Appeler l'API OpenRouteService
    const orsUrl = `https://api.openrouteservice.org/v2/directions/${profile}`;
    const orsResponse = await fetch(orsUrl, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
      },
      body: JSON.stringify({
        coordinates: [start, end],
        instructions: true,
        preference: 'fastest', // Prendre en compte le trafic
        units: 'm', // Mètres
      }),
    });

    if (!orsResponse.ok) {
      const errorText = await orsResponse.text();
      console.error('Erreur OpenRouteService:', errorText);
      
      // Fallback: calculer une ligne droite simple
      return new Response(
        JSON.stringify({
          fallback: true,
          geometry: {
            coordinates: [start, end],
            type: 'LineString',
          },
          distance: calculateStraightDistance(start, end),
          duration: calculateStraightDistance(start, end) / 25 * 3600, // 25 km/h
          segments: [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data: OpenRouteServiceResponse = await orsResponse.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('Aucun trajet trouvé');
    }

    const route = data.routes[0];

    // Formater la réponse
    const response = {
      geometry: route.geometry,
      distance: route.summary.distance,
      duration: route.summary.duration,
      segments: route.segments.map((segment) => ({
        distance: segment.distance,
        duration: segment.duration,
        steps: segment.steps.map((step) => ({
          distance: step.distance,
          duration: step.duration,
          type: step.type,
          instruction: step.instruction,
          name: step.name,
          exit_number: step.exit_number,
        })),
      })),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erreur dans calculate-route:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur lors du calcul du trajet' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Fonction utilitaire pour calculer la distance en ligne droite (formule de Haversine)
function calculateStraightDistance(start: [number, number], end: [number, number]): number {
  const R = 6371000; // Rayon de la Terre en mètres
  const lat1 = toRad(start[1]);
  const lat2 = toRad(end[1]);
  const dLat = toRad(end[1] - start[1]);
  const dLon = toRad(end[0] - start[0]);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

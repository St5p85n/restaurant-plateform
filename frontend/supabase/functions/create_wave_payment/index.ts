import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl!, supabaseKey!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WavePaymentRequest {
  orderId: string;
  phoneNumber: string;
}

function ok(data: any): Response {
  return new Response(
    JSON.stringify({ code: "SUCCESS", message: "Succès", data }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}

function fail(msg: string, code = 400): Response {
  return new Response(
    JSON.stringify({ code: "FAIL", message: msg }),
    {
      status: code,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const request: WavePaymentRequest = await req.json();
    
    if (!request.orderId || !request.phoneNumber) {
      throw new Error("Paramètres manquants");
    }

    // Récupérer la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', request.orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Commande introuvable");
    }

    // Vérifier que la commande est en attente de paiement
    if (order.payment_status !== 'unpaid') {
      throw new Error("Cette commande ne peut pas être payée");
    }

    // Générer un ID de transaction unique
    const transactionId = `WAVE_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // NOTE: Wave n'a pas d'API publique officielle
    // Cette implémentation est une structure générique qui devra être adaptée
    // une fois que vous aurez accès à l'API Wave réelle
    
    const waveApiKey = Deno.env.get("WAVE_API_KEY");
    const waveApiUrl = Deno.env.get("WAVE_API_URL");

    if (!waveApiKey || !waveApiUrl) {
      console.warn("Wave API non configurée - Mode simulation");
      
      // Mode simulation pour le développement
      const { data: mobilePayment, error: paymentError } = await supabase
        .from('mobile_payments')
        .insert({
          order_id: order.id,
          payment_method: 'wave',
          phone_number: request.phoneNumber,
          amount: order.total,
          currency: 'XOF',
          status: 'pending',
          transaction_id: transactionId,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      return ok({
        paymentId: mobilePayment.id,
        transactionId: transactionId,
        status: 'pending',
        message: 'Demande de paiement créée (mode simulation)',
        expiresAt: mobilePayment.expires_at,
      });
    }

    // Appel à l'API Wave réelle (à adapter selon la documentation Wave)
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

    if (!waveResponse.ok) {
      const errorData = await waveResponse.json();
      throw new Error(errorData.message || 'Erreur Wave API');
    }

    const waveData = await waveResponse.json();

    // Créer l'enregistrement de paiement mobile
    const { data: mobilePayment, error: paymentError } = await supabase
      .from('mobile_payments')
      .insert({
        order_id: order.id,
        payment_method: 'wave',
        phone_number: request.phoneNumber,
        amount: order.total,
        currency: 'XOF',
        status: 'processing',
        transaction_id: transactionId,
        provider_reference: waveData.id || waveData.reference,
        provider_response: waveData,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    return ok({
      paymentId: mobilePayment.id,
      transactionId: transactionId,
      status: 'processing',
      message: 'Demande de paiement envoyée',
      expiresAt: mobilePayment.expires_at,
    });
  } catch (error) {
    console.error("Erreur création paiement Wave:", error);
    return fail(error instanceof Error ? error.message : "Erreur de paiement", 500);
  }
});

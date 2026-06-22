import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl!, supabaseKey!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrangeMoneyPaymentRequest {
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

    const request: OrangeMoneyPaymentRequest = await req.json();
    
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
    const transactionId = `OM_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // NOTE: Orange Money a une API officielle mais nécessite un contrat commercial
    // Cette implémentation est une structure générique qui devra être adaptée
    // une fois que vous aurez accès à l'API Orange Money réelle
    
    const orangeApiKey = Deno.env.get("ORANGE_MONEY_API_KEY");
    const orangeApiUrl = Deno.env.get("ORANGE_MONEY_API_URL");
    const orangeMerchantId = Deno.env.get("ORANGE_MONEY_MERCHANT_ID");

    if (!orangeApiKey || !orangeApiUrl || !orangeMerchantId) {
      console.warn("Orange Money API non configurée - Mode simulation");
      
      // Mode simulation pour le développement
      const { data: mobilePayment, error: paymentError } = await supabase
        .from('mobile_payments')
        .insert({
          order_id: order.id,
          payment_method: 'orange_money',
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

    // Appel à l'API Orange Money réelle (à adapter selon la documentation Orange Money)
    const orangeResponse = await fetch(`${orangeApiUrl}/webpayment/v1/webpayment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${orangeApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchant_key: orangeMerchantId,
        currency: 'OUV',
        order_id: transactionId,
        amount: order.total,
        return_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/orange_money_webhook`,
        cancel_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/orange_money_webhook`,
        notif_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/orange_money_webhook`,
        lang: 'fr',
        reference: `Commande #${order.order_number}`,
      }),
    });

    if (!orangeResponse.ok) {
      const errorData = await orangeResponse.json();
      throw new Error(errorData.message || 'Erreur Orange Money API');
    }

    const orangeData = await orangeResponse.json();

    // Créer l'enregistrement de paiement mobile
    const { data: mobilePayment, error: paymentError } = await supabase
      .from('mobile_payments')
      .insert({
        order_id: order.id,
        payment_method: 'orange_money',
        phone_number: request.phoneNumber,
        amount: order.total,
        currency: 'XOF',
        status: 'processing',
        transaction_id: transactionId,
        provider_reference: orangeData.payment_token || orangeData.order_id,
        provider_response: orangeData,
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
      paymentUrl: orangeData.payment_url, // URL pour rediriger l'utilisateur si nécessaire
    });
  } catch (error) {
    console.error("Erreur création paiement Orange Money:", error);
    return fail(error instanceof Error ? error.message : "Erreur de paiement", 500);
  }
});

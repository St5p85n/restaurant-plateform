import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@19.1.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl!, supabaseKey!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

async function updateOrderStatus(
  sessionId: string,
  session: Stripe.Checkout.Session
): Promise<boolean> {
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, payment_status')
    .eq('stripe_session_id', sessionId)
    .single();

  if (fetchError || !order) {
    console.error("Erreur récupération commande:", fetchError);
    return false;
  }

  if (order.payment_status === 'paid') {
    return true;
  }

  if (order.payment_status !== 'unpaid') {
    console.error(`Statut de paiement invalide: ${order.payment_status}`);
    return false;
  }

  const { error } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
      customer_email: session.customer_details?.email,
      customer_name: session.customer_details?.name,
      stripe_payment_intent_id: session.payment_intent as string,
    })
    .eq('id', order.id)
    .eq('payment_status', 'unpaid');

  if (error) {
    console.error("Erreur mise à jour commande:", error);
    return false;
  }

  return true;
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      throw new Error("ID de session manquant");
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY non configuré");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return ok({
        verified: false,
        status: session.payment_status,
        sessionId: session.id,
      });
    }

    const orderUpdated = await updateOrderStatus(sessionId, session);

    return ok({
      verified: true,
      status: "paid",
      sessionId: session.id,
      paymentIntentId: session.payment_intent,
      amount: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email,
      customerName: session.customer_details?.name,
      orderUpdated,
    });
  } catch (error) {
    console.error("Erreur vérification paiement:", error);
    return fail(error instanceof Error ? error.message : "Erreur de vérification", 500);
  }
});

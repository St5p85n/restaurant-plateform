import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@19.1.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl!, supabaseKey!);

const successUrlPath = '/mobile/payment-success?session_id={CHECKOUT_SESSION_ID}';
const cancelUrlPath = '/mobile/cart';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  orderId: string;
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

    const request: CheckoutRequest = await req.json();
    
    if (!request.orderId) {
      throw new Error("ID de commande manquant");
    }

    // Récupérer la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          menu_item:menu_items(name, image_url)
        ),
        restaurant:restaurants(name)
      `)
      .eq('id', request.orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Commande introuvable");
    }

    // Vérifier que la commande est en attente de paiement
    if (order.payment_status !== 'unpaid') {
      throw new Error("Cette commande ne peut pas être payée");
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY non configuré");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    const origin = req.headers.get("origin") || "";

    // Créer les line items pour Stripe
    const lineItems = order.order_items.map((item: any) => ({
      price_data: {
        currency: 'xof', // Franc CFA
        product_data: {
          name: item.menu_item?.name || 'Article',
          images: item.menu_item?.image_url ? [item.menu_item.image_url] : [],
        },
        unit_amount: Math.round(item.unit_price), // Stripe utilise les centimes, mais FCFA n'a pas de centimes
      },
      quantity: item.quantity,
    }));

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}${successUrlPath}`,
      cancel_url: `${origin}${cancelUrlPath}/${order.restaurant_id}`,
      payment_method_types: ['card'],
      metadata: {
        order_id: order.id,
        restaurant_id: order.restaurant_id,
      },
    });

    // Mettre à jour la commande avec l'ID de session Stripe
    await supabase
      .from('orders')
      .update({
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq('id', order.id);

    return ok({
      url: session.url,
      sessionId: session.id,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Erreur création checkout:", error);
    return fail(error instanceof Error ? error.message : "Erreur de paiement", 500);
  }
});

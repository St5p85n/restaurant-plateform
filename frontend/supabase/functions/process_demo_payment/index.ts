import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DemoPaymentRequest {
  orderId: string;
  paymentMethod: "card" | "wave" | "orange_money";
  /** Numéro de téléphone pour Wave et Orange Money */
  phoneNumber?: string;
  /** Simuler un refus : passer true pour tester le cas d'échec */
  simulateFailure?: boolean;
}

function ok(data: unknown): Response {
  return new Response(JSON.stringify({ code: "SUCCESS", message: "Succès", data }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function fail(msg: string, code = 400): Response {
  return new Response(JSON.stringify({ code: "FAIL", message: msg }), {
    status: code,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body: DemoPaymentRequest = await req.json();
    const { orderId, paymentMethod, phoneNumber, simulateFailure = false } = body;

    if (!orderId || !paymentMethod) {
      return fail("Paramètres manquants : orderId et paymentMethod sont requis");
    }
    if ((paymentMethod === "wave" || paymentMethod === "orange_money") && !phoneNumber) {
      return fail("Numéro de téléphone requis pour ce mode de paiement");
    }

    // ── Récupérer la commande ────────────────────────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, total, payment_status, order_number, restaurant_id")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return fail("Commande introuvable");
    }

    // Idempotence : déjà payée
    if (order.payment_status === "paid") {
      return ok({ status: "paid", orderId: order.id, alreadyPaid: true });
    }

    const transactionId = `DEMO_${paymentMethod.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // ── Cas simulé d'échec ───────────────────────────────────────────────────
    if (simulateFailure) {
      if (paymentMethod !== "card") {
        await supabase.from("mobile_payments").insert({
          order_id: orderId,
          payment_method: paymentMethod,
          phone_number: phoneNumber,
          amount: order.total,
          currency: "XOF",
          status: "failed",
          transaction_id: transactionId,
          error_message: "Simulation d'échec — fonds insuffisants",
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          completed_at: new Date().toISOString(),
        });
      }
      return fail("Paiement refusé — simulation d'échec");
    }

    // ── Traitement selon la méthode ─────────────────────────────────────────
    if (paymentMethod === "card") {
      // Carte : paiement immédiat, mise à jour de la commande
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          payment_method: "card",
        })
        .eq("id", orderId)
        .eq("payment_status", "pending"); // mise à jour idempotente

      // Essai sans condition si le premier échoue (statut peut être 'unpaid' selon le contexte)
      if (updateError) {
        await supabase
          .from("orders")
          .update({ payment_status: "paid", payment_method: "card" })
          .eq("id", orderId);
      }

      return ok({
        status: "paid",
        orderId: order.id,
        transactionId,
        paymentMethod: "card",
        paidAt: new Date().toISOString(),
      });
    }

    // Wave ou Orange Money : créer un mobile_payment en "paid" directement (mode démo)
    const { data: mobilePayment, error: mpError } = await supabase
      .from("mobile_payments")
      .insert({
        order_id: orderId,
        payment_method: paymentMethod,
        phone_number: phoneNumber,
        amount: order.total,
        currency: "XOF",
        status: "paid",
        transaction_id: transactionId,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .maybeSingle();

    if (mpError) {
      return fail(`Erreur création paiement mobile : ${mpError.message}`, 500);
    }

    // Mettre à jour la commande
    await supabase
      .from("orders")
      .update({ payment_status: "paid", payment_method: paymentMethod })
      .eq("id", orderId);

    return ok({
      status: "paid",
      orderId: order.id,
      paymentId: mobilePayment?.id,
      transactionId,
      paymentMethod,
      paidAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Erreur process_demo_payment:", err);
    return fail(err instanceof Error ? err.message : "Erreur interne", 500);
  }
});

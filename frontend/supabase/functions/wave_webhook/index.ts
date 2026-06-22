import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl!, supabaseKey!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-wave-signature",
};

interface WaveWebhookPayload {
  event: string;
  data: {
    id: string;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    phone: string;
    created_at: string;
    completed_at?: string;
  };
}

async function verifySignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payload)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return expectedSignature === signature;
  } catch (error) {
    console.error("Erreur vérification signature:", error);
    return false;
  }
}

async function updatePaymentFromWebhook(
  transactionId: string,
  status: string,
  webhookData: any
): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  try {
    // Trouver le paiement par transaction_id
    const { data: payment, error: fetchError } = await supabase
      .from('mobile_payments')
      .select('id, order_id, status')
      .eq('transaction_id', transactionId)
      .single();

    if (fetchError || !payment) {
      return { success: false, error: 'Paiement introuvable' };
    }

    // Si déjà payé, ignorer
    if (payment.status === 'paid') {
      return { success: true, paymentId: payment.id };
    }

    // Déterminer le nouveau statut
    let newStatus: 'paid' | 'failed' | 'processing' = 'processing';
    
    if (status === 'completed' || status === 'success' || status === 'successful') {
      newStatus = 'paid';
    } else if (status === 'failed' || status === 'rejected' || status === 'cancelled') {
      newStatus = 'failed';
    }

    // Mettre à jour le paiement mobile
    const { error: updateError } = await supabase
      .from('mobile_payments')
      .update({
        status: newStatus,
        completed_at: newStatus === 'paid' || newStatus === 'failed' ? new Date().toISOString() : null,
        provider_response: webhookData,
      })
      .eq('id', payment.id)
      .eq('status', payment.status); // Prévention des doublons

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Si payé, mettre à jour la commande
    if (newStatus === 'paid') {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', payment.order_id)
        .eq('payment_status', 'unpaid');

      if (orderError) {
        console.error('Erreur mise à jour commande:', orderError);
      }
    }

    return { success: true, paymentId: payment.id };
  } catch (error) {
    console.error('Erreur updatePaymentFromWebhook:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
  }
}

async function logWebhook(
  paymentId: string | undefined,
  payload: any,
  signature: string | null,
  signatureValid: boolean,
  status: 'received' | 'processed' | 'failed' | 'ignored',
  errorMessage: string | null,
  processingTimeMs: number
): Promise<void> {
  try {
    await supabase.from('webhook_logs').insert({
      payment_id: paymentId || null,
      provider: 'wave',
      event_type: payload.event || 'unknown',
      payload: payload,
      signature: signature,
      signature_valid: signatureValid,
      status: status,
      error_message: errorMessage,
      processing_time_ms: processingTimeMs,
      processed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur log webhook:', error);
  }
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Récupérer le payload
    const rawBody = await req.text();
    const payload: WaveWebhookPayload = JSON.parse(rawBody);

    // Récupérer la signature
    const signature = req.headers.get('x-wave-signature') || req.headers.get('wave-signature');
    const webhookSecret = Deno.env.get("WAVE_WEBHOOK_SECRET");

    let signatureValid = false;

    // Vérifier la signature si le secret est configuré
    if (webhookSecret && signature) {
      signatureValid = await verifySignature(rawBody, signature, webhookSecret);
      
      if (!signatureValid) {
        const processingTime = Date.now() - startTime;
        await logWebhook(
          undefined,
          payload,
          signature,
          false,
          'failed',
          'Signature invalide',
          processingTime
        );
        return new Response(
          JSON.stringify({ error: 'Signature invalide' }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else if (webhookSecret && !signature) {
      const processingTime = Date.now() - startTime;
      await logWebhook(
        undefined,
        payload,
        null,
        false,
        'failed',
        'Signature manquante',
        processingTime
      );
      return new Response(
        JSON.stringify({ error: 'Signature manquante' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Extraire les données
    const transactionId = payload.data?.reference;
    const status = payload.data?.status;

    if (!transactionId) {
      const processingTime = Date.now() - startTime;
      await logWebhook(
        undefined,
        payload,
        signature,
        signatureValid,
        'failed',
        'Transaction ID manquant',
        processingTime
      );
      return new Response(
        JSON.stringify({ error: 'Transaction ID manquant' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mettre à jour le paiement
    const result = await updatePaymentFromWebhook(transactionId, status, payload.data);

    const processingTime = Date.now() - startTime;

    if (result.success) {
      await logWebhook(
        result.paymentId,
        payload,
        signature,
        signatureValid,
        'processed',
        null,
        processingTime
      );

      return new Response(
        JSON.stringify({ received: true, paymentId: result.paymentId }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else {
      await logWebhook(
        result.paymentId,
        payload,
        signature,
        signatureValid,
        'failed',
        result.error || 'Erreur inconnue',
        processingTime
      );

      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  } catch (error) {
    console.error("Erreur webhook Wave:", error);
    
    const processingTime = Date.now() - startTime;
    await logWebhook(
      undefined,
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      null,
      false,
      'failed',
      error instanceof Error ? error.message : 'Erreur inconnue',
      processingTime
    );

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur inconnue' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

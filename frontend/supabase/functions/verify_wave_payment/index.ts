import { createClient } from "jsr:@supabase/supabase-js@2";

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

async function updateOrderPaymentStatus(
  paymentId: string,
  status: 'paid' | 'failed'
): Promise<boolean> {
  const { data: payment, error: fetchError } = await supabase
    .from('mobile_payments')
    .select('order_id, status')
    .eq('id', paymentId)
    .single();

  if (fetchError || !payment) {
    console.error("Erreur récupération paiement:", fetchError);
    return false;
  }

  if (payment.status === 'paid') {
    return true;
  }

  // Mettre à jour le paiement mobile
  const { error: paymentError } = await supabase
    .from('mobile_payments')
    .update({
      status: status,
      completed_at: new Date().toISOString(),
    })
    .eq('id', paymentId);

  if (paymentError) {
    console.error("Erreur mise à jour paiement:", paymentError);
    return false;
  }

  // Mettre à jour la commande si le paiement est réussi
  if (status === 'paid') {
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', payment.order_id)
      .eq('payment_status', 'unpaid');

    if (orderError) {
      console.error("Erreur mise à jour commande:", orderError);
      return false;
    }
  }

  return true;
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const { paymentId } = await req.json();
    if (!paymentId) {
      throw new Error("ID de paiement manquant");
    }

    // Récupérer le paiement mobile
    const { data: payment, error: paymentError } = await supabase
      .from('mobile_payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      throw new Error("Paiement introuvable");
    }

    // Si déjà payé, retourner le statut
    if (payment.status === 'paid') {
      return ok({
        verified: true,
        status: 'paid',
        paymentId: payment.id,
        transactionId: payment.transaction_id,
        completedAt: payment.completed_at,
      });
    }

    // Vérifier si le paiement a expiré
    if (payment.expires_at && new Date(payment.expires_at) < new Date()) {
      await supabase
        .from('mobile_payments')
        .update({ status: 'expired' })
        .eq('id', paymentId);

      return ok({
        verified: false,
        status: 'expired',
        paymentId: payment.id,
        message: 'Le paiement a expiré',
      });
    }

    const waveApiKey = Deno.env.get("WAVE_API_KEY");
    const waveApiUrl = Deno.env.get("WAVE_API_URL");

    if (!waveApiKey || !waveApiUrl) {
      console.warn("Wave API non configurée - Mode simulation");
      
      // En mode simulation, retourner le statut actuel
      return ok({
        verified: payment.status === 'paid',
        status: payment.status,
        paymentId: payment.id,
        transactionId: payment.transaction_id,
        message: 'Statut actuel (mode simulation)',
      });
    }

    // Vérifier le statut auprès de Wave (à adapter selon la documentation Wave)
    const waveResponse = await fetch(
      `${waveApiUrl}/payments/${payment.provider_reference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${waveApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!waveResponse.ok) {
      throw new Error('Erreur lors de la vérification Wave');
    }

    const waveData = await waveResponse.json();

    // Déterminer le statut en fonction de la réponse Wave
    let newStatus: 'paid' | 'failed' | 'processing' = 'processing';
    
    if (waveData.status === 'completed' || waveData.status === 'success') {
      newStatus = 'paid';
    } else if (waveData.status === 'failed' || waveData.status === 'rejected') {
      newStatus = 'failed';
    }

    // Mettre à jour si le statut a changé
    if (newStatus === 'paid' || newStatus === 'failed') {
      await updateOrderPaymentStatus(paymentId, newStatus);
    }

    return ok({
      verified: newStatus === 'paid',
      status: newStatus,
      paymentId: payment.id,
      transactionId: payment.transaction_id,
      providerStatus: waveData.status,
      completedAt: newStatus === 'paid' ? new Date().toISOString() : null,
    });
  } catch (error) {
    console.error("Erreur vérification paiement Wave:", error);
    return fail(error instanceof Error ? error.message : "Erreur de vérification", 500);
  }
});

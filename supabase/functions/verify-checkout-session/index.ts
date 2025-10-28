import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id is required");
    logStep("Session ID received", { session_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Session retrieved", { 
      paymentStatus: session.payment_status,
      status: session.status,
      customerId: session.customer 
    });

    if (session.payment_status !== "paid") {
      throw new Error(`Payment not completed. Status: ${session.payment_status}`);
    }

    // Get metadata
    const metadata = session.metadata || {};
    const companyId = metadata.company_id;
    const planId = metadata.plan_id;
    const aiMatchingEnabled = metadata.ai_matching_enabled === "true";
    const aiMatchingPriceEur = parseInt(metadata.ai_matching_price_eur || "0");

    if (!companyId || !planId) {
      throw new Error("Missing metadata in checkout session");
    }
    logStep("Metadata extracted", { companyId, planId, aiMatchingEnabled, aiMatchingPriceEur });

    // Verify company belongs to user
    const { data: companyData, error: companyError } = await supabaseClient
      .from('company_profiles')
      .select('id')
      .eq('id', companyId)
      .eq('user_id', user.id)
      .single();
    
    if (companyError || !companyData) {
      throw new Error("Company verification failed");
    }

    // Deactivate old subscriptions
    const { error: deactivateError } = await supabaseClient
      .from('company_subscriptions')
      .update({ is_active: false })
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (deactivateError) {
      logStep("Warning: Failed to deactivate old subscriptions", { error: deactivateError.message });
    } else {
      logStep("Old subscriptions deactivated");
    }

    // Create new subscription
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    const { data: newSubscription, error: subscriptionError } = await supabaseClient
      .from('company_subscriptions')
      .insert({
        company_id: companyId,
        plan_id: planId,
        is_active: true,
        is_trial: true,
        trial_end_date: trialEndDate.toISOString(),
        ai_matching_enabled: aiMatchingEnabled,
        ai_matching_price_eur: aiMatchingPriceEur,
        jobs_used: 0,
        ai_matches_used_this_month: 0,
        ai_matches_reset_date: new Date().toISOString(),
        stripe_subscription_id: session.subscription as string,
        stripe_customer_id: session.customer as string,
      })
      .select()
      .single();

    if (subscriptionError) throw subscriptionError;
    logStep("New subscription created", { subscriptionId: newSubscription.id });

    return new Response(JSON.stringify({ 
      success: true,
      subscription: newSubscription 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
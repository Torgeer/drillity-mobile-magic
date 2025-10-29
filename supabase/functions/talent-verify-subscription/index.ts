import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const getAllowedOrigins = () => {
  const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
  return [
    'https://www.drillity.com',
    'https://drillity.com',
    supabaseUrl
  ].filter(Boolean) as string[];
};

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigins = getAllowedOrigins();
  const isAllowed = origin && allowedOrigins.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TALENT-VERIFY] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { session_id } = await req.json();
    if (!session_id) throw new Error("Session ID is required");
    logStep("Session ID received", { session_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Checkout session retrieved", { sessionId: session.id, status: session.payment_status });

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Get subscription from Stripe
    const subscriptionId = session.subscription as string;
    if (!subscriptionId) throw new Error("No subscription found in session");

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    logStep("Subscription retrieved", { subscriptionId, status: subscription.status });

    // Get metadata from session
    const talent_id = session.metadata?.talent_id || user.id;
    const plan_id = session.metadata?.plan_id;

    if (!plan_id) throw new Error("Plan ID not found in session metadata");

    // Deactivate existing active subscriptions for this talent
    const { error: deactivateError } = await supabaseClient
      .from('talent_subscriptions')
      .update({ is_active: false })
      .eq('talent_id', talent_id)
      .eq('is_active', true);

    if (deactivateError) {
      logStep("Error deactivating existing subscriptions", { error: deactivateError });
    } else {
      logStep("Deactivated existing active subscriptions");
    }

    // Calculate end_date based on billing interval
    const startDate = new Date(subscription.current_period_start * 1000);
    const endDate = new Date(subscription.current_period_end * 1000);

    // Create new subscription record
    const { data: newSub, error: insertError } = await supabaseClient
      .from('talent_subscriptions')
      .insert({
        talent_id,
        plan_id,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: subscription.customer as string,
        is_active: subscription.status === 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        applications_used_this_month: 0,
        applications_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        profile_highlights_used_this_month: 0,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    logStep("New subscription created", { subscriptionId: newSub.id });

    return new Response(JSON.stringify({ 
      success: true,
      subscription: newSub 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in talent-verify-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

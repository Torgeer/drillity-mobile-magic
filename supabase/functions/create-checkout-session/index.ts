import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { plan_id, ai_matching_enabled } = await req.json();
    if (!plan_id) throw new Error("plan_id is required");
    logStep("Request params", { plan_id, ai_matching_enabled });

    // Get company_id
    const { data: companyData, error: companyError } = await supabaseClient
      .from('company_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (companyError || !companyData) throw new Error("Company not found");
    const companyId = companyData.id;
    logStep("Company found", { companyId });

    // Get plan details
    const { data: planData, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();
    
    if (planError || !planData) throw new Error("Plan not found");
    if (!planData.stripe_price_id) throw new Error("Plan missing stripe_price_id");
    logStep("Plan found", { planName: planData.name, stripePriceId: planData.stripe_price_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data.length > 0 ? customers.data[0].id : undefined;
    logStep("Customer check", { customerId, exists: !!customerId });

    // Build line items
    const lineItems: any[] = [
      {
        price: planData.stripe_price_id,
        quantity: 1,
      }
    ];

    // Calculate AI matching price
    let aiMatchingPrice = 0;
    if (ai_matching_enabled) {
      const basePriceEur = planData.price_eur;
      aiMatchingPrice = basePriceEur <= 100 ? Math.round(basePriceEur * 0.10) : Math.round(basePriceEur * 0.30);
      logStep("AI matching addon", { aiMatchingPrice });
      
      // Note: For AI addon, you'd need a separate Stripe Price or use checkout line_items with price_data
      // For now, we'll store this in metadata and handle it after checkout
    }

    const origin = req.headers.get("origin") || "http://localhost:8080";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "subscription",
      success_url: `${origin}/company/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/company/subscription`,
      metadata: {
        company_id: companyId,
        plan_id: plan_id,
        ai_matching_enabled: ai_matching_enabled ? "true" : "false",
        ai_matching_price_eur: aiMatchingPrice.toString(),
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
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
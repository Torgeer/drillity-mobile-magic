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

    const { plan_id, ai_matching_enabled, billing_interval = 'month' } = await req.json();
    if (!plan_id) throw new Error("plan_id is required");
    logStep("Request params", { plan_id, ai_matching_enabled, billing_interval });

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
    
    // Select price based on billing interval
    const stripePriceId = billing_interval === 'year' 
      ? planData.stripe_price_id_annual 
      : planData.stripe_price_id;
    
    if (!stripePriceId) throw new Error(`Plan missing price_id for ${billing_interval}`);
    logStep("Plan found", { planName: planData.name, stripePriceId, billingInterval: billing_interval });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data.length > 0 ? customers.data[0].id : undefined;
    logStep("Customer check", { customerId, exists: !!customerId });

    // Check if user is eligible for early bird discount (registered before 2026-01-01)
    const isEarlyBird = new Date(user.created_at || '') < new Date('2026-01-01');
    logStep("Early bird eligibility", { isEarlyBird, userCreatedAt: user.created_at });

    // Build line items - add main subscription
    const lineItems: any[] = [
      {
        price: stripePriceId,
        quantity: 1,
      }
    ];

    // Add AI matching as a separate line item if enabled
    let aiMatchingPrice = 0;
    if (ai_matching_enabled) {
      const aiPriceId = billing_interval === 'year' ? planData.stripe_ai_price_id_annual : planData.stripe_ai_price_id;
      
      if (!aiPriceId) {
        throw new Error(`AI price ID not found for ${billing_interval}ly billing`);
      }
      
      logStep("Adding AI matching line item", { aiPriceId });
      lineItems.push({
        price: aiPriceId,
        quantity: 1,
      });
      
      // Calculate AI price for metadata
      const basePriceEur = planData.price_eur;
      aiMatchingPrice = basePriceEur <= 100 ? Math.round(basePriceEur * 0.10) : Math.round(basePriceEur * 0.30);
      logStep("AI matching price", { aiMatchingPrice });
    }

    const origin = req.headers.get("origin") || "http://localhost:8080";
    
    // Prepare discounts for early bird campaign
    const discounts: any[] = [];
    if (isEarlyBird) {
      // Apply 50% early bird discount
      discounts.push({ coupon: '5Hx8r3Cg' });
      logStep("Applied early bird discount", { couponId: '5Hx8r3Cg' });
      
      // Apply additional 30% for annual billing
      if (billing_interval === 'year') {
        discounts.push({ coupon: 'GDJHdAmk' });
        logStep("Applied annual discount", { couponId: 'GDJHdAmk' });
      }
    }
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "subscription",
      discounts: discounts.length > 0 ? discounts : undefined,
      success_url: `${origin}/company/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/company/subscription`,
      metadata: {
        company_id: companyId,
        plan_id: plan_id,
        ai_matching_enabled: ai_matching_enabled ? "true" : "false",
        ai_matching_price_eur: aiMatchingPrice.toString(),
        billing_interval: billing_interval,
        early_bird_discount: isEarlyBird ? "true" : "false",
        annual_discount: (isEarlyBird && billing_interval === 'year') ? "true" : "false",
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
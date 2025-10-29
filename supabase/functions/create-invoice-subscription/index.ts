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
  console.log(`[CREATE-INVOICE] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  
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

    const { 
      plan_id, 
      ai_matching_enabled, 
      billing_interval = 'month',
      payment_terms = 30,
      po_number,
      vat_number,
      billing_email,
      company_name,
      billing_address
    } = await req.json();
    
    if (!plan_id) throw new Error("plan_id is required");
    logStep("Request params", { 
      plan_id, 
      ai_matching_enabled, 
      billing_interval, 
      payment_terms,
      po_number,
      vat_number
    });

    // Get company_id
    const { data: companyData, error: companyError } = await supabaseClient
      .from('company_profiles')
      .select('id, company_name, address, contact_email')
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
    
    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: billing_email || user.email,
        name: company_name || companyData.company_name,
        address: billing_address ? {
          line1: billing_address.line1,
          line2: billing_address.line2,
          city: billing_address.city,
          state: billing_address.state,
          postal_code: billing_address.postal_code,
          country: billing_address.country
        } : undefined,
        metadata: {
          company_id: companyId,
          user_id: user.id
        }
      });
      customerId = customer.id;
      logStep("Customer created", { customerId });
    } else {
      // Update customer with latest info
      await stripe.customers.update(customerId, {
        email: billing_email || user.email,
        name: company_name || companyData.company_name,
        address: billing_address ? {
          line1: billing_address.line1,
          line2: billing_address.line2,
          city: billing_address.city,
          state: billing_address.state,
          postal_code: billing_address.postal_code,
          country: billing_address.country
        } : undefined,
      });
      logStep("Customer updated", { customerId });
    }

    // Check early bird eligibility
    const isEarlyBird = new Date(user.created_at || '') < new Date('2026-01-01');
    logStep("Early bird eligibility", { isEarlyBird, userCreatedAt: user.created_at });

    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: payment_terms,
      auto_advance: false, // Don't auto-finalize
      metadata: {
        company_id: companyId,
        plan_id: plan_id,
        ai_matching_enabled: ai_matching_enabled ? "true" : "false",
        billing_interval: billing_interval,
        early_bird_discount: isEarlyBird ? "true" : "false",
        annual_discount: (isEarlyBird && billing_interval === 'year') ? "true" : "false",
        po_number: po_number || "",
      },
      custom_fields: po_number ? [
        {
          name: 'Purchase Order',
          value: po_number
        }
      ] : undefined,
      footer: vat_number ? `VAT Number: ${vat_number}` : undefined,
      description: `${planData.name} Plan - ${billing_interval === 'year' ? 'Annual' : 'Monthly'} Billing${ai_matching_enabled ? ' + AI Matching' : ''}`
    });

    logStep("Invoice created", { invoiceId: invoice.id });

    // Add main subscription as invoice item
    await stripe.invoiceItems.create({
      customer: customerId,
      invoice: invoice.id,
      price: stripePriceId,
      quantity: billing_interval === 'year' ? 12 : 1,
      description: `${planData.name} Plan - ${billing_interval === 'year' ? 'Annual' : 'Monthly'} Subscription`
    });

    // Add AI matching if enabled
    if (ai_matching_enabled) {
      const aiPriceId = billing_interval === 'year' ? planData.stripe_ai_price_id_annual : planData.stripe_ai_price_id;
      
      if (!aiPriceId) {
        throw new Error(`AI price ID not found for ${billing_interval}ly billing`);
      }
      
      logStep("Adding AI matching to invoice", { aiPriceId });
      
      await stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        price: aiPriceId,
        quantity: billing_interval === 'year' ? 12 : 1,
        description: `AI-Powered Talent Matching - ${billing_interval === 'year' ? 'Annual' : 'Monthly'}`
      });
    }

    // Apply discounts
    if (isEarlyBird) {
      // Apply 50% early bird discount
      await stripe.invoices.update(invoice.id, {
        discounts: [{ coupon: '5Hx8r3Cg' }]
      });
      logStep("Applied early bird discount", { couponId: '5Hx8r3Cg' });
      
      // Apply additional 30% for annual billing
      if (billing_interval === 'year') {
        await stripe.invoices.update(invoice.id, {
          discounts: [
            { coupon: '5Hx8r3Cg' },
            { coupon: 'GDJHdAmk' }
          ]
        });
        logStep("Applied annual discount", { couponId: 'GDJHdAmk' });
      }
    }

    // Finalize the invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    logStep("Invoice finalized", { invoiceId: finalizedInvoice.id });

    // Send the invoice
    const sentInvoice = await stripe.invoices.sendInvoice(invoice.id);
    logStep("Invoice sent", { 
      invoiceId: sentInvoice.id, 
      invoiceUrl: sentInvoice.hosted_invoice_url,
      invoicePdf: sentInvoice.invoice_pdf
    });

    return new Response(JSON.stringify({ 
      success: true,
      invoice_id: sentInvoice.id,
      invoice_url: sentInvoice.hosted_invoice_url,
      invoice_pdf: sentInvoice.invoice_pdf,
      amount_due: sentInvoice.amount_due / 100, // Convert cents to euros
      currency: sentInvoice.currency,
      due_date: sentInvoice.due_date ? new Date(sentInvoice.due_date * 1000).toISOString() : null
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

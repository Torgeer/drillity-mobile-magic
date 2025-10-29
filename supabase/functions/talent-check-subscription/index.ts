import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
  console.log(`[TALENT-CHECK-SUB] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

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
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get active subscription
    const { data: subscriptionData, error: subError } = await supabaseClient
      .from('talent_subscriptions')
      .select(`
        *,
        talent_subscription_plans (
          name,
          application_limit,
          skill_limit,
          certification_limit,
          cv_upload_limit,
          profile_views_enabled,
          featured_profile,
          verified_badge,
          analytics_dashboard,
          ai_profile_autofill,
          ai_job_matching
        )
      `)
      .eq('talent_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscriptionData) {
      // No active subscription, return FREE tier
      logStep("No active subscription found, returning FREE tier");
      
      const { data: freePlan } = await supabaseClient
        .from('talent_subscription_plans')
        .select('*')
        .eq('name', 'FREE')
        .single();

      return new Response(JSON.stringify({
        subscribed: false,
        plan_name: "FREE",
        plan_details: freePlan,
        applications_used: 0,
        applications_limit: freePlan?.application_limit || 3,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const planDetails = subscriptionData.talent_subscription_plans as any;
    logStep("Active subscription found", { 
      planName: planDetails.name,
      applicationsUsed: subscriptionData.applications_used_this_month,
      applicationsLimit: planDetails.application_limit 
    });

    return new Response(JSON.stringify({
      subscribed: true,
      plan_name: planDetails.name,
      plan_details: planDetails,
      subscription_end: subscriptionData.end_date,
      applications_used: subscriptionData.applications_used_this_month,
      applications_limit: planDetails.application_limit,
      applications_reset_date: subscriptionData.applications_reset_date,
      profile_highlights_used: subscriptionData.profile_highlights_used_this_month,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in talent-check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

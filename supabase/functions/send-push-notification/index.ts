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
  console.log(`[PUSH-NOTIFICATION] ${step}${detailsStr}`);
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

    const { user_id, title, body, data } = await req.json();
    
    if (!user_id || !title || !body) {
      throw new Error("user_id, title, and body are required");
    }

    logStep("Notification request received", { user_id, title });

    // Get user's push tokens
    const { data: tokens, error: tokensError } = await supabaseClient
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', user_id);

    if (tokensError) throw tokensError;

    if (!tokens || tokens.length === 0) {
      logStep("No push tokens found for user", { user_id });
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No push tokens registered" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Found push tokens", { count: tokens.length });

    // Here you would integrate with Firebase Cloud Messaging or Apple Push Notification Service
    // For now, we'll log the notification
    const notifications = tokens.map(token => ({
      token: token.token,
      platform: token.platform,
      notification: { title, body, data }
    }));

    logStep("Notifications prepared", { count: notifications.length });

    // TODO: Implement actual push notification sending via FCM/APNs
    // For production, integrate with:
    // - Firebase Cloud Messaging for Android/Web
    // - Apple Push Notification Service for iOS

    return new Response(JSON.stringify({ 
      success: true,
      sent: notifications.length,
      message: "Notifications processed"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in send-push-notification", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

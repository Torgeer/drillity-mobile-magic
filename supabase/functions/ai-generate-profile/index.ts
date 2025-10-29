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
  console.log(`[AI-PROFILE] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Fetch user's profile, skills, and certifications
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, location, experience_years')
      .eq('id', user.id)
      .single();

    const { data: skills } = await supabaseClient
      .from('talent_skills')
      .select('skill_name, skill_level')
      .eq('talent_id', user.id);

    const { data: certifications } = await supabaseClient
      .from('talent_certifications')
      .select('certification_name, issuer')
      .eq('talent_id', user.id);

    logStep("Fetched user data", { skills: skills?.length, certs: certifications?.length });

    // Build context for AI
    const skillsList = skills?.map(s => `${s.skill_name} (${s.skill_level})`).join(', ') || 'No skills added yet';
    const certsList = certifications?.map(c => `${c.certification_name}${c.issuer ? ` from ${c.issuer}` : ''}`).join(', ') || 'No certifications added yet';
    
    const prompt = `Generate a professional bio for a drilling/mining professional with the following profile:

Name: ${profile?.full_name || 'Professional'}
Location: ${profile?.location || 'Not specified'}
Experience: ${profile?.experience_years || 0} years
Skills: ${skillsList}
Certifications: ${certsList}

Write a compelling 2-3 sentence bio that highlights their expertise and experience in the drilling/mining industry. Keep it professional but engaging.`;

    logStep("Calling Lovable AI");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert at writing professional bios for drilling and mining professionals." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("AI API error", { status: response.status, error: errorText });
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedBio = data.choices?.[0]?.message?.content;

    if (!generatedBio) throw new Error("No bio generated");

    logStep("Bio generated successfully");

    return new Response(JSON.stringify({ bio: generatedBio }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in ai-generate-profile", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

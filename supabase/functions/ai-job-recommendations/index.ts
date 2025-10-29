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
  console.log(`[AI-RECOMMENDATIONS] ${step}${detailsStr}`);
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

    // Fetch user's profile and skills
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('location, experience_years, preferred_work_type')
      .eq('id', user.id)
      .single();

    const { data: skills } = await supabaseClient
      .from('talent_skills')
      .select('skill_name, skill_level')
      .eq('talent_id', user.id);

    // Fetch active jobs
    const { data: jobs } = await supabaseClient
      .from('jobs')
      .select(`
        id,
        title,
        location,
        job_type,
        experience_level,
        skills,
        salary_min,
        salary_max,
        company_id
      `)
      .eq('is_active', true)
      .limit(20);

    // Fetch company names separately
    const companyIds = jobs?.map(j => j.company_id) || [];
    const { data: companies } = await supabaseClient
      .from('company_profiles')
      .select('id, company_name')
      .in('id', companyIds);

    const jobsWithCompanies = jobs?.map(job => ({
      ...job,
      company_name: companies?.find(c => c.id === job.company_id)?.company_name || 'Unknown'
    })) || [];

    if (!jobsWithCompanies || jobsWithCompanies.length === 0) {
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Fetched data", { jobCount: jobsWithCompanies.length, skillCount: skills?.length });

    const userSkills = skills?.map(s => s.skill_name).join(', ') || 'None';
    const userLocation = profile?.location || 'Not specified';
    const userExperience = profile?.experience_years || 0;

    const prompt = `You are a job matching AI. Analyze these jobs and recommend the top 5 best matches for this candidate:

Candidate Profile:
- Location: ${userLocation}
- Experience: ${userExperience} years
- Skills: ${userSkills}
- Preferred work types: ${profile?.preferred_work_type?.join(', ') || 'Any'}

Available Jobs:
${jobsWithCompanies.map((j, i) => `${i + 1}. ${j.title} at ${j.company_name} (${j.location}, ${j.experience_level}, skills: ${j.skills?.join(', ') || 'none listed'})`).join('\n')}

Return ONLY a JSON array of the top 5 job IDs with match scores (0-100) and a brief reason. Format:
[{"job_id": "uuid", "match_score": 85, "reason": "Strong skills match"}]`;

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
          { role: "system", content: "You are a job matching expert. Always return valid JSON arrays." },
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
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) throw new Error("No recommendations generated");

    // Parse JSON from AI response
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    const recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    logStep("Recommendations generated", { count: recommendations.length });

    // Enrich with full job data
    const enrichedRecommendations = recommendations.map((rec: any) => {
      const job = jobsWithCompanies.find(j => j.id === rec.job_id);
      return {
        ...rec,
        job: job || null
      };
    }).filter((rec: any) => rec.job !== null);

    return new Response(JSON.stringify({ recommendations: enrichedRecommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in ai-job-recommendations", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage, recommendations: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

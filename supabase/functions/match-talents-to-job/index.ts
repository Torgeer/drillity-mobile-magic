import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TalentCandidate {
  id: string;
  full_name: string;
  experience_years: number;
  location: string;
  latitude: number;
  longitude: number;
  availability_status: string;
  skills: Array<{ skill_name: string; skill_level: string; industry?: string }>;
  certifications: Array<{ certification_name: string; issuer?: string }>;
  distance_km?: number | null;
}

interface JobDetails {
  id: string;
  title: string;
  description: string;
  skills: string[];
  certifications: string[];
  experience_level: string;
  location: string;
  latitude: number;
  longitude: number;
  job_type: string;
  industry?: string;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { job_id } = await req.json();
    
    if (!job_id) {
      throw new Error('job_id is required');
    }

    console.log(`Starting matching process for job: ${job_id}`);

    // 1. Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      throw new Error(`Job not found: ${jobError?.message}`);
    }

    const jobDetails: JobDetails = {
      id: job.id,
      title: job.title,
      description: job.description,
      skills: job.skills || [],
      certifications: job.certifications || [],
      experience_level: job.experience_level,
      location: job.location,
      latitude: job.latitude,
      longitude: job.longitude,
      job_type: job.job_type,
    };

    console.log(`Job details loaded: ${job.title}`);

    // 2. Check company subscription and AI matching quota
    const { data: subscription } = await supabase
      .from('company_subscriptions')
      .select('*')
      .eq('company_id', job.company_id)
      .eq('is_active', true)
      .single();

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // Check if in trial period
    const isInTrial = subscription.is_trial && new Date(subscription.trial_end_date) > new Date();
    
    // Check AI matching quota
    const hasUnlimitedAI = subscription.ai_matching_enabled || isInTrial;
    const monthlyQuotaReached = !hasUnlimitedAI && subscription.ai_matches_used_this_month >= 1;

    if (monthlyQuotaReached) {
      return new Response(
        JSON.stringify({ 
          error: 'Monthly AI matching quota reached. Upgrade to unlimited AI matching to continue.',
          quota_reached: true,
          success: false,
          upgrade_url: '/company/subscription'
        }),
        { 
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Subscription check passed. Unlimited AI: ${hasUnlimitedAI}, Trial: ${isInTrial}`);

    // 3. Get matching preferences for company
    const { data: preferences } = await supabase
      .from('matching_preferences')
      .select('*')
      .eq('company_id', job.company_id)
      .maybeSingle();

    const minMatchScore = preferences?.min_match_score || 70;
    const maxDistance = preferences?.max_distance_km;

    console.log(`Matching preferences - Min score: ${minMatchScore}, Max distance: ${maxDistance}km`);

    // 3. SQL pre-filter to find top candidates (HYBRID APPROACH)
    // This reduces AI costs by only analyzing the most relevant candidates
    let talentsQuery = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        experience_years,
        location,
        latitude,
        longitude,
        availability_status,
        talent_skills (
          skill_name,
          skill_level,
          industry
        ),
        talent_certifications (
          certification_name,
          issuer
        )
      `)
      .eq('user_type', 'talent')
      .in('availability_status', ['available', 'open_to_offers']);

    // Filter by experience level if specified
    if (job.experience_level === 'entry') {
      talentsQuery = talentsQuery.lte('experience_years', 3);
    } else if (job.experience_level === 'mid') {
      talentsQuery = talentsQuery.gte('experience_years', 2).lte('experience_years', 7);
    } else if (job.experience_level === 'senior') {
      talentsQuery = talentsQuery.gte('experience_years', 5);
    }

    const { data: allTalents, error: talentsError } = await talentsQuery;

    if (talentsError) {
      throw new Error(`Failed to fetch talents: ${talentsError.message}`);
    }

    console.log(`Found ${allTalents?.length || 0} potential candidates`);

    if (!allTalents || allTalents.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No talents found matching basic criteria',
          matches_found: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate distances and filter by max distance if set
    const candidates: TalentCandidate[] = allTalents
      .map(talent => {
        const distance = job.latitude && job.longitude && talent.latitude && talent.longitude
          ? calculateDistance(job.latitude, job.longitude, talent.latitude, talent.longitude)
          : null;

        return {
          id: talent.id,
          full_name: talent.full_name || 'Unknown',
          experience_years: talent.experience_years || 0,
          location: talent.location || 'Unknown',
          latitude: talent.latitude,
          longitude: talent.longitude,
          availability_status: talent.availability_status,
          skills: talent.talent_skills || [],
          certifications: talent.talent_certifications || [],
          distance_km: distance,
        };
      })
      .filter(candidate => {
        // Filter by max distance if set
        if (maxDistance && candidate.distance_km !== null) {
          return candidate.distance_km <= maxDistance;
        }
        return true;
      });

    // Score candidates by skill overlap (simple scoring)
    const scoredCandidates = candidates.map(candidate => {
      const candidateSkills = candidate.skills.map(s => s.skill_name.toLowerCase());
      const jobSkills = jobDetails.skills.map(s => s.toLowerCase());
      
      const matchedSkillsCount = jobSkills.filter(js => 
        candidateSkills.some(cs => cs.includes(js) || js.includes(cs))
      ).length;
      
      const skillScore = jobSkills.length > 0 
        ? (matchedSkillsCount / jobSkills.length) * 100 
        : 50;

      return { ...candidate, preliminaryScore: skillScore };
    })
    .sort((a, b) => b.preliminaryScore - a.preliminaryScore)
    .slice(0, 15); // Only take top 15 candidates for AI analysis

    console.log(`Pre-filtered to top ${scoredCandidates.length} candidates for AI analysis`);

    if (scoredCandidates.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No candidates passed pre-filtering',
          matches_found: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. AI Analysis of top candidates
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const matchResults = [];

    for (const candidate of scoredCandidates) {
      console.log(`Analyzing candidate: ${candidate.full_name}`);

      const prompt = `Du är en expert på att matcha talanger med jobbpositioner inom drilling, mining och construction.

JOBB:
- Titel: ${jobDetails.title}
- Beskrivning: ${jobDetails.description}
- Skills krävda: ${jobDetails.skills.join(', ')}
- Certifications krävda: ${jobDetails.certifications.join(', ')}
- Experience level: ${jobDetails.experience_level}
- Plats: ${jobDetails.location}
- Job type: ${jobDetails.job_type}

TALENT:
- Namn: ${candidate.full_name}
- Experience år: ${candidate.experience_years}
- Skills: ${candidate.skills.map(s => `${s.skill_name} (${s.skill_level})`).join(', ')}
- Certifications: ${candidate.certifications.map(c => c.certification_name).join(', ')}
- Plats: ${candidate.location} ${candidate.distance_km ? `(Avstånd: ${Math.round(candidate.distance_km)}km)` : ''}
- Tillgänglighet: ${candidate.availability_status}

Analysera matchen och ge en detaljerad bedömning.`;

      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { 
                role: 'system', 
                content: 'Du är en expert rekryterare inom drilling, mining och construction. Du analyserar hur väl en kandidat passar ett jobb och ger en match-score mellan 0-100.' 
              },
              { role: 'user', content: prompt }
            ],
            tools: [{
              type: "function",
              function: {
                name: "evaluate_talent_job_match",
                description: "Evaluate how well a talent matches a job opening",
                parameters: {
                  type: "object",
                  properties: {
                    match_score: { 
                      type: "integer", 
                      minimum: 0, 
                      maximum: 100,
                      description: "Overall match score from 0-100"
                    },
                    reasoning: { 
                      type: "string",
                      description: "Detailed explanation in Swedish (max 200 words)" 
                    },
                    skills_matched: { 
                      type: "array", 
                      items: { type: "string" },
                      description: "List of skills that match"
                    },
                    skills_missing: { 
                      type: "array", 
                      items: { type: "string" },
                      description: "List of required skills that are missing"
                    },
                    certifications_matched: { 
                      type: "array", 
                      items: { type: "string" } 
                    },
                    certifications_missing: { 
                      type: "array", 
                      items: { type: "string" } 
                    },
                    experience_fit: { 
                      type: "string", 
                      enum: ["under_qualified", "good_fit", "over_qualified"] 
                    },
                    location_score: { 
                      type: "integer", 
                      minimum: 0, 
                      maximum: 100,
                      description: "How well the location matches (distance, willingness to relocate)" 
                    }
                  },
                  required: ["match_score", "reasoning", "experience_fit", "location_score"],
                  additionalProperties: false
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "evaluate_talent_job_match" } }
          }),
        });

        if (!aiResponse.ok) {
          if (aiResponse.status === 429) {
            console.error('Rate limit exceeded');
            continue;
          }
          if (aiResponse.status === 402) {
            console.error('Payment required - out of credits');
            break;
          }
          const errorText = await aiResponse.text();
          console.error(`AI API error: ${aiResponse.status} - ${errorText}`);
          continue;
        }

        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        
        if (!toolCall) {
          console.error('No tool call in AI response');
          continue;
        }

        const matchData = JSON.parse(toolCall.function.arguments);

        // Only save if match score meets threshold
        if (matchData.match_score >= minMatchScore) {
          // Save match to database
          const { error: insertError } = await supabase
            .from('talent_job_matches')
            .insert({
              talent_id: candidate.id,
              job_id: job.id,
              match_score: matchData.match_score,
              match_reasoning: matchData.reasoning,
              skills_matched: matchData.skills_matched || [],
              skills_missing: matchData.skills_missing || [],
              certifications_matched: matchData.certifications_matched || [],
              certifications_missing: matchData.certifications_missing || [],
              experience_fit: matchData.experience_fit,
              location_score: matchData.location_score,
            });

          if (insertError) {
            console.error(`Failed to save match: ${insertError.message}`);
          } else {
            matchResults.push({
              talent_id: candidate.id,
              talent_name: candidate.full_name,
              match_score: matchData.match_score,
            });
            console.log(`Saved match: ${candidate.full_name} - Score: ${matchData.match_score}`);
          }
        } else {
          console.log(`Match score too low (${matchData.match_score}) for ${candidate.full_name}`);
        }

      } catch (aiError) {
        console.error(`AI analysis failed for ${candidate.full_name}:`, aiError);
        continue;
      }
    }

    console.log(`Matching complete. Found ${matchResults.length} matches above threshold`);

    // Update AI match usage
    const wasFreeMatch = !hasUnlimitedAI && subscription.ai_matches_used_this_month === 0;
    
    await supabase.from('ai_match_usage').insert({
      job_id: job.id,
      company_id: job.company_id,
      matches_found: matchResults.length,
      cost_estimate: scoredCandidates.length * 0.005, // Estimated cost per match
      was_free: wasFreeMatch
    });

    // Increment company's AI matches counter if not unlimited
    if (!hasUnlimitedAI) {
      await supabase
        .from('company_subscriptions')
        .update({ 
          ai_matches_used_this_month: subscription.ai_matches_used_this_month + 1 
        })
        .eq('id', subscription.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        job_id: job.id,
        candidates_analyzed: scoredCandidates.length,
        matches_found: matchResults.length,
        matches: matchResults,
        quota_info: {
          has_unlimited: hasUnlimitedAI,
          is_trial: isInTrial,
          matches_used: subscription.ai_matches_used_this_month + 1,
          was_free: wasFreeMatch
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in match-talents-to-job:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
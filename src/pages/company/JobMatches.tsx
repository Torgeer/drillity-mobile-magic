import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CompanyLayout } from '@/components/CompanyLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ArrowLeft, MapPin, Briefcase, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface TalentMatch {
  id: string;
  talent_id: string;
  match_score: number;
  match_reasoning: string;
  skills_matched: string[];
  skills_missing: string[];
  certifications_matched: string[];
  certifications_missing: string[];
  experience_fit: string;
  location_score: number;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    location: string | null;
    experience_years: number | null;
    availability_status: string | null;
  } | null;
}

interface Job {
  id: string;
  title: string;
  location: string;
}

export default function JobMatches() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [matches, setMatches] = useState<TalentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchJobAndMatches();
    }
  }, [jobId]);

  const fetchJobAndMatches = async () => {
    setLoading(true);
    try {
      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('id, title, location')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      const { data: matchesData, error: matchesError } = await supabase
        .from('talent_job_matches')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url,
            location,
            experience_years,
            availability_status
          )
        `)
        .eq('job_id', jobId)
        .order('match_score', { ascending: false });

      if (matchesError) throw matchesError;
      setMatches((matchesData as any) || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleFindMatches = async () => {
    setMatching(true);
    try {
      const { data, error } = await supabase.functions.invoke('match-talents-to-job', {
        body: { job_id: jobId }
      });

      if (error) {
        if (error.message?.includes('quota')) {
          toast.error('Monthly AI matching quota reached. Upgrade to unlimited AI matching!', {
            action: {
              label: 'Upgrade',
              onClick: () => navigate('/company/subscription')
            }
          });
        } else {
          throw error;
        }
        return;
      }

      if (data.quota_info?.was_free) {
        toast.success(`Found ${data.matches_found} matches! (Free monthly match used)`);
      } else {
        toast.success(`Found ${data.matches_found} matching talents!`);
      }
      
      fetchJobAndMatches();
    } catch (error) {
      console.error('Error finding matches:', error);
      toast.error('Failed to find matches. Please try again.');
    } finally {
      setMatching(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 85) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  const getExperienceFitLabel = (fit: string) => {
    switch (fit) {
      case 'under_qualified': return 'Under-kvalificerad';
      case 'good_fit': return 'Bra match';
      case 'over_qualified': return 'Överkvalificerad';
      default: return fit;
    }
  };

  if (loading) {
    return (
      <CompanyLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <div className="w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/company/jobs')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Button>
            <h1 className="text-3xl font-bold">Talent Matches</h1>
            <p className="text-muted-foreground">
              {job?.title} • {job?.location}
            </p>
          </div>
          <Button
            onClick={handleFindMatches}
            disabled={matching}
          >
            {matching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finding Matches...
              </>
            ) : (
              'Find New Matches'
            )}
          </Button>
        </div>

        {matches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                No matches found yet. Click "Find New Matches" to analyze talents.
              </p>
              <Button onClick={handleFindMatches} disabled={matching}>
                {matching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Find Matches'
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Found {matches.length} matching {matches.length === 1 ? 'talent' : 'talents'}
            </div>
            {matches.map((match) => (
              <Card key={match.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={match.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {match.profiles?.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-xl">{match.profiles?.full_name || 'Unknown'}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {match.profiles?.location || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {match.profiles?.experience_years || 0} years exp.
                          </span>
                          <Badge variant="outline" className="capitalize">
                            <Clock className="h-3 w-3 mr-1" />
                            {match.profiles?.availability_status || 'unknown'}
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={getScoreBadgeVariant(match.match_score)}
                        className="text-lg px-4 py-2"
                      >
                        {match.match_score}% Match
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getExperienceFitLabel(match.experience_fit)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Location Fit</span>
                      <span className="text-sm text-muted-foreground">{match.location_score}%</span>
                    </div>
                    <Progress value={match.location_score} />
                  </div>

                  <Accordion type="single" collapsible>
                    <AccordionItem value="reasoning">
                      <AccordionTrigger>AI Analysis</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {match.match_reasoning}
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="skills">
                      <AccordionTrigger>Skills Match</AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        {match.skills_matched.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              Matched Skills
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {match.skills_matched.map((skill) => (
                                <Badge key={skill} variant="secondary" className="bg-green-100 text-green-800">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {match.skills_missing.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                              <XCircle className="h-4 w-4 text-orange-600" />
                              Missing Skills
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {match.skills_missing.map((skill) => (
                                <Badge key={skill} variant="outline" className="text-orange-600">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    {(match.certifications_matched.length > 0 || match.certifications_missing.length > 0) && (
                      <AccordionItem value="certifications">
                        <AccordionTrigger>Certifications</AccordionTrigger>
                        <AccordionContent className="space-y-3">
                          {match.certifications_matched.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                Has Required
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {match.certifications_matched.map((cert) => (
                                  <Badge key={cert} variant="secondary" className="bg-green-100 text-green-800">
                                    {cert}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {match.certifications_missing.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                <XCircle className="h-4 w-4 text-orange-600" />
                                Missing
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {match.certifications_missing.map((cert) => (
                                  <Badge key={cert} variant="outline" className="text-orange-600">
                                    {cert}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => navigate(`/company/talent/${match.talent_id}`)}
                      variant="default"
                    >
                      View Full Profile
                    </Button>
                    <Button
                      onClick={() => navigate(`/company/messages?userId=${match.talent_id}`)}
                      variant="outline"
                    >
                      Send Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Briefcase, Calendar, Award, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  job_type: string;
  experience_level: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  remote: boolean;
  skills: string[];
  certifications: string[];
  is_active: boolean;
  created_at: string;
  company_id: string;
  project_id: string | null;
  company_profiles: {
    company_name: string;
    logo_url: string | null;
  };
  projects: {
    project_name: string;
  } | null;
}

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const backPath = location.state?.from || "/company/jobs";

  useEffect(() => {
    fetchJobDetail();
  }, [id]);

  const fetchJobDetail = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          company_profiles (company_name, logo_url, user_id),
          projects (project_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setJob(data);
        if (user && data.company_profiles?.user_id === user.id) {
          setIsOwner(true);
        }
      }
    } catch (error: any) {
      toast.error("Failed to load job details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (job: Job) => {
    const currency = job.salary_currency || 'USD';
    if (job.salary_min && job.salary_max) {
      return `${currency} $${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
    } else if (job.salary_min) {
      return `${currency} $${job.salary_min.toLocaleString()}+`;
    }
    return 'Salary not specified';
  };

  if (loading) {
    return (
      <CompanyLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </CompanyLayout>
    );
  }

  if (!job) {
    return (
      <CompanyLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-muted-foreground">Job not found</p>
          <Button onClick={() => navigate(backPath)}>Go Back</Button>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate(backPath)}>
            ← Back
          </Button>
          {isOwner && (
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => navigate(`/company/jobs/edit/${job.id}`)}
            >
              Edit Job
            </Button>
          )}
        </div>

        <Card className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            {job.company_profiles?.logo_url && (
              <img
                src={job.company_profiles.logo_url}
                alt={job.company_profiles.company_name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant={job.is_active ? "default" : "secondary"}>
                  {job.is_active ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline" className="bg-secondary">
                  {job.job_type.replace('_', ' ')}
                </Badge>
                {job.remote && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                    Remote
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-primary mb-2">{job.title}</h1>
              <p className="text-lg text-muted-foreground">{job.company_profiles?.company_name}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-5 w-5" />
              <span>{formatSalary(job)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-5 w-5" />
              <span className="capitalize">{job.experience_level}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-5 w-5" />
              <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {job.projects && (
            <div className="bg-secondary/50 p-4 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-1">Linked Project</p>
              <p className="font-semibold">{job.projects.project_name}</p>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-3">Job Description</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
          </div>

          {job.skills && job.skills.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Required Skills</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {job.certifications && job.certifications.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Required Certifications</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {job.certifications.map((cert, index) => (
                  <Badge key={index} variant="outline" className="bg-primary/10">
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        {!isOwner && (
          <div className="flex gap-4">
            <Button size="lg" className="flex-1">
              Apply Now
            </Button>
            <Button size="lg" variant="outline">
              Save Job
            </Button>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
};

export default JobDetail;

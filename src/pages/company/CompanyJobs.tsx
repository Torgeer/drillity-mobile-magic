import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

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
  is_active: boolean;
  created_at: string;
  company_id: string;
  company_profiles: {
    company_name: string;
    logo_url: string | null;
  };
}

const CompanyJobs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const getCompanyIdAndFetchJobs = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setCompanyId(data.id);
        fetchJobs(data.id);
      }
    };

    getCompanyIdAndFetchJobs();
  }, [user]);

  const fetchJobs = async (compId: string) => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          company_profiles (
            company_name,
            logo_url
          )
        `)
        .eq('company_id', compId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setJobs(data as any);
        fetchApplicationCounts(data.map(j => j.id));
      }
    } catch (error: any) {
      toast.error("Failed to load jobs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationCounts = async (jobIds: string[]) => {
    const counts: Record<string, number> = {};
    
    for (const jobId of jobIds) {
      const { count, error } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', jobId);

      if (!error && count !== null) {
        counts[jobId] = count;
      }
    }

    setApplicationCounts(counts);
  };

  const handleToggleActive = async (jobId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ is_active: !currentStatus })
        .eq('id', jobId);

      if (error) throw error;

      toast.success(`Job ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      if (companyId) fetchJobs(companyId);
    } catch (error: any) {
      toast.error("Failed to update job status");
    }
  };

  const formatSalary = (job: Job) => {
    const currency = job.salary_currency || 'USD';
    if (job.salary_min && job.salary_max) {
      return `${currency} $${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
    } else if (job.salary_min) {
      return `${currency} $${job.salary_min.toLocaleString()}+`;
    }
    return 'Not specified';
  };

  if (loading) {
    return (
      <CompanyLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <div className="space-y-4 sm:space-y-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">My Jobs</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Manage your job postings</p>
          </div>
          <Button onClick={() => navigate('/company/jobs/new')} className="w-full sm:w-auto">
            Post New Job
          </Button>
        </div>

        <div className="flex gap-2 sm:gap-4 border-b border-border pb-2 overflow-x-auto">
          <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 border-primary text-primary whitespace-nowrap">
            All Jobs ({jobs.length})
          </button>
          <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap">
            Active ({jobs.filter(j => j.is_active).length})
          </button>
          <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap">
            Inactive ({jobs.filter(j => !j.is_active).length})
          </button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {jobs.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No jobs posted yet</p>
              <Button onClick={() => navigate('/company/jobs/new')}>
                Post Your First Job
              </Button>
            </Card>
          ) : (
            jobs.map((job) => (
              <Card 
                key={job.id} 
                className="p-4 sm:p-5 lg:p-6 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/company/jobs/${job.id}`, { state: { from: '/company/jobs' } })}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant={job.is_active ? "default" : "secondary"} className="text-xs">
                        {job.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="bg-secondary text-xs">
                        {job.job_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg sm:text-xl font-semibold text-primary mb-1 break-words">{job.title}</h3>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span>{formatSalary(job)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span>{applicationCounts[job.id] || 0} applications</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/company/applications?job=${job.id}`);
                        }} 
                        className="w-full sm:w-auto"
                      >
                        View Applications
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(job.id, job.is_active);
                        }}
                        className="w-full sm:w-auto"
                      >
                        {job.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/company/jobs/edit/${job.id}`);
                    }}
                  >
                    Edit Job
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </CompanyLayout>
  );
};

export default CompanyJobs;

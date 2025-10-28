import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Briefcase } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  job_type: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  is_active: boolean;
  created_at: string;
  company_id: string;
  project_id: string | null;
  company_profiles: {
    company_name: string;
    logo_url: string | null;
  };
  projects?: {
    project_name: string;
  } | null;
}

const BrowseJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        company_profiles (
          company_name,
          logo_url
        ),
        projects (
          project_name
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

      if (error) throw error;

      setJobs(data as any);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company_profiles.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = jobTypeFilter === "all" || job.job_type === jobTypeFilter;
    return matchesSearch && matchesType;
  });

  const formatSalary = (job: Job) => {
    if (!job.salary_min && !job.salary_max) return "Competitive";
    const currency = job.salary_currency || "USD";
    if (job.salary_min && job.salary_max) {
      return `${currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`;
    }
    return `${currency} ${(job.salary_min || job.salary_max)?.toLocaleString()}`;
  };

  if (loading) {
    return (
      <CompanyLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <div className="space-y-4 sm:space-y-6 w-full">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Browse All Jobs</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">See what opportunities are available on the platform</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-lg border border-input bg-secondary px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select 
            value={jobTypeFilter}
            onChange={(e) => setJobTypeFilter(e.target.value)}
            className="flex-1 sm:flex-initial rounded-lg border border-input bg-secondary px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Types</option>
            <option value="full_time">Full-time</option>
            <option value="contract">Contract</option>
            <option value="rotation">Rotation</option>
            <option value="part_time">Part-time</option>
          </select>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {filteredJobs.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No jobs found</p>
            </Card>
          ) : (
            filteredJobs.map((job) => (
              <Card 
                key={job.id} 
                className="p-4 sm:p-5 lg:p-6 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/company/jobs/${job.id}`, { state: { from: '/company/browse-jobs' } })}
              >
                <div className="flex items-start gap-4">
                  {job.company_profiles.logo_url && (
                    <img 
                      src={job.company_profiles.logo_url} 
                      alt={job.company_profiles.company_name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm">
                        {job.job_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-primary mb-1 break-words">{job.title}</h3>
                    <p className="text-muted-foreground mb-3 text-sm sm:text-base">{job.company_profiles.company_name}</p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span>{formatSalary(job)}</span>
                      </div>
                    </div>

                    {job.projects && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium">Project:</span>
                        <span className="text-sm text-muted-foreground">{job.projects.project_name}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-orange-500 text-white hover:bg-orange-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/company/projects?view=${job.project_id}`);
                          }}
                        >
                          View Project
                        </Button>
                      </div>
                    )}

                    <p className="text-xs sm:text-sm mb-3 line-clamp-2">{job.description}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </CompanyLayout>
  );
};

export default BrowseJobs;

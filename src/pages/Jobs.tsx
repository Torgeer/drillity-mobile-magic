import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, DollarSign, Briefcase, Award } from "lucide-react";
import { LocationJobSearch } from "@/components/LocationJobSearch";
import { ApplyDialog } from "@/components/ApplyDialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tables, Enums } from "@/integrations/supabase/types";

type Job = Tables<"jobs"> & {
  company_profiles: Pick<Tables<"company_profiles">, "id" | "company_name" | "logo_url" | "location">;
  projects?: Pick<Tables<"projects">, "id" | "project_name"> | null;
};

const Jobs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("all");
  const [experienceLevelFilter, setExperienceLevelFilter] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          company_profiles!inner (
            id,
            company_name,
            logo_url,
            location
          ),
          projects (
            id,
            project_name
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error loading jobs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationFound = (lat: number, lng: number) => {
    setUserLocation({ lat, lng });
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  const formatJobType = (type: Enums<"job_type">) => {
    const map: Record<Enums<"job_type">, string> = {
      full_time: "Full-time",
      part_time: "Part-time",
      contract: "Contract",
      rotation: "Rotation"
    };
    return map[type];
  };

  const formatExperienceLevel = (level: Enums<"experience_level">) => {
    const map: Record<Enums<"experience_level">, string> = {
      entry: "Entry",
      intermediate: "Intermediate",
      senior: "Senior",
      expert: "Expert"
    };
    return map[level];
  };

  const formatSalary = (min: number | null, max: number | null, currency: string | null) => {
    if (!min && !max) return "Salary not specified";
    const curr = currency || "USD";
    if (min && max) return `${curr} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `From ${curr} ${min.toLocaleString()}`;
    if (max) return `Up to ${curr} ${max.toLocaleString()}`;
    return "Salary not specified";
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchTerm === "" || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company_profiles.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesJobType = jobTypeFilter === "all" || job.job_type === jobTypeFilter;
    const matchesExperience = experienceLevelFilter === "all" || job.experience_level === experienceLevelFilter;
    
    return matchesSearch && matchesJobType && matchesExperience;
  });

  const sortedJobs = userLocation
    ? [...filteredJobs].sort((a, b) => {
        if (!a.latitude || !a.longitude) return 1;
        if (!b.latitude || !b.longitude) return -1;
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
        return distA - distB;
      })
    : filteredJobs;

  const handleApplyClick = (job: Job) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to apply for jobs",
        variant: "destructive",
      });
      return;
    }
    setSelectedJob(job);
    setApplyDialogOpen(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 w-full">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Browse Jobs</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {sortedJobs.length} opportunities available
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-lg border border-input bg-secondary px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-2 sm:gap-4">
            <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
              <SelectTrigger className="flex-1 sm:w-[150px]">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full_time">Full-time</SelectItem>
                <SelectItem value="part_time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="rotation">Rotation</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={experienceLevelFilter} onValueChange={setExperienceLevelFilter}>
              <SelectTrigger className="flex-1 sm:w-[150px]">
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="entry">Entry</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
            
            <LocationJobSearch onLocationFound={handleLocationFound} />
          </div>
        </div>

        {sortedJobs.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No jobs found matching your criteria</p>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {sortedJobs.map((job) => {
              const distance = userLocation && job.latitude && job.longitude
                ? calculateDistance(userLocation.lat, userLocation.lng, job.latitude, job.longitude)
                : null;

              return (
                <Card key={job.id} className="p-4 sm:p-5 lg:p-6 hover:border-primary/50 transition-colors">
                  <div className="flex items-start gap-4">
                    {job.company_profiles.logo_url && (
                      <img 
                        src={job.company_profiles.logo_url} 
                        alt={job.company_profiles.company_name}
                        className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm">
                          {formatJobType(job.job_type)}
                        </Badge>
                        <Badge variant="outline" className="bg-secondary text-xs sm:text-sm">
                          {formatExperienceLevel(job.experience_level)}
                        </Badge>
                        {job.remote && (
                          <Badge variant="outline" className="bg-success/10 text-success text-xs">
                            Remote
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-lg sm:text-xl font-semibold text-primary mb-1 break-words">
                        {job.title}
                      </h3>
                      <p className="text-muted-foreground mb-3 text-sm sm:text-base">
                        {job.company_profiles.company_name}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{job.location}</span>
                          {distance && <span className="text-primary ml-1 flex-shrink-0">({distance} km)</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>{formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</span>
                        </div>
                      </div>

                      {job.projects && (
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-3">
                          <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>Project: {job.projects.project_name}</span>
                        </div>
                      )}

                      <p className="text-xs sm:text-sm mb-3 line-clamp-2">{job.description}</p>

                      {job.skills && job.skills.length > 0 && (
                        <div className="flex gap-2 mb-3 flex-wrap">
                          {job.skills.slice(0, 5).map((skill, index) => (
                            <Badge key={index} variant="outline" className="bg-secondary text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {job.skills.length > 5 && (
                            <Badge variant="outline" className="bg-secondary text-xs">
                              +{job.skills.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {job.certifications && job.certifications.length > 0 && (
                        <div className="flex items-center gap-2 mb-4 flex-wrap text-xs">
                          <Award className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Required:</span>
                          {job.certifications.slice(0, 3).map((cert, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <Button 
                        className="w-full sm:w-auto" 
                        size="sm"
                        onClick={() => handleApplyClick(job)}
                      >
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {selectedJob && user && (
        <ApplyDialog
          open={applyDialogOpen}
          onOpenChange={setApplyDialogOpen}
          job={selectedJob}
          userId={user.id}
          onSuccess={fetchJobs}
        />
      )}
    </Layout>
  );
};

export default Jobs;

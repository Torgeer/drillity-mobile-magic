import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign } from "lucide-react";
import { LocationJobSearch } from "@/components/LocationJobSearch";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Jobs = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

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
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      toast.error("Failed to load jobs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId: string, companyId: string) => {
    if (!user) {
      toast.error("Please login to apply");
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase
        .from('applications')
        .insert([{
          job_id: jobId,
          talent_id: user.id,
          company_id: companyId,
          status: 'pending'
        }]);

      if (error) {
        if (error.code === '23505') {
          toast.error("You've already applied to this job");
        } else {
          throw error;
        }
      } else {
        toast.success("Application submitted successfully!");
      }
    } catch (error: any) {
      toast.error("Failed to submit application");
      console.error(error);
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

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchQuery || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation = !locationFilter || job.location.includes(locationFilter);
    const matchesType = !typeFilter || job.job_type === typeFilter;
    
    return matchesSearch && matchesLocation && matchesType;
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Browse Jobs</h1>
          <p className="text-muted-foreground">Find opportunities</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded-lg border border-input bg-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="text"
            placeholder="Location filter..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="rounded-lg border border-input bg-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-input bg-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Types</option>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
          </select>
          <LocationJobSearch onLocationFound={handleLocationFound} />
        </div>

        <div className="space-y-4">
          {sortedJobs.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No jobs found. Try adjusting your filters.</p>
            </Card>
          ) : (
            sortedJobs.map((job) => {
              const distance = userLocation && job.latitude && job.longitude
                ? calculateDistance(userLocation.lat, userLocation.lng, job.latitude, job.longitude)
                : null;

              const salaryDisplay = job.salary_min && job.salary_max
                ? `${job.salary_currency || '$'}${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                : 'Competitive';

              return (
                <Card key={job.id} className="p-6 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between flex-col sm:flex-row gap-4">
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {job.job_type?.replace('_', ' ')}
                        </Badge>
                        {job.remote && (
                          <Badge variant="outline" className="bg-secondary">
                            Remote
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-primary mb-1">{job.title}</h3>
                      <p className="text-muted-foreground mb-3">{job.company_profiles?.company_name || 'Company'}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                          {distance && <span className="text-primary ml-1">({distance} km away)</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {salaryDisplay}
                        </div>
                      </div>

                      <p className="text-sm mb-3 line-clamp-2">{job.description}</p>

                      {job.skills && job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.skills.slice(0, 5).map((skill: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="bg-secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <Button onClick={() => handleApply(job.id, job.company_id)}>Apply Now</Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Jobs;

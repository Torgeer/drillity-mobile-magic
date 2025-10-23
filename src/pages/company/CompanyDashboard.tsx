import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, MessageSquare, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { user, userType, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
  });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [topJobs, setTopJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (userType === 'talent') {
        navigate("/dashboard");
      } else {
        fetchDashboardData();
      }
    }
  }, [user, userType, authLoading, navigate]);

  const fetchDashboardData = async () => {
    try {
      // Get company profile
      const { data: companyProfile } = await supabase
        .from("company_profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!companyProfile) {
        toast.error("Company profile not found");
        return;
      }

      // Get active jobs count
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id, title")
        .eq("company_id", companyProfile.id)
        .eq("is_active", true);

      if (jobsError) throw jobsError;

      // Get applications
      const { data: applications, error: appsError } = await supabase
        .from("applications")
        .select(`
          *,
          jobs (
            title
          ),
          profiles (
            full_name,
            email
          )
        `)
        .eq("company_id", companyProfile.id)
        .order("applied_at", { ascending: false });

      if (appsError) throw appsError;

      // Calculate stats
      setStats({
        activeJobs: jobs?.length || 0,
        totalApplications: applications?.length || 0,
        pendingApplications: applications?.filter(app => app.status === 'pending').length || 0,
      });

      // Set recent applications (last 3)
      setRecentApplications(applications?.slice(0, 3) || []);

      // Calculate top performing jobs
      const jobApplicationCounts = jobs?.map(job => ({
        ...job,
        applicationCount: applications?.filter(app => app.job_id === job.id).length || 0
      })).sort((a, b) => b.applicationCount - a.applicationCount).slice(0, 3) || [];

      setTopJobs(jobApplicationCounts);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <CompanyLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </CompanyLayout>
    );
  }

  const dashboardStats = [
    { name: "Active Jobs", value: stats.activeJobs.toString(), icon: Briefcase, change: "" },
    { name: "Total Applications", value: stats.totalApplications.toString(), icon: FileText, change: `${stats.pendingApplications} pending` },
    { name: "Messages", value: "0", icon: MessageSquare, change: "Coming soon" },
    { name: "Profile Views", value: "-", icon: TrendingUp, change: "Coming soon" },
  ];

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Company Dashboard</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Manage your recruitment process</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/company/jobs/import')} className="flex-1 sm:flex-initial">
              Import Jobs
            </Button>
            <Button onClick={() => navigate('/company/jobs/new')} className="flex-1 sm:flex-initial">
              Post Job
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat) => (
            <Card key={stat.name} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.name}</p>
                  <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Applications</h2>
            {recentApplications.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No applications yet</p>
            ) : (
              <div className="space-y-4">
                {recentApplications.map((app) => (
                  <div key={app.id} className="flex items-start gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {app.profiles?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{app.profiles?.full_name || app.profiles?.email || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground truncate">Applied for: {app.jobs?.title || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(app.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate('/company/applications')}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Top Performing Jobs</h2>
            {topJobs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No jobs posted yet</p>
            ) : (
              <div className="space-y-4">
                {topJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{job.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.applicationCount} application{job.applicationCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => navigate('/company/jobs')}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </CompanyLayout>
  );
};

export default CompanyDashboard;

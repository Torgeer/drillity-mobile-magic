import { CompanyLayout } from "@/components/CompanyLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, MessageSquare, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
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

      // Get applications - simplified without joins to avoid recursion
      const { data: applications, error: appsError } = await supabase
        .from("applications")
        .select("*")
        .eq("company_id", companyProfile.id)
        .order("applied_at", { ascending: false });

      if (appsError) {
        console.error("Error fetching applications:", appsError);
        // Don't throw, just use empty array
      }

      // Calculate stats
      setStats({
        activeJobs: jobs?.length || 0,
        totalApplications: applications?.length || 0,
        pendingApplications: applications?.filter(app => app.status === 'pending').length || 0,
      });

      // Set recent applications (last 3) - simplified
      setRecentApplications(applications?.slice(0, 3) || []);

      // Calculate top performing jobs - fetch job titles separately if needed
      const jobApplicationCounts = jobs?.map(job => ({
        id: job.id,
        title: job.title,
        applicationCount: applications?.filter(app => app.job_id === job.id).length || 0
      })).sort((a, b) => b.applicationCount - a.applicationCount).slice(0, 3) || [];

      setTopJobs(jobApplicationCounts);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      // Don't show error toast, just fail silently with empty data
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
    { 
      name: "Active Jobs", 
      value: stats.activeJobs.toString(), 
      icon: Briefcase, 
      description: "Jobs currently open",
      trend: null
    },
    { 
      name: "Total Applications", 
      value: stats.totalApplications.toString(), 
      icon: FileText, 
      description: `${stats.pendingApplications} pending review`,
      trend: null
    },
    { 
      name: "New Candidates", 
      value: stats.pendingApplications.toString(), 
      icon: MessageSquare, 
      description: "Awaiting your review",
      trend: null
    },
    { 
      name: "Growth Rate", 
      value: "12.5%", 
      icon: TrendingUp, 
      description: "vs last month",
      trend: { value: "+2.5%", positive: true }
    },
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
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  {stat.trend && (
                    <span className={`flex items-center ${stat.trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend.positive ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {stat.trend.value}
                    </span>
                  )}
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Latest candidate submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentApplications.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No applications yet</p>
              ) : (
                <div className="space-y-4">
                  {recentApplications.map((app) => (
                    <div key={app.id} className="flex items-center gap-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        A
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium leading-none">Application received</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Jobs</CardTitle>
              <CardDescription>Your most popular job listings</CardDescription>
            </CardHeader>
            <CardContent>
              {topJobs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No jobs posted yet</p>
              ) : (
                <div className="space-y-4">
                  {topJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium leading-none truncate">{job.title}</p>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </CompanyLayout>
  );
};

export default CompanyDashboard;

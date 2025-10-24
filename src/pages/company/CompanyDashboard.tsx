import { CompanyLayout } from "@/components/CompanyLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Plus } from "lucide-react";
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
      const { data: companyProfile } = await supabase
        .from("company_profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!companyProfile) {
        toast.error("Company profile not found");
        return;
      }

      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id, title")
        .eq("company_id", companyProfile.id)
        .eq("is_active", true);

      if (jobsError) throw jobsError;

      const { data: applications, error: appsError } = await supabase
        .from("applications")
        .select("*")
        .eq("company_id", companyProfile.id)
        .order("applied_at", { ascending: false });

      if (appsError) {
        console.error("Error fetching applications:", appsError);
      }

      setStats({
        activeJobs: jobs?.length || 0,
        totalApplications: applications?.length || 0,
        pendingApplications: applications?.filter(app => app.status === 'pending').length || 0,
      });

      setRecentApplications(applications?.slice(0, 5) || []);

      const jobApplicationCounts = jobs?.map(job => ({
        id: job.id,
        title: job.title,
        applicationCount: applications?.filter(app => app.job_id === job.id).length || 0
      })).sort((a, b) => b.applicationCount - a.applicationCount).slice(0, 3) || [];

      setTopJobs(jobApplicationCounts);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
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
      description: "Open positions",
      trend: { value: "+2.5%", positive: true }
    },
    { 
      name: "Total Applications", 
      value: stats.totalApplications.toString(), 
      icon: FileText, 
      description: "All submissions",
      trend: { value: "+12.5%", positive: true }
    },
    { 
      name: "Pending Review", 
      value: stats.pendingApplications.toString(), 
      icon: Users, 
      description: "Awaiting action",
      trend: null
    },
    { 
      name: "Growth Rate", 
      value: "4.5%", 
      icon: TrendingUp, 
      description: "This month",
      trend: { value: "+4.5%", positive: true }
    },
  ];

  return (
    <CompanyLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your recruitment pipeline</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate('/company/jobs/import')} className="gap-2">
              <Plus className="h-4 w-4" />
              Import Jobs
            </Button>
            <Button onClick={() => navigate('/company/jobs/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              Post Job
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat) => (
            <Card key={stat.name} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  {stat.trend && (
                    <span className={`flex items-center font-medium ${stat.trend.positive ? 'text-success' : 'text-destructive'}`}>
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

        {/* Content Grid */}
        <div className="grid gap-4 lg:grid-cols-7">
          {/* Recent Applications */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Latest candidate submissions to review</CardDescription>
            </CardHeader>
            <CardContent>
              {recentApplications.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No applications yet</p>
                  <Button variant="link" onClick={() => navigate('/company/jobs/new')} className="mt-2">
                    Post your first job
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentApplications.map((app) => (
                    <div key={app.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        {app.id.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium leading-none">New Application</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(app.applied_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
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

          {/* Top Performing Jobs */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Top Jobs</CardTitle>
              <CardDescription>Most applications received</CardDescription>
            </CardHeader>
            <CardContent>
              {topJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No jobs posted yet</p>
                  <Button variant="link" onClick={() => navigate('/company/jobs/new')} className="mt-2">
                    Post a job
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {topJobs.map((job, index) => (
                    <div key={job.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{job.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {job.applicationCount} application{job.applicationCount !== 1 ? 's' : ''}
                          </p>
                        </div>
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

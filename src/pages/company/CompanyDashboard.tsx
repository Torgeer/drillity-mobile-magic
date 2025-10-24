import { CompanyLayout } from "@/components/CompanyLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { user, userType, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
  });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [topJobs, setTopJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fake data for demonstration
  const fakeApplications = [
    { id: '1', name: 'John Smith', position: 'Senior Developer', applied_at: new Date('2024-01-15'), status: 'pending' },
    { id: '2', name: 'Sarah Johnson', position: 'UI/UX Designer', applied_at: new Date('2024-01-14'), status: 'pending' },
    { id: '3', name: 'Mike Chen', position: 'Product Manager', applied_at: new Date('2024-01-13'), status: 'reviewed' },
    { id: '4', name: 'Emily Davis', position: 'Data Analyst', applied_at: new Date('2024-01-12'), status: 'pending' },
    { id: '5', name: 'Robert Wilson', position: 'DevOps Engineer', applied_at: new Date('2024-01-11'), status: 'pending' },
    { id: '6', name: 'Lisa Anderson', position: 'Frontend Developer', applied_at: new Date('2024-01-10'), status: 'reviewed' },
    { id: '7', name: 'David Martinez', position: 'Backend Developer', applied_at: new Date('2024-01-09'), status: 'pending' },
    { id: '8', name: 'Jennifer Taylor', position: 'QA Engineer', applied_at: new Date('2024-01-08'), status: 'pending' },
  ];

  const fakeTopJobs = [
    { id: '1', title: 'Senior Full Stack Developer', applicationCount: 45 },
    { id: '2', title: 'Product Designer', applicationCount: 32 },
    { id: '3', title: 'DevOps Engineer', applicationCount: 28 },
    { id: '4', title: 'Marketing Manager', applicationCount: 21 },
    { id: '5', title: 'Data Scientist', applicationCount: 18 },
  ];

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

      // Use real data if available, otherwise use fake data
      setRecentApplications(applications?.length ? applications.slice(0, 5) : fakeApplications);

      const jobApplicationCounts = jobs?.map(job => ({
        id: job.id,
        title: job.title,
        applicationCount: applications?.filter(app => app.job_id === job.id).length || 0
      })).sort((a, b) => b.applicationCount - a.applicationCount).slice(0, 3) || [];

      setTopJobs(jobApplicationCounts.length ? jobApplicationCounts : fakeTopJobs);
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

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat) => (
            <Card key={stat.name} className={cn("border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30", theme === "light" ? "bg-white/80 backdrop-blur-sm" : "bg-card/50 backdrop-blur-sm")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground font-heading">
                  {stat.name}
                </CardTitle>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-3xl font-bold font-heading tracking-tight">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                  {stat.trend && (
                    <span className={`flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded ${stat.trend.positive ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'}`}>
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
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Recent Applications */}
          <Card className={cn("lg:col-span-4 border border-border/50 shadow-sm", theme === "light" ? "bg-white/80 backdrop-blur-sm" : "bg-card/50 backdrop-blur-sm")}>
            <CardHeader className="space-y-2 pb-4">
              <CardTitle className="text-xl font-heading">Recent Applications</CardTitle>
              <CardDescription className="text-sm">Latest candidate submissions to review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                <div className="space-y-2">
                  {fakeApplications.map((app) => (
                    <div key={app.id} className={cn("flex items-center gap-4 p-4 rounded-xl transition-all duration-300 group border", theme === "light" ? "hover:bg-slate-50 hover:border-primary/30 border-slate-200/50" : "hover:bg-zinc-900/50 hover:border-primary/30 border-border/30")}>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all">
                        <span>{app.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <p className="text-sm font-semibold leading-none group-hover:text-primary transition-colors font-heading">{app.name}</p>
                        <p className="text-xs text-muted-foreground font-medium">{app.position}</p>
                        <p className="text-xs text-muted-foreground">
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
                        className="opacity-0 group-hover:opacity-100 transition-opacity font-medium"
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Jobs */}
          <Card className={cn("lg:col-span-3 border border-border/50 shadow-sm", theme === "light" ? "bg-white/80 backdrop-blur-sm" : "bg-card/50 backdrop-blur-sm")}>
            <CardHeader className="space-y-2 pb-4">
              <CardTitle className="text-xl font-heading">Top Jobs</CardTitle>
              <CardDescription className="text-sm">Most applications received</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                <div className="space-y-2">
                  {fakeTopJobs.map((job, index) => (
                    <div key={job.id} className={cn("flex items-center justify-between p-4 rounded-xl transition-all duration-300 group border", theme === "light" ? "hover:bg-slate-50 hover:border-primary/30 border-slate-200/50" : "hover:bg-zinc-900/50 hover:border-primary/30 border-border/30")}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all">
                          <span>{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors font-heading">{job.title}</p>
                          <p className="text-xs text-muted-foreground font-medium">
                            {job.applicationCount} application{job.applicationCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => navigate('/company/jobs')}
                        className="opacity-0 group-hover:opacity-100 transition-opacity font-medium"
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CompanyLayout>
  );
};

export default CompanyDashboard;

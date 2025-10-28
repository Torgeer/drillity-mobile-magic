import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIUsageMetrics } from "@/components/AIUsageMetrics";
import { Briefcase, FileText, MessageSquare, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const stats = [
  { name: "Active Jobs", value: "8", icon: Briefcase, change: "+2 this week" },
  { name: "Applications", value: "45", icon: FileText, change: "+12 this week" },
  { name: "Messages", value: "15", icon: MessageSquare, change: "5 unread" },
  { name: "Profile Views", value: "342", icon: TrendingUp, change: "+28 this month" },
];

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { user, userType, loading } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (userType === 'talent') {
        // Talent users should use talent dashboard
        navigate("/dashboard");
      } else {
        fetchCompanyId();
      }
    }
  }, [user, userType, loading, navigate]);

  const fetchCompanyId = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setCompanyId(data.id);
    }
  };

  if (loading) {
    return (
      <CompanyLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <div className="space-y-4 sm:space-y-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Company Dashboard</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Manage your recruitment process</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => navigate('/company/jobs/import')} className="w-full sm:w-auto">
              Import Jobs
            </Button>
            <Button onClick={() => navigate('/company/jobs/new')} className="w-full sm:w-auto">
              Post Job
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name} className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.name}</p>
                  <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
                </div>
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0 ml-2">
                  <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {companyId && <AIUsageMetrics companyId={companyId} />}

        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <Card className="p-4 sm:p-5 lg:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Recent Applications</h2>
            <div className="space-y-3 sm:space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 sm:gap-4 border-b border-border pb-3 sm:pb-4 last:border-0 last:pb-0">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                    JD
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base">John Driller</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Applied for: Senior Drilling Engineer</p>
                    <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                  </div>
                  <Button size="sm" variant="outline" className="flex-shrink-0">View</Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 sm:p-5 lg:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Top Performing Jobs</h2>
            <div className="space-y-3 sm:space-y-4">
              {[
                { title: "Senior Drilling Engineer", applications: 18 },
                { title: "Rig Safety Supervisor", applications: 12 },
                { title: "Directional Driller", applications: 15 }
              ].map((job, i) => (
                <div key={i} className="flex items-center justify-between gap-3 border-b border-border pb-3 sm:pb-4 last:border-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{job.title}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{job.applications} applications</p>
                  </div>
                  <Button size="sm" variant="ghost" className="flex-shrink-0">View</Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </CompanyLayout>
  );
};

export default CompanyDashboard;

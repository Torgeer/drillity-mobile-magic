import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, MessageSquare, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const stats = [
  { name: "Active Jobs", value: "8", icon: Briefcase, change: "+2 this week" },
  { name: "Applications", value: "45", icon: FileText, change: "+12 this week" },
  { name: "Messages", value: "15", icon: MessageSquare, change: "5 unread" },
  { name: "Profile Views", value: "342", icon: TrendingUp, change: "+28 this month" },
];

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { user, userType, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (userType === 'talent') {
        // Talent users should use talent dashboard
        navigate("/dashboard");
      }
    }
  }, [user, userType, loading, navigate]);

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Company Dashboard</h1>
            <p className="text-muted-foreground">Manage your recruitment process</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/company/jobs/import')}>
              Import Jobs
            </Button>
            <Button onClick={() => navigate('/company/jobs/new')}>
              Post Job
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
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
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    JD
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">John Driller</p>
                    <p className="text-sm text-muted-foreground">Applied for: Senior Drilling Engineer</p>
                    <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                  </div>
                  <Button size="sm" variant="outline">View</Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Top Performing Jobs</h2>
            <div className="space-y-4">
              {[
                { title: "Senior Drilling Engineer", applications: 18 },
                { title: "Rig Safety Supervisor", applications: 12 },
                { title: "Directional Driller", applications: 15 }
              ].map((job, i) => (
                <div key={i} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{job.title}</p>
                    <p className="text-sm text-muted-foreground">{job.applications} applications</p>
                  </div>
                  <Button size="sm" variant="ghost">View</Button>
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

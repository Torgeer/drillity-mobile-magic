import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Briefcase, FileText, MessageSquare, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const stats = [
  { name: "Active Applications", value: "5", icon: FileText, change: "+2 this week" },
  { name: "Jobs Viewed", value: "24", icon: Briefcase, change: "+12 this week" },
  { name: "Messages", value: "8", icon: MessageSquare, change: "3 unread" },
  { name: "Profile Views", value: "142", icon: TrendingUp, change: "+18 this month" },
];

const Dashboard = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  
  // Initialize push notifications
  usePushNotifications(user?.id);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (userType === 'company') {
        // Company users should use company dashboard
        navigate("/company/dashboard");
      }
    }
  }, [user, userType, loading, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Talent Dashboard</h1>
          <p className="text-muted-foreground">Din jobbsökningsöversikt</p>
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

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
              <div className="flex h-2 w-2 mt-2 rounded-full bg-primary" />
              <div className="flex-1">
                <p className="font-medium">Application submitted</p>
                <p className="text-sm text-muted-foreground">Senior Drilling Engineer at PetroWorks</p>
                <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
              <div className="flex h-2 w-2 mt-2 rounded-full bg-muted" />
              <div className="flex-1">
                <p className="font-medium">New message received</p>
                <p className="text-sm text-muted-foreground">DrillSafe: Safety training scheduled</p>
                <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
              <div className="flex h-2 w-2 mt-2 rounded-full bg-muted" />
              <div className="flex-1">
                <p className="font-medium">Profile viewed</p>
                <p className="text-sm text-muted-foreground">GeoPath viewed your profile</p>
                <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;

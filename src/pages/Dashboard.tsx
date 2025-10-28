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
      <div className="space-y-4 sm:space-y-6 w-full">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Talent Dashboard</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Your job search overview</p>
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

        <Card className="p-4 sm:p-5 lg:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Recent Activity</h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start gap-3 sm:gap-4 border-b border-border pb-3 sm:pb-4 last:border-0 last:pb-0">
              <div className="flex h-2 w-2 mt-2 rounded-full bg-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">Application submitted</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Senior Drilling Engineer at PetroWorks</p>
                <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 sm:gap-4 border-b border-border pb-3 sm:pb-4 last:border-0 last:pb-0">
              <div className="flex h-2 w-2 mt-2 rounded-full bg-muted flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">New message received</p>
                <p className="text-xs sm:text-sm text-muted-foreground">DrillSafe: Safety training scheduled</p>
                <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 sm:gap-4 border-b border-border pb-3 sm:pb-4 last:border-0 last:pb-0">
              <div className="flex h-2 w-2 mt-2 rounded-full bg-muted flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">Profile viewed</p>
                <p className="text-xs sm:text-sm text-muted-foreground">GeoPath viewed your profile</p>
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

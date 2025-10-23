import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Briefcase, FileText, MessageSquare, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";


const Dashboard = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalJobs: 0,
    myApplications: 0,
    unreadMessages: 0,
    profileViews: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [visitors, setVisitors] = useState<{ id: string; name: string; viewed_at: string }[]>([]);
  
  // Initialize push notifications
  usePushNotifications(user?.id);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (userType === 'company') {
        // Company users should use company dashboard
        navigate("/company/dashboard");
      } else {
        fetchStats();
      }
    }
  }, [user, userType, loading, navigate]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Count total active jobs
      const { count: totalJobsCount } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Count user's applications
      const { count: applicationsCount } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("talent_id", user.id);

      // Count unread messages
      const { count: unreadCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false);

      // Count profile views
      const { count: profileViewsCount } = await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("talent_id", user.id);

      setStats({
        totalJobs: totalJobsCount || 0,
        myApplications: applicationsCount || 0,
        unreadMessages: unreadCount || 0,
        profileViews: profileViewsCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

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
          <h1 className="text-2xl sm:text-3xl font-bold">Talent Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Your job search overview</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="ad-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
                <p className="mt-2 text-3xl font-bold">{statsLoading ? "-" : stats.totalJobs}</p>
                <p className="mt-1 text-xs text-muted-foreground">Available positions</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="ad-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Applications</p>
                <p className="mt-2 text-3xl font-bold">{statsLoading ? "-" : stats.myApplications}</p>
                <p className="mt-1 text-xs text-muted-foreground">Jobs applied to</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="ad-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Messages</p>
                <p className="mt-2 text-3xl font-bold">{statsLoading ? "-" : stats.unreadMessages}</p>
                <p className="mt-1 text-xs text-muted-foreground">Unread messages</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="ad-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Profile Views</p>
                <p className="mt-2 text-3xl font-bold">{statsLoading ? "-" : stats.profileViews}</p>
                <p className="mt-1 text-xs text-muted-foreground">Company visits</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>
        </div>

        <Card className="ad-card">
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

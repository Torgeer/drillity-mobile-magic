import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, MessageSquare, TrendingUp, Sparkles, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UsageProgressBar } from "@/components/UsageProgressBar";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { toast } from "sonner";

const stats = [
  { name: "Active Applications", value: "5", icon: FileText, change: "+2 this week" },
  { name: "Jobs Viewed", value: "24", icon: Briefcase, change: "+12 this week" },
  { name: "Messages", value: "8", icon: MessageSquare, change: "3 unread" },
  { name: "Profile Views", value: "142", icon: TrendingUp, change: "+18 this month" },
];

const Dashboard = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  
  usePushNotifications(user?.id);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (userType === 'company') {
        navigate("/company/dashboard");
      }
    }
  }, [user, userType, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSubscription();
      fetchRecommendations();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('talent-check-subscription');
      if (error) throw error;
      setSubscription(data);
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-job-recommendations');
      if (error) throw error;
      setRecommendations(data?.recommendations || []);
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to load job recommendations');
    } finally {
      setLoadingRecommendations(false);
    }
  };

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

        {subscription && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <UsageProgressBar
              title="Applications This Month"
              used={subscription.applications_used || 0}
              limit={subscription.application_limit || 0}
              icon={<FileText className="h-5 w-5 text-primary" />}
            />
            <UsageProgressBar
              title="Skills Added"
              used={subscription.skills_used || 0}
              limit={subscription.skill_limit || 0}
              icon={<Briefcase className="h-5 w-5 text-primary" />}
            />
            <UsageProgressBar
              title="Certifications"
              used={subscription.certifications_used || 0}
              limit={subscription.certification_limit || 0}
              icon={<TrendingUp className="h-5 w-5 text-primary" />}
            />
          </div>
        )}

        {subscription?.plan_details?.ai_job_matching ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">AI Job Recommendations</h2>
            </div>
            
            {loadingRecommendations ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Loading recommendations...</p>
              </Card>
            ) : recommendations.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {recommendations.map((rec: any) => (
                  <Card key={rec.job_id} className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{rec.job?.title}</h3>
                        <p className="text-sm text-muted-foreground">{rec.job?.company_name}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{rec.match_score}%</div>
                        <p className="text-xs text-muted-foreground">Match</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{rec.job?.location}</p>
                    <p className="text-sm mb-4">{rec.reason}</p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/jobs')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Job
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No job recommendations available yet. Complete your profile to get personalized matches!</p>
                <Button className="mt-4" onClick={() => navigate('/profile')}>
                  Complete Profile
                </Button>
              </Card>
            )}
          </div>
        ) : (
          <UpgradePrompt
            feature="AI Job Recommendations"
            requiredPlan="PREMIUM"
            description="Get personalized job recommendations powered by AI based on your skills and preferences"
          />
        )}

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

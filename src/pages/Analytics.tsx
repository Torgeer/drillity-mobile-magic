import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Eye, FileText, Briefcase, Building2, TrendingUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnalyticsData {
  date: string;
  profile_views: number;
  application_views: number;
  job_matches_received: number;
  companies_interested: number;
}

export default function Analytics() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSubscription();
      fetchAnalytics();
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

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profile_analytics')
        .select('*')
        .eq('talent_id', user.id)
        .order('date', { ascending: true })
        .limit(30);

      if (error) throw error;
      setAnalyticsData(data || []);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoadingData(false);
    }
  };

  const calculateTotal = (field: keyof AnalyticsData) => {
    return analyticsData.reduce((sum, item) => sum + (item[field] as number), 0);
  };

  const hasAccess = subscription?.plan_details?.analytics_dashboard;

  if (loading || loadingData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!hasAccess) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Track your job search performance</p>
          </div>

          <Card className="p-12 text-center">
            <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Premium Feature</h2>
            <p className="text-muted-foreground mb-6">
              Upgrade to PRO or PREMIUM to access detailed analytics about your job search performance
            </p>
            <Button onClick={() => navigate('/subscription')}>
              View Plans
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  const stats = [
    { 
      name: "Profile Views", 
      value: calculateTotal('profile_views'), 
      icon: Eye, 
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    { 
      name: "Application Views", 
      value: calculateTotal('application_views'), 
      icon: FileText, 
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    { 
      name: "Job Matches", 
      value: calculateTotal('job_matches_received'), 
      icon: Briefcase, 
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    { 
      name: "Companies Interested", 
      value: calculateTotal('companies_interested'), 
      icon: Building2, 
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your job search performance over the last 30 days</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.name} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.name}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Profile Views Trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Line 
                type="monotone" 
                dataKey="profile_views" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Profile Views"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Activity Overview</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Bar dataKey="application_views" fill="hsl(var(--success))" name="Application Views" />
              <Bar dataKey="job_matches_received" fill="hsl(var(--primary))" name="Job Matches" />
              <Bar dataKey="companies_interested" fill="hsl(var(--warning))" name="Companies Interested" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </Layout>
  );
}

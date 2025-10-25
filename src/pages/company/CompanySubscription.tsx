import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Crown, Zap } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  job_limit: number;
  price_eur: number;
}

interface CompanySubscription {
  id: string;
  plan_id: string;
  jobs_used: number;
  is_active: boolean;
  subscription_plans: SubscriptionPlan;
}

const CompanySubscription = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CompanySubscription | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) navigate("/auth");
      else if (userType === 'talent') navigate("/profile");
      else loadData();
    }
  }, [user, userType, loading, navigate]);

  const loadData = async () => {
    try {
      // Get company profile
      const { data: companyData, error: companyError } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (companyError) throw companyError;
      setCompanyId(companyData.id);

      // Get all plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('job_limit', { ascending: true });

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // Get current subscription
      const { data: subData } = await supabase
        .from('company_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('company_id', companyData.id)
        .eq('is_active', true)
        .single();

      setCurrentSubscription(subData);
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!companyId) return;

    try {
      // Deactivate current subscription
      if (currentSubscription) {
        await supabase
          .from('company_subscriptions')
          .update({ is_active: false })
          .eq('id', currentSubscription.id);
      }

      // Create new subscription
      const { error } = await supabase
        .from('company_subscriptions')
        .insert({
          company_id: companyId,
          plan_id: planId,
          jobs_used: 0,
          is_active: true
        });

      if (error) throw error;

      toast.success("Subscription plan updated successfully!");
      loadData();
    } catch (error: any) {
      toast.error("Failed to update subscription");
      console.error(error);
    }
  };

  if (loading || loadingData) {
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
        <div>
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground">Choose the plan that fits your hiring needs</p>
        </div>

        {currentSubscription && (
          <Card className="p-6 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">Current Plan: {currentSubscription.subscription_plans.name}</h3>
                </div>
                <p className="text-muted-foreground">
                  {currentSubscription.jobs_used} of {currentSubscription.subscription_plans.job_limit} job postings used
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">€{currentSubscription.subscription_plans.price_eur}</p>
                <p className="text-sm text-muted-foreground">per month</p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.plan_id === plan.id;
            const isPopular = plan.job_limit === 20 || plan.job_limit === 30;

            return (
              <Card key={plan.id} className={`p-6 relative ${isPopular ? 'border-primary shadow-lg' : ''}`}>
                {isPopular && (
                  <Badge className="absolute top-4 right-4 bg-primary">
                    <Zap className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                )}
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <p className="text-muted-foreground">{plan.job_limit} job postings</p>
                  </div>

                  <div>
                    <p className="text-4xl font-bold">€{plan.price_eur}</p>
                    <p className="text-sm text-muted-foreground">per month</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      €{(plan.price_eur / plan.job_limit).toFixed(2)} per job
                    </p>
                  </div>

                  <div className="space-y-2 pt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{plan.job_limit} active job postings</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Unlimited applications</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Candidate management</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Team collaboration</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    variant={isCurrentPlan ? "outline" : "default"}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? "Current Plan" : "Select Plan"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="p-6 text-center bg-muted/50">
          <h3 className="text-xl font-semibold mb-2">Need more than 100 job postings?</h3>
          <p className="text-muted-foreground mb-4">Contact us for a custom enterprise plan</p>
          <Button variant="outline">Contact Sales</Button>
        </Card>
      </div>
    </CompanyLayout>
  );
};

export default CompanySubscription;

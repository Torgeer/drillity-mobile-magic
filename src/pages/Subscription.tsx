import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Shield, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  price_eur: number;
  application_limit: number;
  skill_limit: number | null;
  certification_limit: number | null;
  cv_upload_limit: number;
  profile_views_enabled: boolean;
  profile_views_limit: number | null;
  featured_profile: boolean;
  verified_badge: boolean;
  profile_highlight_per_month: number;
  direct_company_contact: boolean;
  priority_listing: boolean;
  analytics_dashboard: boolean;
  ai_profile_autofill: boolean;
  ai_job_matching: boolean;
  premium_support: boolean;
}

interface Subscription {
  plan_name: string;
  applications_used: number;
  applications_limit: number;
  plan_details: Plan;
}

export default function Subscription() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPlans();
      fetchCurrentSubscription();
    }
  }, [user]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('talent_subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_eur', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('talent-check-subscription');
      
      if (error) throw error;
      setCurrentSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) return;

    setCheckingOut(planId);
    try {
      const { data, error } = await supabase.functions.invoke('talent-create-checkout', {
        body: { plan_id: planId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setCheckingOut(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'BASIC': return <Zap className="h-6 w-6" />;
      case 'PRO': return <Crown className="h-6 w-6" />;
      case 'PREMIUM': return <Sparkles className="h-6 w-6" />;
      default: return <Shield className="h-6 w-6" />;
    }
  };

  const isCurrentPlan = (planName: string) => {
    return currentSubscription?.plan_name === planName;
  };

  if (loading || loadingPlans) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground">
            Upgrade your profile and unlock powerful features
          </p>
        </div>

        {currentSubscription && (
          <div className="mb-8 p-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-center">
              <span className="font-semibold">Current Plan:</span> {currentSubscription.plan_name}
              {currentSubscription.applications_limit !== -1 && (
                <span className="ml-4">
                  Applications used: {currentSubscription.applications_used} / {currentSubscription.applications_limit}
                </span>
              )}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`p-6 relative ${isCurrentPlan(plan.name) ? 'ring-2 ring-primary' : ''} ${plan.name === 'PRO' ? 'border-primary' : ''}`}
            >
              {isCurrentPlan(plan.name) && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Current Plan
                </Badge>
              )}
              
              {plan.name === 'PRO' && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {getPlanIcon(plan.name)}
                </div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
              </div>

              <div className="mb-6">
                <div className="text-3xl font-bold">
                  {plan.price_eur === 0 ? 'Free' : `€${(plan.price_eur / 100).toFixed(2)}`}
                </div>
                {plan.price_eur > 0 && (
                  <p className="text-sm text-muted-foreground">per month</p>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>
                    {plan.application_limit === -1 ? 'Unlimited' : plan.application_limit} applications/month
                  </span>
                </div>

                {plan.skill_limit && (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{plan.skill_limit} skills max</span>
                  </div>
                )}

                {plan.certification_limit === null && (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Unlimited certifications</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>
                    {plan.cv_upload_limit === -1 ? 'Unlimited' : plan.cv_upload_limit} CV uploads
                  </span>
                </div>

                {plan.profile_views_enabled && (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>
                      Who viewed profile {plan.profile_views_limit ? `(last ${plan.profile_views_limit})` : '(full history)'}
                    </span>
                  </div>
                )}

                {plan.featured_profile && (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Featured Profile badge</span>
                  </div>
                )}

                {plan.verified_badge && (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Verified Profile badge</span>
                  </div>
                )}

                {plan.priority_listing && (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Priority listing</span>
                  </div>
                )}

                {plan.analytics_dashboard && (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Analytics dashboard</span>
                  </div>
                )}

                {plan.ai_profile_autofill && (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>AI Profile Auto-fill</span>
                  </div>
                )}

                {plan.ai_job_matching && (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Smart Job Matching AI</span>
                  </div>
                )}

                {plan.direct_company_contact && (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Direct company contact</span>
                  </div>
                )}

                {plan.premium_support && (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Premium support</span>
                  </div>
                )}
              </div>

              <Button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isCurrentPlan(plan.name) || plan.name === 'FREE' || checkingOut === plan.id}
                className="w-full"
                variant={plan.name === 'PRO' ? 'default' : 'outline'}
              >
                {checkingOut === plan.id ? 'Processing...' : isCurrentPlan(plan.name) ? 'Current Plan' : plan.name === 'FREE' ? 'Free Plan' : 'Upgrade'}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}

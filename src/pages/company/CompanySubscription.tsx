import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Crown, Zap, Sparkles, TrendingUp, Clock } from "lucide-react";

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
  ai_matching_enabled: boolean;
  ai_matching_price_eur: number;
  ai_matches_used_this_month: number;
  trial_end_date: string;
  is_trial: boolean;
  subscription_plans: SubscriptionPlan;
}

const CompanySubscription = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CompanySubscription | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [previewAIEnabled, setPreviewAIEnabled] = useState(false);

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

  const handleOpenPreview = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setPreviewAIEnabled(false);
    setPreviewDialogOpen(true);
  };

  const handleConfirmCheckout = async () => {
    if (!companyId || !selectedPlan) return;

    try {
      setLoadingData(true);

      // Call edge function to create Stripe Checkout Session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          plan_id: selectedPlan.id,
          ai_matching_enabled: previewAIEnabled
        }
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error(error.message || "Failed to start checkout");
      setLoadingData(false);
    }
  };

  const calculateAIMatchingPrice = (plan: SubscriptionPlan) => {
    const percentage = plan.job_limit <= 40 ? 0.1 : 0.3;
    return Math.round(plan.price_eur * percentage);
  };

  const handleToggleAIMatching = async (enabled: boolean) => {
    if (!currentSubscription || !companyId) return;

    // If enabling AI matching, create a new checkout with AI addon
    if (enabled) {
      try {
        setLoadingData(true);

        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: { 
            plan_id: currentSubscription.plan_id,
            ai_matching_enabled: true
          }
        });

        if (error) throw error;

        if (data?.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL received');
        }

      } catch (error: any) {
        console.error('Error creating checkout:', error);
        toast.error(error.message || "Failed to start checkout");
        setLoadingData(false);
      }
    } else {
      // If disabling, just update the database
      try {
        setLoadingData(true);

        const { error } = await supabase
          .from('company_subscriptions')
          .update({ ai_matching_enabled: false })
          .eq('id', currentSubscription.id);

        if (error) throw error;

        toast.success("AI Matching disabled");
        loadData();
      } catch (error: any) {
        console.error('Error toggling AI matching:', error);
        toast.error(error.message || "Failed to update AI matching");
      } finally {
        setLoadingData(false);
      }
    }
  };

  const calculateTrialDaysLeft = () => {
    if (!currentSubscription || !currentSubscription.is_trial) return 0;
    const trialEnd = new Date(currentSubscription.trial_end_date);
    const now = new Date();
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
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
          <>
            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold">Current Plan: {currentSubscription.subscription_plans.name}</h3>
                    {currentSubscription.is_trial && calculateTrialDaysLeft() > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        <Clock className="h-3 w-3 mr-1" />
                        {calculateTrialDaysLeft()} days trial left
                      </Badge>
                    )}
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

            <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">AI-Powered Talent Matching</h3>
                      <p className="text-muted-foreground">Find the perfect candidates faster with AI</p>
                    </div>
                  </div>

                  {currentSubscription.is_trial && calculateTrialDaysLeft() > 0 && (
                    <Badge className="mb-4 bg-green-500">
                      <Zap className="h-3 w-3 mr-1" />
                      Free during {calculateTrialDaysLeft()}-day trial
                    </Badge>
                  )}

                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-background/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <span className="font-semibold">ROI: 6,000%+</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Extreme cost savings vs manual recruiting</p>
                    </div>
                    
                    <div className="bg-background/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Save 20+ hours/job</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Automated candidate screening & ranking</p>
                    </div>
                    
                    <div className="bg-background/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <span className="font-semibold">1 free match/month</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Always included per job posting</p>
                    </div>
                  </div>

                  <div className="bg-background/80 p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="ai-matching-toggle" className="text-base font-semibold cursor-pointer">
                          Unlimited AI Matching
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {currentSubscription.subscription_plans.job_limit <= 40 ? '10%' : '30%'} of subscription 
                          {' '}(€{currentSubscription.ai_matching_price_eur}/month)
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {currentSubscription.ai_matches_used_this_month} AI matches used this month
                        </p>
                      </div>
                      <Switch
                        id="ai-matching-toggle"
                        checked={currentSubscription.ai_matching_enabled}
                        onCheckedChange={handleToggleAIMatching}
                      />
                    </div>

                    {!currentSubscription.ai_matching_enabled && (
                      <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                        💡 Without unlimited matching, you get 1 free AI match per job per month. 
                        Enable unlimited for instant access to all candidates!
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Total Monthly Cost</p>
                      <p className="text-sm text-muted-foreground">
                        {currentSubscription.is_trial && calculateTrialDaysLeft() > 0 
                          ? 'Free during trial period' 
                          : 'Billed monthly'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">
                        €{currentSubscription.ai_matching_enabled 
                          ? currentSubscription.subscription_plans.price_eur + currentSubscription.ai_matching_price_eur
                          : currentSubscription.subscription_plans.price_eur}
                      </p>
                      <p className="text-sm text-muted-foreground">/month</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.plan_id === plan.id;
            const isPopular = plan.job_limit === 20 || plan.job_limit === 30;

            return (
              <Card key={plan.id} className={`p-4 relative ${isPopular ? 'border-primary shadow-lg' : ''}`}>
                {isPopular && (
                  <Badge className="absolute top-3 right-3 bg-primary text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                )}
                
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.job_limit} job postings</p>
                  </div>

                  <div>
                    <p className="text-3xl font-bold">€{plan.price_eur}</p>
                    <p className="text-xs text-muted-foreground">per month</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      €{(plan.price_eur / plan.job_limit).toFixed(2)} per job
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 text-primary" />
                      <span>{plan.job_limit} active job postings</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 text-primary" />
                      <span>Unlimited applications</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 text-primary" />
                      <span>Candidate management</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 text-primary" />
                      <span>Team collaboration</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    variant={isCurrentPlan ? "outline" : "default"}
                    onClick={() => handleOpenPreview(plan)}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? "Current Plan" : "Select Plan"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="p-4 text-center bg-muted/50">
          <h3 className="text-lg font-semibold mb-2">Need more than 100 job postings?</h3>
          <p className="text-sm text-muted-foreground mb-3">Contact us for a custom enterprise plan</p>
          <Button variant="outline" size="sm">Contact Sales</Button>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Bekräfta ditt val</DialogTitle>
              <DialogDescription>
                Granska din prenumeration innan betalning
              </DialogDescription>
            </DialogHeader>
            
            {selectedPlan && (
              <div className="space-y-4">
                {/* Selected Plan */}
                <Card className="p-4 border-primary">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">{selectedPlan.name}</h3>
                      <Badge variant="secondary">{selectedPlan.job_limit} jobb</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Grundpris</span>
                      <span className="text-2xl font-bold">€{selectedPlan.price_eur}</span>
                    </div>
                  </div>
                </Card>

                {/* AI Matching Toggle */}
                <Card className="p-4 bg-primary/5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <Label htmlFor="preview-ai-toggle" className="font-semibold cursor-pointer">
                            AI Talent Matching
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Obegränsade AI-matchningar per månad
                        </p>
                      </div>
                      <Switch
                        id="preview-ai-toggle"
                        checked={previewAIEnabled}
                        onCheckedChange={setPreviewAIEnabled}
                      />
                    </div>
                    
                    {previewAIEnabled && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-muted-foreground">AI Matching</span>
                        <span className="font-semibold">€{calculateAIMatchingPrice(selectedPlan)}</span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Total */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-bold">Totalt per månad</span>
                    <span className="text-2xl font-bold text-primary">
                      €{previewAIEnabled 
                        ? selectedPlan.price_eur + calculateAIMatchingPrice(selectedPlan)
                        : selectedPlan.price_eur}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Inkluderar {selectedPlan.job_limit} aktiva jobbpubliceringar
                    {previewAIEnabled && " + obegränsade AI-matchningar"}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setPreviewDialogOpen(false)}
                    className="flex-1"
                  >
                    Avbryt
                  </Button>
                  <Button
                    onClick={handleConfirmCheckout}
                    disabled={loadingData}
                    className="flex-1"
                  >
                    {loadingData ? "Laddar..." : "Bekräfta och betala"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </CompanyLayout>
  );
};

export default CompanySubscription;

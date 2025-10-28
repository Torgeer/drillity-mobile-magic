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
import { Check, Crown, Zap, Sparkles, TrendingUp, Clock, Gift, Calendar } from "lucide-react";

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
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  
  // Check if user is eligible for early bird discount
  const isEarlyBird = user && new Date(user.created_at || '') < new Date('2026-01-01');
  const campaignEndDate = new Date('2025-12-31T23:59:59');
  const daysUntilCampaignEnd = Math.ceil((campaignEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

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
          ai_matching_enabled: previewAIEnabled,
          billing_interval: billingInterval
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

  const calculateAIMatchingPrice = (plan: SubscriptionPlan, interval: 'month' | 'year') => {
    // First calculate discounted price
    const discountedPrice = calculatePrice(plan.price_eur, interval);
    const monthlyDiscountedPrice = interval === 'year' ? discountedPrice / 12 : discountedPrice;
    
    // Then calculate AI matching on discounted price
    const percentage = plan.job_limit <= 40 ? 0.1 : 0.3;
    return Math.round(monthlyDiscountedPrice * percentage);
  };

  const calculatePrice = (basePrice: number, interval: 'month' | 'year') => {
    let price = interval === 'year' ? basePrice * 12 : basePrice;
    
    // Apply early bird discount (50% off)
    if (isEarlyBird) {
      price = price * 0.5;
      
      // Apply additional annual discount (30% off) for yearly billing
      if (interval === 'year') {
        price = price * 0.7;
      }
    }
    
    return Math.round(price);
  };

  const calculateSavings = (basePrice: number) => {
    const monthlyTotal = basePrice * 12;
    const annualPrice = calculatePrice(basePrice, 'year');
    return monthlyTotal - annualPrice;
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

        {/* Campaign Banner */}
        {isEarlyBird && daysUntilCampaignEnd > 0 && (
          <Card className="p-6 bg-gradient-to-r from-primary/20 via-primary/10 to-background border-2 border-primary/30">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Gift className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-2xl font-bold">🎉 Exclusive 2025 Offer!</h3>
                  <Badge variant="secondary" className="bg-primary/20">
                    <Clock className="h-3 w-3 mr-1" />
                    {daysUntilCampaignEnd} days left
                  </Badge>
                </div>
                <p className="text-lg mb-3">
                  <span className="font-bold text-primary">50% discount</span> on all subscriptions for those who registered before 12/31/2025! 🚀
                </p>
                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="font-semibold">
                    Choose annual billing and get <span className="text-primary">an additional 30% discount</span> (total 65% off!)
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Billing Interval Toggle */}
        <Card className="p-4">
          <div className="flex items-center justify-center gap-4">
            <span className={`font-medium ${billingInterval === 'month' ? 'text-primary' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={billingInterval === 'year'}
              onCheckedChange={(checked) => setBillingInterval(checked ? 'year' : 'month')}
            />
            <span className={`font-medium ${billingInterval === 'year' ? 'text-primary' : 'text-muted-foreground'}`}>
              Annually
              {isEarlyBird && (
                <Badge variant="secondary" className="ml-2 bg-green-500 text-white">
                  -30% extra
                </Badge>
              )}
            </span>
          </div>
        </Card>

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
            const displayPrice = calculatePrice(plan.price_eur, billingInterval);
            const originalPrice = billingInterval === 'year' ? plan.price_eur * 12 : plan.price_eur;
            const savings = isEarlyBird && billingInterval === 'year' ? calculateSavings(plan.price_eur) : 0;

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
                    {isEarlyBird && (
                      <p className="text-sm text-muted-foreground line-through">
                        €{originalPrice}
                      </p>
                    )}
                    <p className="text-3xl font-bold">€{displayPrice}</p>
                    <p className="text-xs text-muted-foreground">
                      per {billingInterval === 'year' ? 'year' : 'month'}
                    </p>
                    {isEarlyBird && (
                      <Badge variant="secondary" className="mt-1 bg-green-500 text-white">
                        <Gift className="h-3 w-3 mr-1" />
                        Save €{originalPrice - displayPrice}
                      </Badge>
                    )}
                    {billingInterval === 'year' && isEarlyBird && savings > 0 && (
                      <p className="text-xs text-primary font-semibold mt-1">
                        Total €{savings} cheaper than monthly!
                      </p>
                    )}
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
              <DialogTitle className="text-2xl">Confirm Your Selection</DialogTitle>
              <DialogDescription>
                Review your subscription before payment
              </DialogDescription>
            </DialogHeader>
            
            {selectedPlan && (
              <div className="space-y-4">
                {/* Campaign Info */}
                {isEarlyBird && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <Gift className="h-5 w-5" />
                      <div>
                        <p className="font-semibold">You're getting campaign discounts!</p>
                        <p className="text-sm">
                          50% discount {billingInterval === 'year' && '+ 30% extra for annual billing'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Plan */}
                <Card className="p-4 border-primary">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">{selectedPlan.name}</h3>
                      <Badge variant="secondary">{selectedPlan.job_limit} jobs</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Billing Interval</span>
                      <span className="font-semibold">{billingInterval === 'year' ? 'Annual' : 'Monthly'}</span>
                    </div>
                    {isEarlyBird && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground line-through">
                          Regular price
                        </span>
                        <span className="text-muted-foreground line-through">
                          €{billingInterval === 'year' ? selectedPlan.price_eur * 12 : selectedPlan.price_eur}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Campaign Price</span>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        €{calculatePrice(selectedPlan.price_eur, billingInterval)}
                      </span>
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
                          Unlimited AI matches per month (calculated on discounted price)
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
                        <span className="font-semibold">€{calculateAIMatchingPrice(selectedPlan, billingInterval)}/month</span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Total */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-bold">
                      Total per {billingInterval === 'year' ? 'year' : 'month'}
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      €{calculatePrice(selectedPlan.price_eur, billingInterval) + (previewAIEnabled ? calculateAIMatchingPrice(selectedPlan, billingInterval) : 0)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Includes {selectedPlan.job_limit} active job postings
                    {previewAIEnabled && " + unlimited AI matches"}
                  </p>
                  {isEarlyBird && billingInterval === 'year' && (
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      🎉 You save €{calculateSavings(selectedPlan.price_eur)} compared to monthly!
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setPreviewDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmCheckout}
                    disabled={loadingData}
                    className="flex-1"
                  >
                    {loadingData ? "Processing..." : "Confirm and Pay"}
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

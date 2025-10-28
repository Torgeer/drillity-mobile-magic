import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'invoice'>('card');
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceFormData, setInvoiceFormData] = useState({
    po_number: '',
    vat_number: '',
    billing_email: '',
    company_name: '',
    payment_terms: 30,
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    }
  });
  
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

  const openStripeCheckout = (url: string) => {
    setPreviewDialogOpen(false);
    
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    
    // Reset loading after a brief delay
    setTimeout(() => {
      setLoadingData(false);
    }, 500);
    
    // Check if popup was blocked
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      toast.error("Pop-up blocked. Please allow pop-ups and try again.", {
        duration: 5000,
        action: {
          label: "Open Checkout",
          onClick: () => window.open(url, '_blank')
        }
      });
    } else {
      toast.success("Checkout opened in new tab");
    }
  };

  const handleOpenPreview = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setPreviewAIEnabled(false);
    
    // If invoice payment, show invoice form dialog first
    if (paymentMethod === 'invoice') {
      setInvoiceDialogOpen(true);
    } else {
      setPreviewDialogOpen(true);
    }
  };

  const handleConfirmCheckout = async () => {
    if (!companyId || !selectedPlan) return;

    // If invoice payment, show invoice form instead
    if (paymentMethod === 'invoice') {
      setPreviewDialogOpen(false);
      setInvoiceDialogOpen(true);
      return;
    }

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

      // Open Stripe Checkout in new tab
      if (data?.url) {
        openStripeCheckout(data.url);
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error(error.message || "Failed to start checkout");
      setLoadingData(false);
    }
  };

  const handleConfirmInvoice = async () => {
    if (!companyId || !selectedPlan) return;

    try {
      setLoadingData(true);

      // Call edge function to create invoice
      const { data, error } = await supabase.functions.invoke('create-invoice-subscription', {
        body: { 
          plan_id: selectedPlan.id,
          ai_matching_enabled: previewAIEnabled,
          billing_interval: billingInterval,
          payment_terms: invoiceFormData.payment_terms,
          po_number: invoiceFormData.po_number || undefined,
          vat_number: invoiceFormData.vat_number || undefined,
          billing_email: invoiceFormData.billing_email || undefined,
          company_name: invoiceFormData.company_name || undefined,
          billing_address: invoiceFormData.address.line1 ? invoiceFormData.address : undefined
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Invoice created and sent to your email!");
        setInvoiceDialogOpen(false);
        setPreviewDialogOpen(false);
        
        // Show invoice details
        toast.info(`Invoice amount: €${data.amount_due.toFixed(2)}. Due date: ${new Date(data.due_date).toLocaleDateString()}`);
        
        // Optionally open invoice PDF
        if (data.invoice_pdf) {
          window.open(data.invoice_pdf, '_blank');
        }
        
        // Reload data to show pending subscription
        await loadData();
      } else {
        throw new Error('Failed to create invoice');
      }

    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(error.message || "Failed to create invoice");
    } finally {
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
          openStripeCheckout(data.url);
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

        {/* Payment Method Selector */}
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Payment Method</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose how you'd like to pay for your subscription
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Card Payment Option */}
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  paymentMethod === 'card' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setPaymentMethod('card')}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'card' ? 'border-primary' : 'border-muted-foreground'
                  }`}>
                    {paymentMethod === 'card' && (
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold mb-1">Credit Card Payment</div>
                    <p className="text-sm text-muted-foreground">
                      Pay instantly with credit/debit card, Link, or bank transfer
                    </p>
                    <Badge variant="secondary" className="mt-2 bg-green-500 text-white">
                      Instant activation
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Invoice Option */}
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  paymentMethod === 'invoice' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setPaymentMethod('invoice')}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'invoice' ? 'border-primary' : 'border-muted-foreground'
                  }`}>
                    {paymentMethod === 'invoice' && (
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold mb-1">Invoice Payment (B2B)</div>
                    <p className="text-sm text-muted-foreground">
                      Receive an invoice via email. Pay with bank transfer (Net 15/30/45 days)
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      Perfect for companies
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {paymentMethod === 'invoice' && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💼 <strong>Invoice payment is ideal for:</strong> Companies that need proper accounting documentation, 
                  PO number tracking, VAT invoices, or can't use corporate cards for large purchases.
                </p>
              </div>
            )}
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
                    {loadingData ? "Processing..." : paymentMethod === 'invoice' ? "Review Invoice Details" : "Confirm and Pay"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Invoice Form Dialog */}
        <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Payment Details</DialogTitle>
              <DialogDescription>
                Please provide your company billing information for the invoice
              </DialogDescription>
            </DialogHeader>

            {selectedPlan && (
              <div className="space-y-6">
                {/* Selected Plan Summary */}
                <Card className="p-4 bg-primary/5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold">{selectedPlan.name} Plan</h3>
                      <Badge>{billingInterval === 'year' ? 'Annual' : 'Monthly'}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Subscription Cost</span>
                      <span className="font-semibold">€{calculatePrice(selectedPlan.price_eur, billingInterval)}</span>
                    </div>
                    {previewAIEnabled && (
                      <div className="flex items-center justify-between text-sm">
                        <span>AI Matching</span>
                        <span className="font-semibold">€{calculateAIMatchingPrice(selectedPlan, billingInterval)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t font-bold">
                      <span>Total</span>
                      <span className="text-lg text-primary">
                        €{calculatePrice(selectedPlan.price_eur, billingInterval) + (previewAIEnabled ? calculateAIMatchingPrice(selectedPlan, billingInterval) : 0)}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Company Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Company Information</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input
                        id="company_name"
                        placeholder="Enter company name"
                        value={invoiceFormData.company_name}
                        onChange={(e) => setInvoiceFormData({ ...invoiceFormData, company_name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing_email">Billing Email</Label>
                      <Input
                        id="billing_email"
                        type="email"
                        placeholder="accounting@company.com"
                        value={invoiceFormData.billing_email}
                        onChange={(e) => setInvoiceFormData({ ...invoiceFormData, billing_email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vat_number">VAT Number (Optional)</Label>
                      <Input
                        id="vat_number"
                        placeholder="DE123456789"
                        value={invoiceFormData.vat_number}
                        onChange={(e) => setInvoiceFormData({ ...invoiceFormData, vat_number: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="po_number">PO Number (Optional)</Label>
                      <Input
                        id="po_number"
                        placeholder="PO-2025-001"
                        value={invoiceFormData.po_number}
                        onChange={(e) => setInvoiceFormData({ ...invoiceFormData, po_number: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_terms">Payment Terms</Label>
                    <Select 
                      value={invoiceFormData.payment_terms.toString()}
                      onValueChange={(value) => setInvoiceFormData({ ...invoiceFormData, payment_terms: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">Net 15 (Due in 15 days)</SelectItem>
                        <SelectItem value="30">Net 30 (Due in 30 days)</SelectItem>
                        <SelectItem value="45">Net 45 (Due in 45 days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Billing Address */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Billing Address (Optional)</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address_line1">Address Line 1</Label>
                    <Input
                      id="address_line1"
                      placeholder="Street address"
                      value={invoiceFormData.address.line1}
                      onChange={(e) => setInvoiceFormData({ 
                        ...invoiceFormData, 
                        address: { ...invoiceFormData.address, line1: e.target.value }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address_line2">Address Line 2</Label>
                    <Input
                      id="address_line2"
                      placeholder="Apartment, suite, etc."
                      value={invoiceFormData.address.line2}
                      onChange={(e) => setInvoiceFormData({ 
                        ...invoiceFormData, 
                        address: { ...invoiceFormData.address, line2: e.target.value }
                      })}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="City"
                        value={invoiceFormData.address.city}
                        onChange={(e) => setInvoiceFormData({ 
                          ...invoiceFormData, 
                          address: { ...invoiceFormData.address, city: e.target.value }
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        placeholder="12345"
                        value={invoiceFormData.address.postal_code}
                        onChange={(e) => setInvoiceFormData({ 
                          ...invoiceFormData, 
                          address: { ...invoiceFormData.address, postal_code: e.target.value }
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        placeholder="DE"
                        value={invoiceFormData.address.country}
                        onChange={(e) => setInvoiceFormData({ 
                          ...invoiceFormData, 
                          address: { ...invoiceFormData.address, country: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    📧 <strong>What happens next:</strong> We'll create and send a professional invoice to your email. 
                    You can pay via bank transfer, SEPA, or other methods. Your subscription activates once payment is received.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setInvoiceDialogOpen(false);
                      setPreviewDialogOpen(true); // Go back to preview
                    }}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleConfirmInvoice}
                    disabled={loadingData}
                    className="flex-1"
                  >
                    {loadingData ? "Creating Invoice..." : "Create Invoice"}
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

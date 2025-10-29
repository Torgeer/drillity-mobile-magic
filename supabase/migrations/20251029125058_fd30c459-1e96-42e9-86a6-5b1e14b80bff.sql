-- Create talent subscription plans table
CREATE TABLE IF NOT EXISTS public.talent_subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_eur INTEGER NOT NULL,
  billing_interval TEXT NOT NULL DEFAULT 'month', -- 'month' or 'year'
  application_limit INTEGER NOT NULL,
  skill_limit INTEGER,
  certification_limit INTEGER,
  cv_upload_limit INTEGER NOT NULL,
  profile_views_enabled BOOLEAN DEFAULT FALSE,
  profile_views_limit INTEGER,
  featured_profile BOOLEAN DEFAULT FALSE,
  verified_badge BOOLEAN DEFAULT FALSE,
  profile_highlight_per_month INTEGER DEFAULT 0,
  direct_company_contact BOOLEAN DEFAULT FALSE,
  priority_listing BOOLEAN DEFAULT FALSE,
  analytics_dashboard BOOLEAN DEFAULT FALSE,
  ai_profile_autofill BOOLEAN DEFAULT FALSE,
  ai_job_matching BOOLEAN DEFAULT FALSE,
  premium_support BOOLEAN DEFAULT FALSE,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create talent subscriptions table
CREATE TABLE IF NOT EXISTS public.talent_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.talent_subscription_plans(id),
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  applications_used_this_month INTEGER DEFAULT 0,
  applications_reset_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
  profile_highlights_used_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profile analytics table (for PRO+ users)
CREATE TABLE IF NOT EXISTS public.profile_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  profile_views INTEGER DEFAULT 0,
  application_views INTEGER DEFAULT 0,
  job_matches_received INTEGER DEFAULT 0,
  companies_interested INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(talent_id, date)
);

-- Enable RLS
ALTER TABLE public.talent_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for talent_subscription_plans
CREATE POLICY "Anyone can view subscription plans"
  ON public.talent_subscription_plans
  FOR SELECT
  USING (is_active = true);

-- RLS Policies for talent_subscriptions
CREATE POLICY "Talents can view own subscription"
  ON public.talent_subscriptions
  FOR SELECT
  USING (auth.uid() = talent_id);

CREATE POLICY "Talents can insert own subscription"
  ON public.talent_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = talent_id);

CREATE POLICY "Talents can update own subscription"
  ON public.talent_subscriptions
  FOR UPDATE
  USING (auth.uid() = talent_id);

-- RLS Policies for profile_analytics
CREATE POLICY "Talents can view own analytics"
  ON public.profile_analytics
  FOR SELECT
  USING (auth.uid() = talent_id);

CREATE POLICY "System can insert analytics"
  ON public.profile_analytics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update analytics"
  ON public.profile_analytics
  FOR UPDATE
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_talent_subscriptions_updated_at
  BEFORE UPDATE ON public.talent_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.talent_subscription_plans (name, price_eur, billing_interval, application_limit, skill_limit, certification_limit, cv_upload_limit, profile_views_enabled, profile_views_limit, featured_profile, verified_badge, profile_highlight_per_month, direct_company_contact, priority_listing, analytics_dashboard, ai_profile_autofill, ai_job_matching, premium_support) VALUES
  ('FREE', 0, 'month', 3, 3, 2, 1, false, null, false, false, 0, false, false, false, false, false, false),
  ('BASIC', 599, 'month', 15, 10, null, 3, true, 10, false, false, 0, false, false, false, false, false, false),
  ('PRO', 1499, 'month', -1, null, null, 10, true, null, true, false, 0, false, true, true, false, false, false),
  ('PREMIUM', 2599, 'month', -1, null, null, -1, true, null, true, true, 1, true, true, true, true, true, true);

-- Function to reset monthly application limits
CREATE OR REPLACE FUNCTION public.reset_monthly_talent_applications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE talent_subscriptions
  SET 
    applications_used_this_month = 0,
    applications_reset_date = now() + interval '1 month',
    profile_highlights_used_this_month = 0
  WHERE applications_reset_date <= now();
END;
$$;
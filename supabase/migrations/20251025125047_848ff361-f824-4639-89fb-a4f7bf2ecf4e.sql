-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  job_limit integer NOT NULL,
  price_eur integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert subscription plans
INSERT INTO public.subscription_plans (name, job_limit, price_eur) VALUES
  ('Starter', 2, 699),
  ('Basic', 5, 1399),
  ('Professional', 10, 2299),
  ('Business', 15, 2799),
  ('Growth', 20, 3299),
  ('Premium', 30, 4399),
  ('Enterprise', 40, 5249),
  ('Corporate', 50, 5999),
  ('Advanced', 60, 6649),
  ('Elite', 70, 7199),
  ('Ultimate', 80, 7649),
  ('Platinum', 90, 7999),
  ('Diamond', 100, 8399);

-- Create company subscriptions table
CREATE TABLE public.company_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  jobs_used integer DEFAULT 0,
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_plans (everyone can view)
CREATE POLICY "Anyone can view subscription plans"
ON public.subscription_plans
FOR SELECT
USING (true);

-- Policies for company_subscriptions
CREATE POLICY "Companies can view own subscription"
ON public.company_subscriptions
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM company_profiles WHERE id = company_subscriptions.company_id
  ) OR
  auth.uid() IN (
    SELECT user_id FROM company_users WHERE company_id = company_subscriptions.company_id
  )
);

CREATE POLICY "Companies can insert own subscription"
ON public.company_subscriptions
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM company_profiles WHERE id = company_subscriptions.company_id
  )
);

CREATE POLICY "Companies can update own subscription"
ON public.company_subscriptions
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM company_profiles WHERE id = company_subscriptions.company_id
  ) OR
  auth.uid() IN (
    SELECT user_id FROM company_users 
    WHERE company_id = company_subscriptions.company_id 
    AND role = 'admin'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_company_subscriptions_updated_at
BEFORE UPDATE ON public.company_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
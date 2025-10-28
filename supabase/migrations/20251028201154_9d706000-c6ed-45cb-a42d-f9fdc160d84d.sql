-- Add Stripe integration columns to subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- Add Stripe tracking columns to company_subscriptions
ALTER TABLE company_subscriptions 
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS stripe_customer_id text;
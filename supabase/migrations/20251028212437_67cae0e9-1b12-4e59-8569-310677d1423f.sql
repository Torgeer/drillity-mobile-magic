-- Add stripe_price_id_annual column to subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS stripe_price_id_annual text;

-- Add campaign tracking columns to company_subscriptions
ALTER TABLE company_subscriptions
ADD COLUMN IF NOT EXISTS early_bird_discount_applied boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS annual_discount_applied boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS billing_interval text DEFAULT 'month';

-- Update subscription_plans with annual price IDs
UPDATE subscription_plans SET stripe_price_id_annual = 'price_1SNKMoLzOHw7qgMdRnbeCUVx' WHERE name = 'Starter';
UPDATE subscription_plans SET stripe_price_id_annual = 'price_1SNKMpLzOHw7qgMdnxEpgFlb' WHERE name = 'Basic';
UPDATE subscription_plans SET stripe_price_id_annual = 'price_1SNKMqLzOHw7qgMdFpIiFd0p' WHERE name = 'Professional';
UPDATE subscription_plans SET stripe_price_id_annual = 'price_1SNKMrLzOHw7qgMdVsGiPHv9' WHERE name = 'Business';
UPDATE subscription_plans SET stripe_price_id_annual = 'price_1SNKMsLzOHw7qgMdpTU8Ju6J' WHERE name = 'Growth';
UPDATE subscription_plans SET stripe_price_id_annual = 'price_1SNKMtLzOHw7qgMd5kLXhLQM' WHERE name = 'Premium';
UPDATE subscription_plans SET stripe_price_id_annual = 'price_1SNKMvLzOHw7qgMd5W4kS8VB' WHERE name = 'Enterprise';
UPDATE subscription_plans SET stripe_price_id_annual = 'price_1SNKMwLzOHw7qgMdMvKNEj9L' WHERE name = 'Corporate';
UPDATE subscription_plans SET stripe_price_id_annual = 'price_1SNKMxLzOHw7qgMd6kpJnVue' WHERE name = 'Advanced';
UPDATE subscription_plans SET stripe_price_id_annual = 'price_1SNKMyLzOHw7qgMdALpVRRlt' WHERE name = 'Elite';
UPDATE subscription_plans SET stripe_price_id_annual = 'price_1SNKMzLzOHw7qgMdH4j6ZlW4' WHERE name = 'Ultimate';
UPDATE subscription_plans SET stripe_price_id_annual = 'price_1SNKN0LzOHw7qgMdlW7pA7ZX' WHERE name = 'Platinum';
UPDATE subscription_plans SET stripe_price_id_annual = 'price_1SNKN0LzOHw7qgMdfhx5juDd' WHERE name = 'Diamond';
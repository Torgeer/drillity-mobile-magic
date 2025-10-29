-- Update talent subscription plans with Stripe price IDs
UPDATE public.talent_subscription_plans 
SET stripe_price_id = 'price_1SNYrKLzOHw7qgMd1mOKg5C2'
WHERE name = 'BASIC';

UPDATE public.talent_subscription_plans 
SET stripe_price_id = 'price_1SNYrMLzOHw7qgMdngWbzUCf'
WHERE name = 'PRO';

UPDATE public.talent_subscription_plans 
SET stripe_price_id = 'price_1SNYrNLzOHw7qgMddISTo5kz'
WHERE name = 'PREMIUM';
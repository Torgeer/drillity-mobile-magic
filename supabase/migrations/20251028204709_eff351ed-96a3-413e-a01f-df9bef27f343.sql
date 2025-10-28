-- Update Corporate plan with correct Stripe price_id
UPDATE subscription_plans
SET stripe_price_id = 'price_1SNJmtLzOHw7qgMd1o54ZdE1'
WHERE name = 'Corporate' AND job_limit = 50;
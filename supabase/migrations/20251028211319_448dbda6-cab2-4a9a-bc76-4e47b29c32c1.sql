-- Update all subscription plans with new Stripe price IDs

-- Starter: 699 EUR, 2 jobs
UPDATE subscription_plans
SET stripe_price_id = 'price_1SNK5SLzOHw7qgMdR5Prg2Hl'
WHERE name = 'Starter' AND job_limit = 2;

-- Basic: 1,399 EUR, 5 jobs
UPDATE subscription_plans
SET stripe_price_id = 'price_1SNKB4LzOHw7qgMdzDxZjOEo'
WHERE name = 'Basic' AND job_limit = 5;

-- Professional: 2,299 EUR, 10 jobs
UPDATE subscription_plans
SET stripe_price_id = 'price_1SNK79LzOHw7qgMdS6sDzETm'
WHERE name = 'Professional' AND job_limit = 10;

-- Business: 2,799 EUR, 15 jobs
UPDATE subscription_plans
SET stripe_price_id = 'price_1SNK8oLzOHw7qgMdqOo1L0dN'
WHERE name = 'Business' AND job_limit = 15;

-- Growth: 3,299 EUR, 20 jobs
UPDATE subscription_plans
SET stripe_price_id = 'price_1SNKAMLzOHw7qgMdESy6vHsm'
WHERE name = 'Growth' AND job_limit = 20;

-- Premium: 4,399 EUR, 30 jobs
UPDATE subscription_plans
SET stripe_price_id = 'price_1SNKAaLzOHw7qgMd4YLKVMYl'
WHERE name = 'Premium' AND job_limit = 30;

-- Enterprise: 5,249 EUR, 40 jobs
UPDATE subscription_plans
SET stripe_price_id = 'price_1SNKAbLzOHw7qgMdsHdT17lA'
WHERE name = 'Enterprise' AND job_limit = 40;

-- Corporate: 5,999 EUR, 50 jobs
UPDATE subscription_plans
SET stripe_price_id = 'price_1SNKAcLzOHw7qgMdS1L3J71u'
WHERE name = 'Corporate' AND job_limit = 50;

-- Advanced: 6,649 EUR, 60 jobs
UPDATE subscription_plans
SET stripe_price_id = 'price_1SNKAfLzOHw7qgMdHkaZsXnO'
WHERE name = 'Advanced' AND job_limit = 60;

-- Elite: 7,199 EUR, 70 jobs
UPDATE subscription_plans
SET stripe_price_id = 'price_1SNKAhLzOHw7qgMdxxtdbeSV'
WHERE name = 'Elite' AND job_limit = 70;

-- Ultimate: 7,649 EUR, 80 jobs
UPDATE subscription_plans
SET stripe_price_id = 'price_1SNKAjLzOHw7qgMd0tbEiaVR'
WHERE name = 'Ultimate' AND job_limit = 80;

-- Platinum: 7,999 EUR, 90 jobs
UPDATE subscription_plans
SET stripe_price_id = 'price_1SNKAmLzOHw7qgMdR6HreMJH'
WHERE name = 'Platinum' AND job_limit = 90;

-- Diamond: 8,399 EUR, 100 jobs
UPDATE subscription_plans
SET stripe_price_id = 'price_1SNKAmLzOHw7qgMd82d1jOiJ'
WHERE name = 'Diamond' AND job_limit = 100;
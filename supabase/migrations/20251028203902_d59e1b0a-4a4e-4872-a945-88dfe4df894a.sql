-- Update stripe_price_id for the three missing plans
UPDATE subscription_plans 
SET stripe_price_id = 'price_1SNJeXLzOHw7qgMdUK4M1nck'
WHERE name = 'Advanced' AND job_limit = 60;

UPDATE subscription_plans 
SET stripe_price_id = 'price_1SNJemLzOHw7qgMdHyr5PXwc'
WHERE name = 'Platinum' AND job_limit = 90;

UPDATE subscription_plans 
SET stripe_price_id = 'price_1SNJf0LzOHw7qgMd4OG5z3nO'
WHERE name = 'Diamond' AND job_limit = 100;
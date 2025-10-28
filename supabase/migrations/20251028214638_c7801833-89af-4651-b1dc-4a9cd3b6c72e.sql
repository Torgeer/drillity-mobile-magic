-- Update AI matching price IDs for all subscription plans

-- Starter (2 jobs)
UPDATE subscription_plans 
SET 
  stripe_ai_price_id = 'price_1SNKhkLzOHw7qgMd9zHd8yfz',
  stripe_ai_price_id_annual = 'price_1SNKhlLzOHw7qgMdAnzvzqfO'
WHERE job_limit = 2;

-- Basic (5 jobs)
UPDATE subscription_plans 
SET 
  stripe_ai_price_id = 'price_1SNKhmLzOHw7qgMdzrvwPjHr',
  stripe_ai_price_id_annual = 'price_1SNKhnLzOHw7qgMd1vFS9G1a'
WHERE job_limit = 5;

-- Business (15 jobs)
UPDATE subscription_plans 
SET 
  stripe_ai_price_id = 'price_1SNKhoLzOHw7qgMdiPz3CgKV',
  stripe_ai_price_id_annual = 'price_1SNKhpLzOHw7qgMdJzIfFhdb'
WHERE job_limit = 15;

-- Premium (30 jobs)
UPDATE subscription_plans 
SET 
  stripe_ai_price_id = 'price_1SNKhuLzOHw7qgMd2oIW3GJs',
  stripe_ai_price_id_annual = 'price_1SNKhwLzOHw7qgMdSeDMjqmb'
WHERE job_limit = 30;

-- Enterprise (40 jobs)
UPDATE subscription_plans 
SET 
  stripe_ai_price_id = 'price_1SNKhsLzOHw7qgMd2jiVGrBM',
  stripe_ai_price_id_annual = 'price_1SNKhtLzOHw7qgMd488SL6UF'
WHERE job_limit = 40;

-- Corporate (50 jobs)
UPDATE subscription_plans 
SET 
  stripe_ai_price_id = 'price_1SNKhqLzOHw7qgMd8ulX28Sz',
  stripe_ai_price_id_annual = 'price_1SNKhrLzOHw7qgMdW1DYB5Mg'
WHERE job_limit = 50;

-- Advanced (60 jobs)
UPDATE subscription_plans 
SET 
  stripe_ai_price_id = 'price_1SNKhxLzOHw7qgMd7bN7xn7O',
  stripe_ai_price_id_annual = 'price_1SNKhyLzOHw7qgMdosHCoAQU'
WHERE job_limit = 60;

-- Elite (70 jobs)
UPDATE subscription_plans 
SET 
  stripe_ai_price_id = 'price_1SNKhzLzOHw7qgMdfe0uQ89l',
  stripe_ai_price_id_annual = 'price_1SNKi0LzOHw7qgMd9CfDZyK4'
WHERE job_limit = 70;

-- Ultimate (80 jobs)
UPDATE subscription_plans 
SET 
  stripe_ai_price_id = 'price_1SNKi1LzOHw7qgMd3lF3ShSu',
  stripe_ai_price_id_annual = 'price_1SNKi2LzOHw7qgMdzt2oZthu'
WHERE job_limit = 80;

-- Platinum (90 jobs)
UPDATE subscription_plans 
SET 
  stripe_ai_price_id = 'price_1SNKi3LzOHw7qgMdWM5ugYNS',
  stripe_ai_price_id_annual = 'price_1SNKi4LzOHw7qgMdjHNfGL03'
WHERE job_limit = 90;

-- Diamond (100 jobs)
UPDATE subscription_plans 
SET 
  stripe_ai_price_id = 'price_1SNKi5LzOHw7qgMdrq7vv7yz',
  stripe_ai_price_id_annual = 'price_1SNKi5LzOHw7qgMdY229fFwZ'
WHERE job_limit = 100;
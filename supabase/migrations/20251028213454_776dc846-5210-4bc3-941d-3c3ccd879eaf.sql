-- Add AI matching price IDs to subscription_plans
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS stripe_ai_price_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_ai_price_id_annual TEXT;

-- Update all plans with their AI matching price IDs
UPDATE subscription_plans SET 
  stripe_ai_price_id = 'price_1SNKWQLzOHw7qgMdmZQ540zQ',
  stripe_ai_price_id_annual = 'price_1SNKWSLzOHw7qgMdb6ngPKnk'
WHERE job_limit = 3;

UPDATE subscription_plans SET 
  stripe_ai_price_id = 'price_1SNKWTLzOHw7qgMdiIRdgBBS',
  stripe_ai_price_id_annual = 'price_1SNKWULzOHw7qgMdP2U3vQMS'
WHERE job_limit = 10;

UPDATE subscription_plans SET 
  stripe_ai_price_id = 'price_1SNKWVLzOHw7qgMd07R8w1rP',
  stripe_ai_price_id_annual = 'price_1SNKWWLzOHw7qgMdSAhIQVhC'
WHERE job_limit = 20;

UPDATE subscription_plans SET 
  stripe_ai_price_id = 'price_1SNKWXLzOHw7qgMdf1X7nsx6',
  stripe_ai_price_id_annual = 'price_1SNKWYLzOHw7qgMd5XP9w151'
WHERE job_limit = 40;

UPDATE subscription_plans SET 
  stripe_ai_price_id = 'price_1SNKWaLzOHw7qgMd5rxXwzfw',
  stripe_ai_price_id_annual = 'price_1SNKWbLzOHw7qgMdk8cNAkEX'
WHERE job_limit = 80;

UPDATE subscription_plans SET 
  stripe_ai_price_id = 'price_1SNKWcLzOHw7qgMdumnWtQnc',
  stripe_ai_price_id_annual = 'price_1SNKWdLzOHw7qgMd7agOQ1DT'
WHERE job_limit = 100;

UPDATE subscription_plans SET 
  stripe_ai_price_id = 'price_1SNKWeLzOHw7qgMdWxZ2ATrm',
  stripe_ai_price_id_annual = 'price_1SNKWfLzOHw7qgMda0jBGpGr'
WHERE job_limit = 150;

UPDATE subscription_plans SET 
  stripe_ai_price_id = 'price_1SNKWgLzOHw7qgMdCeqgXV3P',
  stripe_ai_price_id_annual = 'price_1SNKWhLzOHw7qgMdobFbzDHs'
WHERE job_limit = 200;

UPDATE subscription_plans SET 
  stripe_ai_price_id = 'price_1SNKWiLzOHw7qgMdQ65rcVO3',
  stripe_ai_price_id_annual = 'price_1SNKWjLzOHw7qgMdjodQLVSc'
WHERE job_limit = 300;

UPDATE subscription_plans SET 
  stripe_ai_price_id = 'price_1SNKWkLzOHw7qgMdGUzswttj',
  stripe_ai_price_id_annual = 'price_1SNKWlLzOHw7qgMd63kKEXKV'
WHERE job_limit = 500;

UPDATE subscription_plans SET 
  stripe_ai_price_id = 'price_1SNKWmLzOHw7qgMd4HyJeanP',
  stripe_ai_price_id_annual = 'price_1SNKWnLzOHw7qgMdRTxvA59O'
WHERE job_limit = 750;

UPDATE subscription_plans SET 
  stripe_ai_price_id = 'price_1SNKWpLzOHw7qgMdgUDTQda9',
  stripe_ai_price_id_annual = 'price_1SNKWpLzOHw7qgMdX4bvZyn2'
WHERE job_limit = 1000;

UPDATE subscription_plans SET 
  stripe_ai_price_id = 'price_1SNKWqLzOHw7qgMd767diMkT',
  stripe_ai_price_id_annual = 'price_1SNKWqLzOHw7qgMduxO48iMc'
WHERE job_limit = 9999;
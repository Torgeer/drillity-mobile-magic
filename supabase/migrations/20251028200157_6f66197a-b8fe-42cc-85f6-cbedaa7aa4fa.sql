-- Add AI matching addon columns to company_subscriptions
ALTER TABLE company_subscriptions 
ADD COLUMN IF NOT EXISTS ai_matching_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_matching_price_eur integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_matches_used_this_month integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_matches_reset_date timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS trial_end_date timestamp with time zone DEFAULT (now() + interval '14 days'),
ADD COLUMN IF NOT EXISTS is_trial boolean DEFAULT true;

-- Create table for tracking AI match usage per job
CREATE TABLE IF NOT EXISTS ai_match_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  matches_found integer NOT NULL DEFAULT 0,
  cost_estimate numeric(10,4) DEFAULT 0,
  executed_at timestamp with time zone NOT NULL DEFAULT now(),
  was_free boolean DEFAULT false
);

-- Enable RLS on ai_match_usage
ALTER TABLE ai_match_usage ENABLE ROW LEVEL SECURITY;

-- Companies can view their own usage
CREATE POLICY "Companies can view own AI usage"
ON ai_match_usage FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM company_profiles WHERE id = ai_match_usage.company_id
  ) OR auth.uid() IN (
    SELECT user_id FROM company_users WHERE company_id = ai_match_usage.company_id
  )
);

-- System can insert usage records (handled by edge function)
CREATE POLICY "System can insert AI usage"
ON ai_match_usage FOR INSERT
WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_match_usage_company_date 
ON ai_match_usage(company_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_match_usage_job 
ON ai_match_usage(job_id, executed_at DESC);

-- Function to reset monthly AI match counter
CREATE OR REPLACE FUNCTION reset_monthly_ai_matches()
RETURNS void AS $$
BEGIN
  UPDATE company_subscriptions
  SET 
    ai_matches_used_this_month = 0,
    ai_matches_reset_date = now() + interval '1 month'
  WHERE ai_matches_reset_date <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
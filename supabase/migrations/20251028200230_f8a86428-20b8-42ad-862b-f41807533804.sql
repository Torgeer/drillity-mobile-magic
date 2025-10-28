-- Fix search_path for reset_monthly_ai_matches function
DROP FUNCTION IF EXISTS reset_monthly_ai_matches();

CREATE OR REPLACE FUNCTION reset_monthly_ai_matches()
RETURNS void AS $$
BEGIN
  UPDATE company_subscriptions
  SET 
    ai_matches_used_this_month = 0,
    ai_matches_reset_date = now() + interval '1 month'
  WHERE ai_matches_reset_date <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
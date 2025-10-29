-- Create function to reset monthly talent application counters
CREATE OR REPLACE FUNCTION reset_monthly_talent_counters()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE talent_subscriptions
  SET 
    applications_used_this_month = 0,
    applications_reset_date = applications_reset_date + interval '1 month',
    profile_highlights_used_this_month = 0
  WHERE 
    is_active = true 
    AND applications_reset_date <= now();
    
  RAISE NOTICE 'Reset monthly counters for % talent subscriptions', 
    (SELECT COUNT(*) FROM talent_subscriptions WHERE is_active = true AND applications_reset_date <= now());
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reset_monthly_talent_counters() TO authenticated;

-- Comment on function
COMMENT ON FUNCTION reset_monthly_talent_counters() IS 'Resets monthly application and profile highlight counters for active talent subscriptions when reset date has passed';
-- Uppdatera increment_profile_view funktionen med search_path
CREATE OR REPLACE FUNCTION increment_profile_view()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profile_analytics (talent_id, date, profile_views)
  VALUES (NEW.talent_id, CURRENT_DATE, 1)
  ON CONFLICT (talent_id, date) 
  DO UPDATE SET profile_views = profile_analytics.profile_views + 1;
  RETURN NEW;
END;
$$;
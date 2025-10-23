-- Create profile_views table to track company visits to talent profiles
CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL,
  company_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Talents can view their profile views" ON public.profile_views;
CREATE POLICY "Talents can view their profile views"
ON public.profile_views
FOR SELECT
USING (auth.uid() = talent_id);

DROP POLICY IF EXISTS "Companies can insert profile views" ON public.profile_views;
CREATE POLICY "Companies can insert profile views"
ON public.profile_views
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT company_profiles.user_id FROM public.company_profiles WHERE company_profiles.id = profile_views.company_id
  )
  OR auth.uid() IN (
    SELECT company_users.user_id FROM public.company_users WHERE company_users.company_id = profile_views.company_id
  )
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_profile_views_talent ON public.profile_views(talent_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_company ON public.profile_views(company_id, viewed_at DESC);

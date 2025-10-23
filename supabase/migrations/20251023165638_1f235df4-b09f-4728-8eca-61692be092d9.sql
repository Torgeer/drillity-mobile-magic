-- Fix infinite recursion in company_users RLS policies
-- The problem: policies were checking company_users to validate company_users access

DROP POLICY IF EXISTS "Company admins can manage users" ON public.company_users;
DROP POLICY IF EXISTS "Company users can view other users" ON public.company_users;

-- New simplified policies that don't cause recursion
CREATE POLICY "Users can view company_users where they are members"
ON public.company_users
FOR SELECT
USING (
  auth.uid() = user_id
  OR auth.uid() IN (
    SELECT cp.user_id FROM public.company_profiles cp WHERE cp.id = company_users.company_id
  )
);

CREATE POLICY "Company owners can manage all company_users"
ON public.company_users
FOR ALL
USING (
  auth.uid() IN (
    SELECT cp.user_id FROM public.company_profiles cp WHERE cp.id = company_users.company_id
  )
);

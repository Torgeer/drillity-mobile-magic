-- Create company_users table to support multiple users per company
CREATE TABLE IF NOT EXISTS public.company_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_company_user UNIQUE(company_id, user_id)
);

-- Enable RLS
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- Create policies for company_users
CREATE POLICY "Company admins can manage users"
ON public.company_users
FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM company_users 
    WHERE company_id = company_users.company_id 
    AND role = 'admin'
  )
);

CREATE POLICY "Company users can view other users"
ON public.company_users
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM company_users 
    WHERE company_id = company_users.company_id
  )
);

-- Update company_profiles policies to work with company_users table
DROP POLICY IF EXISTS "Companies can insert own profile" ON public.company_profiles;
DROP POLICY IF EXISTS "Companies can update own profile" ON public.company_profiles;

CREATE POLICY "Companies can insert own profile"
ON public.company_profiles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR 
  auth.uid() IN (
    SELECT user_id FROM company_users 
    WHERE company_id = company_profiles.id 
    AND role = 'admin'
  )
);

CREATE POLICY "Companies can update own profile"
ON public.company_profiles
FOR UPDATE
USING (
  auth.uid() = user_id OR 
  auth.uid() IN (
    SELECT user_id FROM company_users 
    WHERE company_id = company_profiles.id 
    AND role IN ('admin', 'manager')
  )
);

-- Update jobs policies to work with company_users
DROP POLICY IF EXISTS "Companies can create jobs" ON public.jobs;
DROP POLICY IF EXISTS "Companies can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Companies can delete own jobs" ON public.jobs;

CREATE POLICY "Companies can create jobs"
ON public.jobs
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM company_profiles WHERE id = jobs.company_id
  ) OR
  auth.uid() IN (
    SELECT user_id FROM company_users 
    WHERE company_id = jobs.company_id 
    AND role IN ('admin', 'manager', 'recruiter')
  )
);

CREATE POLICY "Companies can update own jobs"
ON public.jobs
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM company_profiles WHERE id = jobs.company_id
  ) OR
  auth.uid() IN (
    SELECT user_id FROM company_users 
    WHERE company_id = jobs.company_id 
    AND role IN ('admin', 'manager', 'recruiter')
  )
);

CREATE POLICY "Companies can delete own jobs"
ON public.jobs
FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM company_profiles WHERE id = jobs.company_id
  ) OR
  auth.uid() IN (
    SELECT user_id FROM company_users 
    WHERE company_id = jobs.company_id 
    AND role IN ('admin', 'manager')
  )
);

-- Update applications policies
DROP POLICY IF EXISTS "Talents can view own applications" ON public.applications;

CREATE POLICY "Talents can view own applications"
ON public.applications
FOR SELECT
USING (
  auth.uid() = talent_id OR 
  auth.uid() IN (
    SELECT user_id FROM company_profiles WHERE id = applications.company_id
  ) OR
  auth.uid() IN (
    SELECT user_id FROM company_users WHERE company_id = applications.company_id
  )
);

DROP POLICY IF EXISTS "Talents and companies can update applications" ON public.applications;

CREATE POLICY "Talents and companies can update applications"
ON public.applications
FOR UPDATE
USING (
  auth.uid() = talent_id OR 
  auth.uid() IN (
    SELECT user_id FROM company_profiles WHERE id = applications.company_id
  ) OR
  auth.uid() IN (
    SELECT user_id FROM company_users 
    WHERE company_id = applications.company_id 
    AND role IN ('admin', 'manager', 'recruiter')
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_company_users_updated_at
BEFORE UPDATE ON public.company_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
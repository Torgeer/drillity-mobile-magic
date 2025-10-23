-- Add sector columns to company_profiles
ALTER TABLE public.company_profiles
ADD COLUMN IF NOT EXISTS foundation_sector BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS offshore_sector BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mining_sector BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prospecting_sector BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS infrastructure_sector BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Create company_contacts table for contact persons
CREATE TABLE IF NOT EXISTS public.company_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;

-- Policies for company_contacts
DROP POLICY IF EXISTS "Companies can view own contacts" ON public.company_contacts;
CREATE POLICY "Companies can view own contacts"
ON public.company_contacts
FOR SELECT
USING (
  auth.uid() IN (
    SELECT company_profiles.user_id FROM public.company_profiles WHERE company_profiles.id = company_contacts.company_id
  )
  OR auth.uid() IN (
    SELECT company_users.user_id FROM public.company_users WHERE company_users.company_id = company_contacts.company_id
  )
);

DROP POLICY IF EXISTS "Companies can manage own contacts" ON public.company_contacts;
CREATE POLICY "Companies can manage own contacts"
ON public.company_contacts
FOR ALL
USING (
  auth.uid() IN (
    SELECT company_profiles.user_id FROM public.company_profiles WHERE company_profiles.id = company_contacts.company_id
  )
  OR auth.uid() IN (
    SELECT company_users.user_id FROM public.company_users 
    WHERE company_users.company_id = company_contacts.company_id 
    AND company_users.role = ANY(ARRAY['admin'::text, 'manager'::text])
  )
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_company_contacts_updated_at ON public.company_contacts;
CREATE TRIGGER update_company_contacts_updated_at
BEFORE UPDATE ON public.company_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index
CREATE INDEX IF NOT EXISTS idx_company_contacts_company ON public.company_contacts(company_id);

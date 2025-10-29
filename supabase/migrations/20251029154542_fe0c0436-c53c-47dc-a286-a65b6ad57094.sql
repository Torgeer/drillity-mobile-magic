-- Phase 1: Critical Security Fixes

-- 1. Create app_role enum for RBAC
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'recruiter', 'member');

-- 2. Create user_roles table for proper RBAC
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.company_profiles(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, company_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Create function to check company role
CREATE OR REPLACE FUNCTION public.has_company_role(_user_id UUID, _company_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role = _role
  )
$$;

-- 5. RLS Policy for user_roles (users can view their own roles)
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage roles for their company
CREATE POLICY "Admins can manage company roles"
ON public.user_roles
FOR ALL
USING (
  public.has_company_role(auth.uid(), company_id, 'admin')
);

-- 6. Fix profiles SELECT policy to respect profile_visibility
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view public profile info"
ON public.profiles
FOR SELECT
USING (
  -- Owner can see everything
  auth.uid() = id
  OR
  -- Public profiles: basic info only (no email, phone, passport)
  (profile_visibility = 'public')
  OR
  -- Private profiles: only companies who have interacted
  (profile_visibility = 'private' AND auth.uid() IN (
    SELECT company_profiles.user_id 
    FROM company_profiles
    WHERE company_profiles.id IN (
      SELECT company_id FROM applications WHERE talent_id = profiles.id
      UNION
      SELECT company_id FROM profile_views WHERE talent_id = profiles.id
    )
  ))
);

-- 7. Fix company_contacts - restrict to admin/manager only
DROP POLICY IF EXISTS "Companies can view own contacts" ON public.company_contacts;

CREATE POLICY "Admins and managers can view company contacts"
ON public.company_contacts
FOR SELECT
USING (
  auth.uid() IN (
    SELECT company_profiles.user_id
    FROM company_profiles
    WHERE company_profiles.id = company_contacts.company_id
  )
  OR
  public.has_company_role(auth.uid(), company_contacts.company_id, 'admin')
  OR
  public.has_company_role(auth.uid(), company_contacts.company_id, 'manager')
);

-- 8. Fix push_tokens - explicit SELECT policy
DROP POLICY IF EXISTS "Users can manage own tokens" ON public.push_tokens;

CREATE POLICY "Users can view own push tokens"
ON public.push_tokens
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push tokens"
ON public.push_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push tokens"
ON public.push_tokens
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push tokens"
ON public.push_tokens
FOR DELETE
USING (auth.uid() = user_id);

-- 9. Restrict company_subscriptions to admin-only for sensitive billing info
DROP POLICY IF EXISTS "Companies can view own subscription" ON public.company_subscriptions;

CREATE POLICY "Admins can view company subscription"
ON public.company_subscriptions
FOR SELECT
USING (
  auth.uid() IN (
    SELECT company_profiles.user_id
    FROM company_profiles
    WHERE company_profiles.id = company_subscriptions.company_id
  )
  OR
  public.has_company_role(auth.uid(), company_subscriptions.company_id, 'admin')
);

-- 10. Add missing DELETE policy for messages
CREATE POLICY "Users can delete own sent messages"
ON public.messages
FOR DELETE
USING (auth.uid() = sender_id);

-- 11. Add missing INSERT policy for conversations
CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (
  auth.uid() = talent_id
  OR
  auth.uid() IN (
    SELECT company_profiles.user_id
    FROM company_profiles
    WHERE company_profiles.id = conversations.company_id
  )
);

-- 12. Migrate existing company_users data to user_roles
INSERT INTO public.user_roles (user_id, company_id, role)
SELECT 
  user_id, 
  company_id,
  CASE 
    WHEN role = 'admin' THEN 'admin'::public.app_role
    WHEN role = 'manager' THEN 'manager'::public.app_role
    WHEN role = 'recruiter' THEN 'recruiter'::public.app_role
    ELSE 'member'::public.app_role
  END
FROM public.company_users
ON CONFLICT (user_id, company_id) DO NOTHING;
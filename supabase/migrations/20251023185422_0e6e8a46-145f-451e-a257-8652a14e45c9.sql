-- Add contact fields to company_profiles for richer company contact info
ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS address text;
-- Add new columns to profiles table for drilling industry information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS facebook_url text,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS has_passport boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS passport_number text,
ADD COLUMN IF NOT EXISTS experience_years integer,
ADD COLUMN IF NOT EXISTS drilling_experience boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS offshore_experience boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS mining_experience boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS prospecting_experience boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS foundation_experience boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available',
ADD COLUMN IF NOT EXISTS preferred_work_type text[];
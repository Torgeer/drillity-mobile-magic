-- Add new fields to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS project_photo_url text,
ADD COLUMN IF NOT EXISTS manager_phone text,
ADD COLUMN IF NOT EXISTS manager_email text;

-- Create project_team_members junction table for assigning company team to projects
CREATE TABLE IF NOT EXISTS public.project_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at timestamp with time zone DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS on project_team_members
ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_team_members
CREATE POLICY "Companies can manage team members for own projects"
ON public.project_team_members
FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM company_profiles 
    WHERE id = (SELECT company_id FROM projects WHERE id = project_team_members.project_id)
  ) OR
  auth.uid() IN (
    SELECT user_id FROM company_users 
    WHERE company_id = (SELECT company_id FROM projects WHERE id = project_team_members.project_id)
    AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Anyone can view project team members"
ON public.project_team_members
FOR SELECT
USING (true);
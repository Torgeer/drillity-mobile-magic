-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.company_profiles(id),
  project_name TEXT NOT NULL,
  type_of_works TEXT NOT NULL,
  site_manager_name TEXT NOT NULL,
  first_aider_name TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  additional_info TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Companies can view all projects
CREATE POLICY "Companies can view all projects"
  ON public.projects
  FOR SELECT
  USING (true);

-- Companies can create projects
CREATE POLICY "Companies can create projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM company_profiles WHERE id = projects.company_id
    ) OR auth.uid() IN (
      SELECT user_id FROM company_users 
      WHERE company_id = projects.company_id 
      AND role IN ('admin', 'manager')
    )
  );

-- Companies can update own projects
CREATE POLICY "Companies can update own projects"
  ON public.projects
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM company_profiles WHERE id = projects.company_id
    ) OR auth.uid() IN (
      SELECT user_id FROM company_users 
      WHERE company_id = projects.company_id 
      AND role IN ('admin', 'manager')
    )
  );

-- Companies can delete own projects
CREATE POLICY "Companies can delete own projects"
  ON public.projects
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM company_profiles WHERE id = projects.company_id
    ) OR auth.uid() IN (
      SELECT user_id FROM company_users 
      WHERE company_id = projects.company_id 
      AND role = 'admin'
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add project_id to jobs table
ALTER TABLE public.jobs ADD COLUMN project_id UUID REFERENCES public.projects(id);
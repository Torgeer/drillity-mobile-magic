-- Create industry_skills table with predefined skills
CREATE TABLE IF NOT EXISTS public.industry_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name text NOT NULL,
  industry text NOT NULL, -- 'offshore', 'oil_gas', 'foundation', 'prospecting', 'mining', 'construction', 'geotechnical'
  skill_type text, -- 'technical', 'certification', 'safety', 'software', 'equipment'
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.industry_skills ENABLE ROW LEVEL SECURITY;

-- Anyone can view industry skills
CREATE POLICY "Anyone can view industry skills"
  ON public.industry_skills
  FOR SELECT
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_industry_skills_industry ON public.industry_skills(industry);
CREATE INDEX idx_industry_skills_skill_name ON public.industry_skills(skill_name);

-- Add industry column to talent_skills
ALTER TABLE public.talent_skills ADD COLUMN IF NOT EXISTS industry text;

-- Create talent_job_matches table
CREATE TABLE IF NOT EXISTS public.talent_job_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES auth.users(id),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  match_score integer NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  match_reasoning text NOT NULL,
  skills_matched text[] DEFAULT '{}',
  skills_missing text[] DEFAULT '{}',
  certifications_matched text[] DEFAULT '{}',
  certifications_missing text[] DEFAULT '{}',
  experience_fit text CHECK (experience_fit IN ('under_qualified', 'good_fit', 'over_qualified')),
  location_score integer CHECK (location_score >= 0 AND location_score <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz,
  talent_viewed_at timestamptz,
  talent_interested boolean,
  company_viewed_at timestamptz,
  UNIQUE(talent_id, job_id)
);

-- Enable RLS
ALTER TABLE public.talent_job_matches ENABLE ROW LEVEL SECURITY;

-- Companies can view matches for their jobs
CREATE POLICY "Companies can view matches for their jobs"
  ON public.talent_job_matches
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT company_profiles.user_id
      FROM company_profiles
      JOIN jobs ON jobs.company_id = company_profiles.id
      WHERE jobs.id = talent_job_matches.job_id
    )
    OR auth.uid() IN (
      SELECT company_users.user_id
      FROM company_users
      JOIN jobs ON jobs.company_id = company_users.company_id
      WHERE jobs.id = talent_job_matches.job_id
    )
  );

-- Talents can view their own matches
CREATE POLICY "Talents can view own matches"
  ON public.talent_job_matches
  FOR SELECT
  USING (auth.uid() = talent_id);

-- Talents can update their interest
CREATE POLICY "Talents can update own match interest"
  ON public.talent_job_matches
  FOR UPDATE
  USING (auth.uid() = talent_id);

-- Create matching_preferences table
CREATE TABLE IF NOT EXISTS public.matching_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  min_match_score integer DEFAULT 70 CHECK (min_match_score >= 0 AND min_match_score <= 100),
  auto_notify_talents boolean DEFAULT true,
  max_distance_km integer,
  required_certifications_strict boolean DEFAULT false,
  preferred_experience_levels text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE public.matching_preferences ENABLE ROW LEVEL SECURITY;

-- Companies can manage their own preferences
CREATE POLICY "Companies can manage own preferences"
  ON public.matching_preferences
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM company_profiles WHERE id = matching_preferences.company_id
    )
    OR auth.uid() IN (
      SELECT user_id FROM company_users 
      WHERE company_id = matching_preferences.company_id 
      AND role IN ('admin', 'manager')
    )
  );

-- Create match_notifications table
CREATE TABLE IF NOT EXISTS public.match_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.talent_job_matches(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id),
  notification_type text NOT NULL CHECK (notification_type IN ('new_match', 'talent_interested', 'company_viewed')),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.match_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.match_notifications
  FOR SELECT
  USING (auth.uid() = recipient_id);

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.match_notifications
  FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Create indexes for performance
CREATE INDEX idx_talent_job_matches_talent_id ON public.talent_job_matches(talent_id);
CREATE INDEX idx_talent_job_matches_job_id ON public.talent_job_matches(job_id);
CREATE INDEX idx_talent_job_matches_score ON public.talent_job_matches(match_score DESC);
CREATE INDEX idx_match_notifications_recipient ON public.match_notifications(recipient_id, read_at);

-- Create trigger for updated_at on matching_preferences
CREATE TRIGGER update_matching_preferences_updated_at
  BEFORE UPDATE ON public.matching_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert predefined industry skills
-- Offshore
INSERT INTO public.industry_skills (skill_name, industry, skill_type, description) VALUES
('ROV Operations', 'offshore', 'technical', 'Remotely Operated Vehicle operations'),
('Dynamic Positioning', 'offshore', 'technical', 'DP system operations and control'),
('Subsea Engineering', 'offshore', 'technical', 'Subsea systems and equipment'),
('Crane Operations', 'offshore', 'technical', 'Offshore crane operations'),
('Deck Management', 'offshore', 'technical', 'Offshore deck operations'),
('Marine Navigation', 'offshore', 'technical', 'Navigation and positioning'),
('BOSIET', 'offshore', 'certification', 'Basic Offshore Safety Induction and Emergency Training'),
('HUET', 'offshore', 'certification', 'Helicopter Underwater Escape Training'),
('GWO Basic Safety Training', 'offshore', 'certification', 'Global Wind Organisation safety training'),
('Offshore Medical Certificate', 'offshore', 'certification', 'Medical fitness for offshore work'),
('STCW 95', 'offshore', 'certification', 'Standards of Training, Certification and Watchkeeping'),
('Confined Space Entry', 'offshore', 'safety', 'Confined space work procedures'),
('Fire Fighting', 'offshore', 'safety', 'Offshore firefighting training'),
('Sea Survival', 'offshore', 'safety', 'Sea survival techniques'),
('AVEVA Marine', 'offshore', 'software', 'Marine design software'),
('AutoCAD', 'offshore', 'software', 'CAD software'),
('Navisworks', 'offshore', 'software', '3D design review software');

-- Oil & Gas
INSERT INTO public.industry_skills (skill_name, industry, skill_type, description) VALUES
('Well Control', 'oil_gas', 'technical', 'Well control operations'),
('Reservoir Engineering', 'oil_gas', 'technical', 'Reservoir analysis and management'),
('Process Engineering', 'oil_gas', 'technical', 'Process design and optimization'),
('Production Optimization', 'oil_gas', 'technical', 'Production enhancement'),
('Pipeline Operations', 'oil_gas', 'technical', 'Pipeline management'),
('Completions', 'oil_gas', 'technical', 'Well completion operations'),
('IADC WellCAP', 'oil_gas', 'certification', 'Well control certification'),
('IWCF Well Control', 'oil_gas', 'certification', 'International well control forum certification'),
('H2S Safety', 'oil_gas', 'certification', 'Hydrogen sulfide safety training'),
('OSHA 30', 'oil_gas', 'certification', 'OSHA 30-hour safety training'),
('API Certifications', 'oil_gas', 'certification', 'American Petroleum Institute certifications'),
('Blowout Prevention', 'oil_gas', 'safety', 'BOP operations and safety'),
('Gas Detection', 'oil_gas', 'safety', 'Gas detection systems'),
('Emergency Response', 'oil_gas', 'safety', 'Emergency response procedures'),
('Process Safety Management', 'oil_gas', 'safety', 'PSM procedures'),
('Petrel', 'oil_gas', 'software', 'Reservoir modeling software'),
('OLGA', 'oil_gas', 'software', 'Multiphase flow simulator'),
('Prosper', 'oil_gas', 'software', 'Well performance software'),
('Pipesim', 'oil_gas', 'software', 'Pipeline simulation software');

-- Foundation
INSERT INTO public.industry_skills (skill_name, industry, skill_type, description) VALUES
('Rotary Drilling', 'foundation', 'technical', 'Rotary drilling methods'),
('Auger Drilling', 'foundation', 'technical', 'Auger drilling techniques'),
('Casing Installation', 'foundation', 'technical', 'Casing and grouting'),
('Soil Sampling', 'foundation', 'technical', 'Soil sample collection'),
('Grouting', 'foundation', 'technical', 'Grouting operations'),
('Pile Foundation', 'foundation', 'technical', 'Pile installation'),
('NCDOT Driller Certification', 'foundation', 'certification', 'State driller certification'),
('CPD Certified Professional Driller', 'foundation', 'certification', 'Professional driller certification'),
('Pile Driving Certification', 'foundation', 'certification', 'Pile driving qualification'),
('Excavation Safety', 'foundation', 'safety', 'Excavation and trenching safety'),
('Crane Signal Person', 'foundation', 'safety', 'Crane signaling certification'),
('Hydraulic Drill Rigs', 'foundation', 'equipment', 'Hydraulic rig operations'),
('Core Drilling Equipment', 'foundation', 'equipment', 'Core drilling tools'),
('SPT Equipment', 'foundation', 'equipment', 'Standard Penetration Test equipment');

-- Prospecting
INSERT INTO public.industry_skills (skill_name, industry, skill_type, description) VALUES
('Geological Mapping', 'prospecting', 'technical', 'Geological survey and mapping'),
('Core Sampling', 'prospecting', 'technical', 'Core sample extraction'),
('Geochemical Analysis', 'prospecting', 'technical', 'Geochemical testing'),
('Geophysical Surveys', 'prospecting', 'technical', 'Geophysical exploration'),
('Resource Estimation', 'prospecting', 'technical', 'Resource modeling'),
('CPG Certified Professional Geologist', 'prospecting', 'certification', 'Geologist certification'),
('PG License', 'prospecting', 'certification', 'Professional geologist license'),
('Mine Safety Certification', 'prospecting', 'certification', 'Mining safety training'),
('Remote Site Safety', 'prospecting', 'safety', 'Remote location safety'),
('Wildlife Awareness', 'prospecting', 'safety', 'Wildlife safety training'),
('First Aid Wilderness', 'prospecting', 'safety', 'Wilderness first aid'),
('ArcGIS', 'prospecting', 'software', 'GIS mapping software'),
('Leapfrog', 'prospecting', 'software', '3D geological modeling'),
('Micromine', 'prospecting', 'software', 'Mining software'),
('Surpac', 'prospecting', 'software', 'Mine planning software');

-- Mining
INSERT INTO public.industry_skills (skill_name, industry, skill_type, description) VALUES
('Underground Mining', 'mining', 'technical', 'Underground mining operations'),
('Open Pit Operations', 'mining', 'technical', 'Open pit mining'),
('Blasting', 'mining', 'technical', 'Blasting operations'),
('Mine Planning', 'mining', 'technical', 'Mine design and planning'),
('Ore Processing', 'mining', 'technical', 'Ore processing methods'),
('Ventilation', 'mining', 'technical', 'Mine ventilation systems'),
('MSHA Certification', 'mining', 'certification', 'Mine Safety and Health Administration'),
('Blasting License', 'mining', 'certification', 'Explosives handling license'),
('Mine Surveyor License', 'mining', 'certification', 'Mine surveying qualification'),
('First Class Mine Manager', 'mining', 'certification', 'Mine manager certification'),
('Ground Control', 'mining', 'safety', 'Ground control procedures'),
('Electrical Safety Underground', 'mining', 'safety', 'Underground electrical safety'),
('Explosive Handling', 'mining', 'safety', 'Explosives safety'),
('LHD Operations', 'mining', 'equipment', 'Load-Haul-Dump operations'),
('Continuous Miners', 'mining', 'equipment', 'Continuous miner operations'),
('Roof Bolters', 'mining', 'equipment', 'Roof bolting equipment'),
('Rock Drills', 'mining', 'equipment', 'Rock drilling equipment');

-- Construction
INSERT INTO public.industry_skills (skill_name, industry, skill_type, description) VALUES
('Concrete Work', 'construction', 'technical', 'Concrete placement and finishing'),
('Steel Fabrication', 'construction', 'technical', 'Steel fabrication and erection'),
('Heavy Equipment Operation', 'construction', 'technical', 'Heavy machinery operations'),
('Project Scheduling', 'construction', 'technical', 'Construction scheduling'),
('Site Management', 'construction', 'technical', 'Construction site management'),
('OSHA 30', 'construction', 'certification', 'OSHA 30-hour construction'),
('NCCER Certifications', 'construction', 'certification', 'NCCER craft certifications'),
('CCM Certified Construction Manager', 'construction', 'certification', 'Construction management certification'),
('PMP', 'construction', 'certification', 'Project Management Professional'),
('Fall Protection', 'construction', 'safety', 'Fall protection systems'),
('Scaffold Safety', 'construction', 'safety', 'Scaffolding safety'),
('Trenching Excavation', 'construction', 'safety', 'Trenching and excavation safety'),
('Rigging Signaling', 'construction', 'safety', 'Rigging and crane signaling'),
('Procore', 'construction', 'software', 'Construction management software'),
('BIM 360', 'construction', 'software', 'Building Information Modeling'),
('MS Project', 'construction', 'software', 'Project management software'),
('Primavera P6', 'construction', 'software', 'Project scheduling software');

-- Geotechnical
INSERT INTO public.industry_skills (skill_name, industry, skill_type, description) VALUES
('Soil Testing', 'geotechnical', 'technical', 'Laboratory soil testing'),
('Rock Mechanics', 'geotechnical', 'technical', 'Rock mechanics analysis'),
('Slope Stability Analysis', 'geotechnical', 'technical', 'Slope stability assessment'),
('Foundation Design', 'geotechnical', 'technical', 'Foundation engineering'),
('CPT SPT Testing', 'geotechnical', 'technical', 'Cone and standard penetration testing'),
('PE Geotechnical', 'geotechnical', 'certification', 'Professional Engineer license'),
('NICET Level III', 'geotechnical', 'certification', 'Engineering technician certification'),
('ACI Field Testing', 'geotechnical', 'certification', 'Concrete field testing'),
('Lab Safety', 'geotechnical', 'safety', 'Laboratory safety procedures'),
('Field Testing Safety', 'geotechnical', 'safety', 'Field testing safety'),
('PLAXIS', 'geotechnical', 'software', 'Geotechnical analysis software'),
('GeoStudio', 'geotechnical', 'software', 'Geotechnical modeling'),
('SLOPE/W', 'geotechnical', 'software', 'Slope stability software'),
('RocScience', 'geotechnical', 'software', 'Rock engineering software');
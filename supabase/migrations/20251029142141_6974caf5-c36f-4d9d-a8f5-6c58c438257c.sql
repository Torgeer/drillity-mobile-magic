-- 1. User Preferences Tabell
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  language text DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
ON user_preferences FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
ON user_preferences FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON user_preferences FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 2. Uppdatera Profiles Tabell
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS open_to_international boolean DEFAULT false;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_visibility text DEFAULT 'public' 
CHECK (profile_visibility IN ('public', 'private', 'connections_only'));

-- 3. Conversations Tabell för Messaging
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE NOT NULL,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(talent_id, company_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
ON conversations FOR SELECT
TO authenticated
USING (
  auth.uid() = talent_id 
  OR auth.uid() IN (SELECT user_id FROM company_profiles WHERE id = company_id)
);

-- 4. Trigger för Profile Analytics
CREATE OR REPLACE FUNCTION increment_profile_view()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profile_analytics (talent_id, date, profile_views)
  VALUES (NEW.talent_id, CURRENT_DATE, 1)
  ON CONFLICT (talent_id, date) 
  DO UPDATE SET profile_views = profile_analytics.profile_views + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_viewed ON profile_views;
CREATE TRIGGER on_profile_viewed
AFTER INSERT ON profile_views
FOR EACH ROW
EXECUTE FUNCTION increment_profile_view();

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_applications_talent ON applications(talent_id);
CREATE INDEX IF NOT EXISTS idx_applications_company ON applications(company_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_talent ON profile_views(talent_id);
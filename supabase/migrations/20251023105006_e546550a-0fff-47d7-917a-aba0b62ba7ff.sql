-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('cv-documents', 'cv-documents', false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('company-logos', 'company-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('profile-avatars', 'profile-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Storage policies for CV documents (private, only talent and companies in application can access)
CREATE POLICY "Talent can upload own CV" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'cv-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Talent can read own CV" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'cv-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Companies can read CVs from applications" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'cv-documents' AND
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.company_profiles cp ON a.company_id = cp.id
      WHERE cp.user_id = auth.uid()
        AND a.cv_url = storage.objects.name
    )
  );

-- Storage policies for company logos (public)
CREATE POLICY "Anyone can view company logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'company-logos');

CREATE POLICY "Companies can upload own logo" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'company-logos' AND
    EXISTS (
      SELECT 1 FROM public.company_profiles
      WHERE user_id = auth.uid()
        AND id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Companies can update own logo" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'company-logos' AND
    EXISTS (
      SELECT 1 FROM public.company_profiles
      WHERE user_id = auth.uid()
        AND id::text = (storage.foldername(name))[1]
    )
  );

-- Storage policies for profile avatars (public)
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
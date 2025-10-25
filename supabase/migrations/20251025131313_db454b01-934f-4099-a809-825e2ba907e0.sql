-- Create company_news table
CREATE TABLE public.company_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_news ENABLE ROW LEVEL SECURITY;

-- Anyone can view published news
CREATE POLICY "Anyone can view published news"
ON public.company_news
FOR SELECT
USING (published = true);

-- Companies can create their own news
CREATE POLICY "Companies can create own news"
ON public.company_news
FOR INSERT
WITH CHECK (
  (auth.uid() IN (
    SELECT user_id FROM company_profiles WHERE id = company_news.company_id
  )) OR 
  (auth.uid() IN (
    SELECT user_id FROM company_users 
    WHERE company_id = company_news.company_id 
    AND role IN ('admin', 'manager')
  ))
);

-- Companies can update their own news
CREATE POLICY "Companies can update own news"
ON public.company_news
FOR UPDATE
USING (
  (auth.uid() IN (
    SELECT user_id FROM company_profiles WHERE id = company_news.company_id
  )) OR 
  (auth.uid() IN (
    SELECT user_id FROM company_users 
    WHERE company_id = company_news.company_id 
    AND role IN ('admin', 'manager')
  ))
);

-- Companies can delete their own news
CREATE POLICY "Companies can delete own news"
ON public.company_news
FOR DELETE
USING (
  (auth.uid() IN (
    SELECT user_id FROM company_profiles WHERE id = company_news.company_id
  )) OR 
  (auth.uid() IN (
    SELECT user_id FROM company_users 
    WHERE company_id = company_news.company_id 
    AND role = 'admin'
  ))
);

-- Add trigger for updated_at
CREATE TRIGGER update_company_news_updated_at
  BEFORE UPDATE ON public.company_news
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
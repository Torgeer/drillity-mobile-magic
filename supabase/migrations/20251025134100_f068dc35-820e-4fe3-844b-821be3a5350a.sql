-- Create contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  equipment_needed TEXT,
  duration TEXT,
  start_date DATE,
  budget_range TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Anyone can view open contracts
CREATE POLICY "Anyone can view open contracts"
ON public.contracts
FOR SELECT
USING (status = 'open' OR auth.uid() IN (
  SELECT user_id FROM company_profiles WHERE id = contracts.company_id
) OR auth.uid() IN (
  SELECT user_id FROM company_users WHERE company_id = contracts.company_id
));

-- Companies can create contracts
CREATE POLICY "Companies can create contracts"
ON public.contracts
FOR INSERT
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM company_profiles WHERE id = contracts.company_id
) OR auth.uid() IN (
  SELECT user_id FROM company_users WHERE company_id = contracts.company_id AND role IN ('admin', 'manager')
));

-- Companies can update own contracts
CREATE POLICY "Companies can update own contracts"
ON public.contracts
FOR UPDATE
USING (auth.uid() IN (
  SELECT user_id FROM company_profiles WHERE id = contracts.company_id
) OR auth.uid() IN (
  SELECT user_id FROM company_users WHERE company_id = contracts.company_id AND role IN ('admin', 'manager')
));

-- Companies can delete own contracts
CREATE POLICY "Companies can delete own contracts"
ON public.contracts
FOR DELETE
USING (auth.uid() IN (
  SELECT user_id FROM company_profiles WHERE id = contracts.company_id
) OR auth.uid() IN (
  SELECT user_id FROM company_users WHERE company_id = contracts.company_id AND role = 'admin'
));

-- Create contract_responses table
CREATE TABLE public.contract_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL,
  company_id UUID NOT NULL,
  message TEXT NOT NULL,
  price_offer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_responses ENABLE ROW LEVEL SECURITY;

-- Contract owner and responder can view responses
CREATE POLICY "Contract parties can view responses"
ON public.contract_responses
FOR SELECT
USING (
  auth.uid() IN (SELECT user_id FROM company_profiles WHERE id = contract_responses.company_id)
  OR auth.uid() IN (SELECT user_id FROM company_users WHERE company_id = contract_responses.company_id)
  OR auth.uid() IN (
    SELECT cp.user_id FROM company_profiles cp
    JOIN contracts c ON c.company_id = cp.id
    WHERE c.id = contract_responses.contract_id
  )
  OR auth.uid() IN (
    SELECT cu.user_id FROM company_users cu
    JOIN contracts c ON c.company_id = cu.company_id
    WHERE c.id = contract_responses.contract_id
  )
);

-- Companies can create responses
CREATE POLICY "Companies can create responses"
ON public.contract_responses
FOR INSERT
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM company_profiles WHERE id = contract_responses.company_id
) OR auth.uid() IN (
  SELECT user_id FROM company_users WHERE company_id = contract_responses.company_id
));

-- Companies can update own responses
CREATE POLICY "Companies can update own responses"
ON public.contract_responses
FOR UPDATE
USING (auth.uid() IN (
  SELECT user_id FROM company_profiles WHERE id = contract_responses.company_id
) OR auth.uid() IN (
  SELECT user_id FROM company_users WHERE company_id = contract_responses.company_id AND role IN ('admin', 'manager')
));

-- Create storage bucket for contract attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('contract-files', 'contract-files', false);

-- Contract attachments storage policies
CREATE POLICY "Companies can upload contract files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'contract-files'
  AND auth.uid() IN (SELECT user_id FROM company_profiles)
);

CREATE POLICY "Anyone can view contract files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'contract-files');

-- Add trigger for updated_at
CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contract_responses_updated_at
BEFORE UPDATE ON public.contract_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
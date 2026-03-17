
-- Add credit_balance column to companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS credit_balance numeric NOT NULL DEFAULT 0;

-- Create company_pattern_codes table for company-specific pattern locks
CREATE TABLE public.company_pattern_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  pattern_code text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

ALTER TABLE public.company_pattern_codes ENABLE ROW LEVEL SECURITY;

-- Admins can manage all pattern codes
CREATE POLICY "Admins can manage company patterns"
  ON public.company_pattern_codes FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Company owners can view/update their own pattern
CREATE POLICY "Company owners can view own pattern"
  ON public.company_pattern_codes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = company_pattern_codes.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Company owners can update own pattern"
  ON public.company_pattern_codes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = company_pattern_codes.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

-- Anyone can view pattern codes (needed for login verification before auth)
CREATE POLICY "Public can view patterns for login"
  ON public.company_pattern_codes FOR SELECT
  TO anon
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_company_pattern_codes_updated_at
  BEFORE UPDATE ON public.company_pattern_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Also add a policy so company owners can SELECT their own company
CREATE POLICY "Company owners can view own company"
  ON public.companies FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid() OR is_verified = true OR has_role(auth.uid(), 'admin'::app_role));

-- Company owners can update their own company
CREATE POLICY "Company owners can update own company"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid());

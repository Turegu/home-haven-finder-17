
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view verified companies" ON public.companies;

-- Create new policy that allows anyone to view ALL companies
CREATE POLICY "Anyone can view all companies"
  ON public.companies
  FOR SELECT
  USING (true);

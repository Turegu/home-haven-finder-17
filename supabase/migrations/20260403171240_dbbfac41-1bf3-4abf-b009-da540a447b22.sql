
-- 1. Create security definer function to check if user is agent of a company (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_agent_of_company(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agents
    WHERE company_id = p_company_id
      AND user_id = auth.uid()
  )
$$;

-- 2. Create security definer function to check if company is verified (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_company_verified(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = p_company_id
      AND is_verified = true
  )
$$;

-- 3. Fix companies policy: drop the self-referencing agents subquery policy
DROP POLICY IF EXISTS "agents_read_own_company" ON public.companies;

CREATE POLICY "agents_read_own_company"
ON public.companies
FOR SELECT
TO authenticated
USING (public.is_agent_of_company(id));

-- 4. Fix agents policy: drop the companies-referencing policy and use the definer function
DROP POLICY IF EXISTS "agents_public_select" ON public.agents;

CREATE POLICY "agents_public_select"
ON public.agents
FOR SELECT
USING (public.is_company_verified(company_id));

-- 5. Also fix "Company owners can view own agents" to avoid the cycle
DROP POLICY IF EXISTS "Company owners can view own agents" ON public.agents;

CREATE POLICY "Company owners can view own agents"
ON public.agents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id = agents.company_id
      AND companies.owner_user_id = auth.uid()
  )
);

-- Actually the above still references companies from agents. Let's use a function instead.
DROP POLICY IF EXISTS "Company owners can view own agents" ON public.agents;

-- Create helper for company ownership check
CREATE OR REPLACE FUNCTION public.owns_company(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = p_company_id
      AND owner_user_id = auth.uid()
  )
$$;

CREATE POLICY "Company owners can view own agents"
ON public.agents
FOR SELECT
TO authenticated
USING (public.owns_company(company_id));

-- Also fix "Company owners can update own agents"
DROP POLICY IF EXISTS "Company owners can update own agents" ON public.agents;

CREATE POLICY "Company owners can update own agents"
ON public.agents
FOR UPDATE
TO authenticated
USING (public.owns_company(company_id));

-- Also fix "Company owners can insert agents"
DROP POLICY IF EXISTS "Company owners can insert agents" ON public.agents;

CREATE POLICY "Company owners can insert agents"
ON public.agents
FOR INSERT
TO authenticated
WITH CHECK (public.owns_company(company_id) OR has_role(auth.uid(), 'admin'));

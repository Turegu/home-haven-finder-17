-- Allow company owners to see their own properties (including drafts)
CREATE POLICY "Company owners can view own properties"
ON public.properties
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = properties.company_id
      AND companies.owner_user_id = auth.uid()
  )
);

-- Allow company owners to see their own projects (including drafts)
CREATE POLICY "Company owners can view own projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = projects.company_id
      AND companies.owner_user_id = auth.uid()
  )
);
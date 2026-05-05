CREATE OR REPLACE FUNCTION public.can_access_company_listing(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.owns_company(p_company_id)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.agents
      WHERE agents.company_id = p_company_id
        AND agents.user_id = auth.uid()
        AND agents.status IN ('active', 'pending')
        AND agents.user_id IS NOT NULL
    )
$$;

DROP POLICY IF EXISTS "company_members_can_view_own_properties" ON public.properties;
CREATE POLICY "company_members_can_view_own_properties"
ON public.properties
FOR SELECT
TO authenticated
USING (public.can_access_company_listing(company_id));

DROP POLICY IF EXISTS "company_members_can_view_own_projects" ON public.projects;
CREATE POLICY "company_members_can_view_own_projects"
ON public.projects
FOR SELECT
TO authenticated
USING (public.can_access_company_listing(company_id));

DROP POLICY IF EXISTS "company_members_can_view_own_events" ON public.events;
CREATE POLICY "company_members_can_view_own_events"
ON public.events
FOR SELECT
TO authenticated
USING (public.can_access_company_listing(company_id));
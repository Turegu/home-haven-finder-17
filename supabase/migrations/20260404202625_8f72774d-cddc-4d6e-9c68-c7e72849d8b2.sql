
-- =============================================================
-- COMPANY_INBOX: Replace inline checks with SECURITY DEFINER helpers
-- =============================================================
DROP POLICY IF EXISTS "Company owners can view own inbox" ON public.company_inbox;
DROP POLICY IF EXISTS "Agents can view assigned inbox items" ON public.company_inbox;
DROP POLICY IF EXISTS "Company owners can update own inbox" ON public.company_inbox;
DROP POLICY IF EXISTS "Agents can update assigned inbox items" ON public.company_inbox;
DROP POLICY IF EXISTS "Company owners can delete own inbox" ON public.company_inbox;

CREATE POLICY "Company owners can view own inbox" ON public.company_inbox
  FOR SELECT TO authenticated
  USING (owns_company(company_id));

CREATE POLICY "Agents can view company inbox" ON public.company_inbox
  FOR SELECT TO authenticated
  USING (is_agent_of_company(company_id));

CREATE POLICY "Company owners can update own inbox" ON public.company_inbox
  FOR UPDATE TO authenticated
  USING (owns_company(company_id));

CREATE POLICY "Agents can update company inbox" ON public.company_inbox
  FOR UPDATE TO authenticated
  USING (is_agent_of_company(company_id));

CREATE POLICY "Company owners can delete own inbox" ON public.company_inbox
  FOR DELETE TO authenticated
  USING (owns_company(company_id));

-- =============================================================
-- PROPERTIES: Replace inline checks with helpers
-- =============================================================
DROP POLICY IF EXISTS "Company owners can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Agents can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Company owners can delete own properties" ON public.properties;
DROP POLICY IF EXISTS "Agents can delete own properties" ON public.properties;
DROP POLICY IF EXISTS "Company owners can view own properties" ON public.properties;
DROP POLICY IF EXISTS "Agents can view own properties" ON public.properties;
DROP POLICY IF EXISTS "Company owners can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Agents can insert own properties" ON public.properties;

CREATE POLICY "Company owners can view own properties" ON public.properties
  FOR SELECT TO authenticated USING (owns_company(company_id));

CREATE POLICY "Agents can view company properties" ON public.properties
  FOR SELECT TO authenticated USING (is_agent_of_company(company_id));

CREATE POLICY "Company owners can insert properties" ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (owns_company(company_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can insert company properties" ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (is_agent_of_company(company_id));

CREATE POLICY "Company owners can update own properties" ON public.properties
  FOR UPDATE TO authenticated USING (owns_company(company_id));

CREATE POLICY "Agents can update company properties" ON public.properties
  FOR UPDATE TO authenticated USING (is_agent_of_company(company_id));

CREATE POLICY "Company owners can delete own properties" ON public.properties
  FOR DELETE TO authenticated USING (owns_company(company_id));

CREATE POLICY "Agents can delete company properties" ON public.properties
  FOR DELETE TO authenticated USING (is_agent_of_company(company_id));

-- =============================================================
-- PROJECTS: Replace inline checks with helpers + add agent policies
-- =============================================================
DROP POLICY IF EXISTS "Company owners can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Company owners can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Company owners can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Company owners can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Agents can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Agents can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Agents can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Agents can delete own projects" ON public.projects;

CREATE POLICY "Company owners can view own projects" ON public.projects
  FOR SELECT TO authenticated USING (owns_company(company_id));

CREATE POLICY "Agents can view company projects" ON public.projects
  FOR SELECT TO authenticated USING (is_agent_of_company(company_id));

CREATE POLICY "Company owners can insert projects" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (owns_company(company_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can insert company projects" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (is_agent_of_company(company_id));

CREATE POLICY "Company owners can update own projects" ON public.projects
  FOR UPDATE TO authenticated USING (owns_company(company_id));

CREATE POLICY "Agents can update company projects" ON public.projects
  FOR UPDATE TO authenticated USING (is_agent_of_company(company_id));

CREATE POLICY "Company owners can delete own projects" ON public.projects
  FOR DELETE TO authenticated USING (owns_company(company_id));

CREATE POLICY "Agents can delete company projects" ON public.projects
  FOR DELETE TO authenticated USING (is_agent_of_company(company_id));

-- =============================================================
-- EVENTS: Replace inline checks with helpers + add agent policies
-- =============================================================
DROP POLICY IF EXISTS "Company owners can update own events" ON public.events;
DROP POLICY IF EXISTS "Company owners can delete own events" ON public.events;
DROP POLICY IF EXISTS "Company owners can view own events" ON public.events;
DROP POLICY IF EXISTS "Company owners can insert events" ON public.events;
DROP POLICY IF EXISTS "Agents can view own events" ON public.events;
DROP POLICY IF EXISTS "Agents can insert own events" ON public.events;
DROP POLICY IF EXISTS "Agents can update own events" ON public.events;
DROP POLICY IF EXISTS "Agents can delete own events" ON public.events;

CREATE POLICY "Company owners can view own events" ON public.events
  FOR SELECT TO authenticated USING (owns_company(company_id));

CREATE POLICY "Agents can view company events" ON public.events
  FOR SELECT TO authenticated USING (is_agent_of_company(company_id));

CREATE POLICY "Company owners can insert events" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (owns_company(company_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can insert company events" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (is_agent_of_company(company_id));

CREATE POLICY "Company owners can update own events" ON public.events
  FOR UPDATE TO authenticated USING (owns_company(company_id));

CREATE POLICY "Agents can update company events" ON public.events
  FOR UPDATE TO authenticated USING (is_agent_of_company(company_id));

CREATE POLICY "Company owners can delete own events" ON public.events
  FOR DELETE TO authenticated USING (owns_company(company_id));

CREATE POLICY "Agents can delete company events" ON public.events
  FOR DELETE TO authenticated USING (is_agent_of_company(company_id));

-- =============================================================
-- AGENTS: Tighten UPDATE/DELETE with helpers
-- =============================================================
DROP POLICY IF EXISTS "Company owners can update own agents" ON public.agents;
DROP POLICY IF EXISTS "Agents can update own profile" ON public.agents;

CREATE POLICY "Company owners can update own agents" ON public.agents
  FOR UPDATE TO authenticated USING (owns_company(company_id));

CREATE POLICY "Agents can update own profile" ON public.agents
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Add explicit DELETE policies for agents
DROP POLICY IF EXISTS "Company owners can delete own agents" ON public.agents;
CREATE POLICY "Company owners can delete own agents" ON public.agents
  FOR DELETE TO authenticated USING (owns_company(company_id));

CREATE POLICY "Admins can delete agents" ON public.agents
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update agents" ON public.agents
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

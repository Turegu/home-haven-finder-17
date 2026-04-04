DROP POLICY IF EXISTS "Company owners can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Agents can update company properties" ON public.properties;
DROP POLICY IF EXISTS "company_members_can_update_property" ON public.properties;
DROP POLICY IF EXISTS "owners_and_agents_update_property" ON public.properties;
CREATE POLICY "owners_and_agents_update_property" ON public.properties FOR UPDATE TO authenticated USING (auth.uid() = (SELECT owner_user_id FROM public.companies WHERE id = company_id) OR auth.uid() IN (SELECT user_id FROM public.agents WHERE company_id = properties.company_id AND status = 'active' AND user_id IS NOT NULL)) WITH CHECK (auth.uid() = (SELECT owner_user_id FROM public.companies WHERE id = company_id) OR auth.uid() IN (SELECT user_id FROM public.agents WHERE company_id = properties.company_id AND status = 'active' AND user_id IS NOT NULL));

DROP POLICY IF EXISTS "Company owners can delete own properties" ON public.properties;
DROP POLICY IF EXISTS "Agents can delete company properties" ON public.properties;
DROP POLICY IF EXISTS "owners_and_agents_delete_property" ON public.properties;
CREATE POLICY "owners_and_agents_delete_property" ON public.properties FOR DELETE TO authenticated USING (auth.uid() = (SELECT owner_user_id FROM public.companies WHERE id = company_id) OR auth.uid() IN (SELECT user_id FROM public.agents WHERE company_id = properties.company_id AND status = 'active' AND user_id IS NOT NULL));

DROP POLICY IF EXISTS "Company owners can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Agents can update company projects" ON public.projects;
DROP POLICY IF EXISTS "owners_and_agents_update_project" ON public.projects;
CREATE POLICY "owners_and_agents_update_project" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = (SELECT owner_user_id FROM public.companies WHERE id = company_id) OR auth.uid() IN (SELECT user_id FROM public.agents WHERE company_id = projects.company_id AND status = 'active' AND user_id IS NOT NULL)) WITH CHECK (auth.uid() = (SELECT owner_user_id FROM public.companies WHERE id = company_id) OR auth.uid() IN (SELECT user_id FROM public.agents WHERE company_id = projects.company_id AND status = 'active' AND user_id IS NOT NULL));

DROP POLICY IF EXISTS "Company owners can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Agents can delete company projects" ON public.projects;
DROP POLICY IF EXISTS "owners_and_agents_delete_project" ON public.projects;
CREATE POLICY "owners_and_agents_delete_project" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = (SELECT owner_user_id FROM public.companies WHERE id = company_id) OR auth.uid() IN (SELECT user_id FROM public.agents WHERE company_id = projects.company_id AND status = 'active' AND user_id IS NOT NULL));

DROP POLICY IF EXISTS "Company owners can update own events" ON public.events;
DROP POLICY IF EXISTS "owners_and_agents_update_event" ON public.events;
CREATE POLICY "owners_and_agents_update_event" ON public.events FOR UPDATE TO authenticated USING (auth.uid() = (SELECT owner_user_id FROM public.companies WHERE id = company_id) OR auth.uid() IN (SELECT user_id FROM public.agents WHERE company_id = events.company_id AND status = 'active' AND user_id IS NOT NULL)) WITH CHECK (auth.uid() = (SELECT owner_user_id FROM public.companies WHERE id = company_id) OR auth.uid() IN (SELECT user_id FROM public.agents WHERE company_id = events.company_id AND status = 'active' AND user_id IS NOT NULL));

DROP POLICY IF EXISTS "Company owners can delete own events" ON public.events;
DROP POLICY IF EXISTS "owners_and_agents_delete_event" ON public.events;
CREATE POLICY "owners_and_agents_delete_event" ON public.events FOR DELETE TO authenticated USING (auth.uid() = (SELECT owner_user_id FROM public.companies WHERE id = company_id) OR auth.uid() IN (SELECT user_id FROM public.agents WHERE company_id = events.company_id AND status = 'active' AND user_id IS NOT NULL));

DROP POLICY IF EXISTS "Company owners can view own inbox" ON public.company_inbox;
DROP POLICY IF EXISTS "Agents can view company inbox" ON public.company_inbox;
DROP POLICY IF EXISTS "company_members_can_read_inbox" ON public.company_inbox;
CREATE POLICY "company_members_can_read_inbox" ON public.company_inbox FOR SELECT TO authenticated USING (auth.uid() = (SELECT owner_user_id FROM public.companies WHERE id = company_id) OR auth.uid() IN (SELECT user_id FROM public.agents WHERE company_id = company_inbox.company_id AND status IN ('active','pending') AND user_id IS NOT NULL));
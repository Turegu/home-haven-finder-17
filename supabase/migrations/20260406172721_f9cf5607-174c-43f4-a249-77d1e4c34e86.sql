DROP POLICY IF EXISTS "Company owners can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Company owners can delete own properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can update properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can delete properties" ON public.properties;
DROP POLICY IF EXISTS "Company owners can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Company owners can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Company owners can update own events" ON public.events;
DROP POLICY IF EXISTS "Company owners can delete own events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
DROP POLICY IF EXISTS "Company owners can view own inbox" ON public.company_inbox;
DROP POLICY IF EXISTS "Agents can view company inbox" ON public.company_inbox;
DROP POLICY IF EXISTS "Allow authenticated users to read company_inbox" ON public.company_inbox;
DROP POLICY IF EXISTS "Enable read access for company members" ON public.company_inbox;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('properties','projects','events','company_inbox')
      AND cmd IN ('UPDATE','DELETE','SELECT')
      AND policyname NOT IN (
        'owners_and_agents_update_property',
        'owners_and_agents_delete_property',
        'owners_and_agents_update_project',
        'owners_and_agents_delete_project',
        'owners_and_agents_update_event',
        'owners_and_agents_delete_event',
        'company_members_can_read_inbox'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Server-side enforcement: BEFORE INSERT trigger to check membership limits
CREATE OR REPLACE FUNCTION public.enforce_membership_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company_id uuid;
  v_membership text;
  v_max_allowed int;
  v_current_count int;
  v_table_name text;
  v_max_column text;
  v_count_statuses text[];
BEGIN
  v_table_name := TG_TABLE_NAME;

  -- Get company_id from the new row
  v_company_id := NEW.company_id;
  IF v_company_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get company membership
  SELECT membership INTO v_membership FROM public.companies WHERE id = v_company_id;
  IF v_membership IS NULL THEN
    v_membership := 'basic';
  END IF;

  -- Determine the max column and count statuses based on table
  CASE v_table_name
    WHEN 'properties' THEN
      v_max_column := 'max_properties';
      v_count_statuses := ARRAY['active', 'draft'];
    WHEN 'projects' THEN
      v_max_column := 'max_projects';
      v_count_statuses := ARRAY['active', 'draft'];
    WHEN 'events' THEN
      v_max_column := 'max_events';
      v_count_statuses := ARRAY['active', 'draft'];
    WHEN 'agents' THEN
      v_max_column := 'max_agents';
      v_count_statuses := ARRAY['active', 'pending'];
    ELSE
      RETURN NEW;
  END CASE;

  -- Get limit from membership_packages
  EXECUTE format('SELECT %I FROM public.membership_packages WHERE package_type = $1', v_max_column)
    INTO v_max_allowed USING v_membership;

  -- Fallback defaults
  IF v_max_allowed IS NULL THEN
    CASE v_table_name
      WHEN 'agents' THEN v_max_allowed := 1;
      ELSE v_max_allowed := 1;
    END CASE;
  END IF;

  -- Count current active/draft (or active/pending for agents)
  EXECUTE format('SELECT count(*) FROM public.%I WHERE company_id = $1 AND status = ANY($2)', v_table_name)
    INTO v_current_count USING v_company_id, v_count_statuses;

  IF v_current_count >= v_max_allowed THEN
    RAISE EXCEPTION 'Membership limit reached: % allows max % % (current: %)',
      v_membership, v_max_allowed, v_table_name, v_current_count;
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers on all 4 tables
DROP TRIGGER IF EXISTS enforce_properties_limit ON public.properties;
CREATE TRIGGER enforce_properties_limit
  BEFORE INSERT ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.enforce_membership_limit();

DROP TRIGGER IF EXISTS enforce_projects_limit ON public.projects;
CREATE TRIGGER enforce_projects_limit
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.enforce_membership_limit();

DROP TRIGGER IF EXISTS enforce_events_limit ON public.events;
CREATE TRIGGER enforce_events_limit
  BEFORE INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.enforce_membership_limit();

DROP TRIGGER IF EXISTS enforce_agents_limit ON public.agents;
CREATE TRIGGER enforce_agents_limit
  BEFORE INSERT ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.enforce_membership_limit();

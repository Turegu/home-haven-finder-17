
-- Update admin_change_membership: agents use 'inactive' + downgraded_at (matching the existing pattern)
CREATE OR REPLACE FUNCTION public.admin_change_membership(p_company_id uuid, p_new_membership text, p_new_end_date timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_max_properties int;
  v_max_projects int;
  v_max_events int;
  v_max_agents int;
BEGIN
  UPDATE public.companies
  SET membership = p_new_membership::membership_type,
      package_end_date = p_new_end_date,
      updated_at = now()
  WHERE id = p_company_id;

  SELECT max_properties, max_projects, max_events, max_agents
  INTO v_max_properties, v_max_projects, v_max_events, v_max_agents
  FROM public.membership_packages
  WHERE package_type = p_new_membership;

  IF v_max_properties IS NULL THEN
    v_max_properties := 1; v_max_projects := 1; v_max_events := 1; v_max_agents := 1;
  END IF;

  UPDATE public.properties SET status = 'deactivated', downgraded_at = now(), updated_at = now()
  WHERE company_id = p_company_id AND status = 'active'
    AND id NOT IN (
      SELECT id FROM public.properties WHERE company_id = p_company_id AND status = 'active'
      ORDER BY created_at DESC LIMIT v_max_properties
    );

  UPDATE public.projects SET status = 'deactivated', downgraded_at = now(), updated_at = now()
  WHERE company_id = p_company_id AND status = 'active'
    AND id NOT IN (
      SELECT id FROM public.projects WHERE company_id = p_company_id AND status = 'active'
      ORDER BY created_at DESC LIMIT v_max_projects
    );

  UPDATE public.events SET status = 'deactivated', downgraded_at = now(), updated_at = now()
  WHERE company_id = p_company_id AND status = 'active'
    AND id NOT IN (
      SELECT id FROM public.events WHERE company_id = p_company_id AND status = 'active'
      ORDER BY created_at DESC LIMIT v_max_events
    );

  -- Soft-freeze excess agents: set inactive + downgraded_at
  UPDATE public.agents SET status = 'inactive', downgraded_at = now(), updated_at = now()
  WHERE company_id = p_company_id AND status IN ('active', 'pending')
    AND id NOT IN (
      SELECT id FROM public.agents WHERE company_id = p_company_id AND status IN ('active', 'pending')
      ORDER BY created_at DESC LIMIT v_max_agents
    );
END;
$function$;

-- Update downgrade_expired_memberships: agents use 'inactive' + downgraded_at
CREATE OR REPLACE FUNCTION public.downgrade_expired_memberships()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
  v_max_properties int;
  v_max_projects int;
  v_max_events int;
  v_max_agents int;
BEGIN
  SELECT max_properties, max_projects, max_events, max_agents
  INTO v_max_properties, v_max_projects, v_max_events, v_max_agents
  FROM public.membership_packages
  WHERE package_type = 'basic';

  IF v_max_properties IS NULL THEN
    v_max_properties := 1; v_max_projects := 1; v_max_events := 1; v_max_agents := 1;
  END IF;

  -- Non-basic companies with NO expiry date
  FOR r IN SELECT id FROM public.companies WHERE membership != 'basic' AND package_end_date IS NULL
  LOOP
    UPDATE public.properties SET status = 'deactivated', downgraded_at = now(), updated_at = now()
    WHERE company_id = r.id AND status = 'active'
      AND id NOT IN (
        SELECT id FROM public.properties WHERE company_id = r.id AND status = 'active'
        ORDER BY created_at DESC LIMIT v_max_properties
      );
    UPDATE public.projects SET status = 'deactivated', downgraded_at = now(), updated_at = now()
    WHERE company_id = r.id AND status = 'active'
      AND id NOT IN (
        SELECT id FROM public.projects WHERE company_id = r.id AND status = 'active'
        ORDER BY created_at DESC LIMIT v_max_projects
      );
    UPDATE public.events SET status = 'deactivated', downgraded_at = now(), updated_at = now()
    WHERE company_id = r.id AND status = 'active'
      AND id NOT IN (
        SELECT id FROM public.events WHERE company_id = r.id AND status = 'active'
        ORDER BY created_at DESC LIMIT v_max_events
      );
    UPDATE public.agents SET status = 'inactive', downgraded_at = now(), updated_at = now()
    WHERE company_id = r.id AND status IN ('active', 'pending')
      AND id NOT IN (
        SELECT id FROM public.agents WHERE company_id = r.id AND status IN ('active', 'pending')
        ORDER BY created_at DESC LIMIT v_max_agents
      );
    UPDATE public.companies SET membership = 'basic', updated_at = now() WHERE id = r.id;
  END LOOP;

  -- Companies with expired package_end_date
  FOR r IN SELECT id FROM public.companies WHERE package_end_date IS NOT NULL AND package_end_date < now() AND membership != 'basic'
  LOOP
    UPDATE public.properties SET status = 'deactivated', downgraded_at = now(), updated_at = now()
    WHERE company_id = r.id AND status = 'active'
      AND id NOT IN (
        SELECT id FROM public.properties WHERE company_id = r.id AND status = 'active'
        ORDER BY created_at DESC LIMIT v_max_properties
      );
    UPDATE public.projects SET status = 'deactivated', downgraded_at = now(), updated_at = now()
    WHERE company_id = r.id AND status = 'active'
      AND id NOT IN (
        SELECT id FROM public.projects WHERE company_id = r.id AND status = 'active'
        ORDER BY created_at DESC LIMIT v_max_projects
      );
    UPDATE public.events SET status = 'deactivated', downgraded_at = now(), updated_at = now()
    WHERE company_id = r.id AND status = 'active'
      AND id NOT IN (
        SELECT id FROM public.events WHERE company_id = r.id AND status = 'active'
        ORDER BY created_at DESC LIMIT v_max_events
      );
    UPDATE public.agents SET status = 'inactive', downgraded_at = now(), updated_at = now()
    WHERE company_id = r.id AND status IN ('active', 'pending')
      AND id NOT IN (
        SELECT id FROM public.agents WHERE company_id = r.id AND status IN ('active', 'pending')
        ORDER BY created_at DESC LIMIT v_max_agents
      );
    UPDATE public.companies SET membership = 'basic', updated_at = now() WHERE id = r.id;
  END LOOP;

  -- 90-day cleanup for all entity types
  DELETE FROM public.properties
  WHERE status = 'deactivated' AND downgraded_at IS NOT NULL AND downgraded_at < now() - interval '90 days';

  DELETE FROM public.project_units
  WHERE project_id IN (
    SELECT id FROM public.projects
    WHERE status = 'deactivated' AND downgraded_at IS NOT NULL AND downgraded_at < now() - interval '90 days'
  );

  DELETE FROM public.projects
  WHERE status = 'deactivated' AND downgraded_at IS NOT NULL AND downgraded_at < now() - interval '90 days';

  DELETE FROM public.events
  WHERE status = 'deactivated' AND downgraded_at IS NOT NULL AND downgraded_at < now() - interval '90 days';

  -- Agents: delete frozen agents after 90 days
  DELETE FROM public.agents
  WHERE status = 'inactive' AND downgraded_at IS NOT NULL AND downgraded_at < now() - interval '90 days';
END;
$function$;

-- Update enforce_membership_limit to also skip 'inactive' status inserts
CREATE OR REPLACE FUNCTION public.enforce_membership_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id uuid;
  v_membership text;
  v_max_allowed int;
  v_current_count int;
  v_table_name text;
  v_max_column text;
  v_count_statuses text[];
  v_new_status text;
BEGIN
  v_table_name := TG_TABLE_NAME;
  v_company_id := NEW.company_id;
  IF v_company_id IS NULL THEN
    RETURN NEW;
  END IF;

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

  -- Skip if inserting with a non-counted status (deactivated, inactive, etc.)
  v_new_status := NEW.status;
  IF v_new_status IS NOT NULL AND NOT (v_new_status = ANY(v_count_statuses)) THEN
    RETURN NEW;
  END IF;

  SELECT membership INTO v_membership FROM public.companies WHERE id = v_company_id;
  IF v_membership IS NULL THEN
    v_membership := 'basic';
  END IF;

  EXECUTE format('SELECT %I FROM public.membership_packages WHERE package_type = $1', v_max_column)
    INTO v_max_allowed USING v_membership;

  IF v_max_allowed IS NULL THEN
    v_max_allowed := 1;
  END IF;

  EXECUTE format('SELECT count(*) FROM public.%I WHERE company_id = $1 AND status = ANY($2)', v_table_name)
    INTO v_current_count USING v_company_id, v_count_statuses;

  IF v_current_count >= v_max_allowed THEN
    RAISE EXCEPTION 'Membership limit reached: % allows max % % (current: %)',
      v_membership, v_max_allowed, v_table_name, v_current_count;
  END IF;

  RETURN NEW;
END;
$function$;

-- Fix Elena Petrova: set to 'inactive' (not 'deactivated') to match agent convention
UPDATE public.agents SET status = 'inactive' WHERE email = 'orionsyria@yahoo.com' AND status = 'deactivated';

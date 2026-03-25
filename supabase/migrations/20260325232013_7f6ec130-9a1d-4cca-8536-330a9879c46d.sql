
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS downgraded_at timestamptz DEFAULT NULL;

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
      SELECT id FROM public.properties
      WHERE company_id = p_company_id AND status = 'active'
      ORDER BY created_at DESC LIMIT v_max_properties
    );

  UPDATE public.projects SET status = 'deactivated', downgraded_at = now(), updated_at = now()
  WHERE company_id = p_company_id AND status = 'active'
    AND id NOT IN (
      SELECT id FROM public.projects
      WHERE company_id = p_company_id AND status = 'active'
      ORDER BY created_at DESC LIMIT v_max_projects
    );

  UPDATE public.events SET status = 'deactivated', downgraded_at = now(), updated_at = now()
  WHERE company_id = p_company_id AND status = 'active'
    AND id NOT IN (
      SELECT id FROM public.events
      WHERE company_id = p_company_id AND status = 'active'
      ORDER BY created_at DESC LIMIT v_max_events
    );

  UPDATE public.agents SET status = 'deactivated', downgraded_at = now(), updated_at = now()
  WHERE company_id = p_company_id AND status IN ('active', 'pending')
    AND id NOT IN (
      SELECT id FROM public.agents
      WHERE company_id = p_company_id AND status IN ('active', 'pending')
      ORDER BY created_at DESC LIMIT v_max_agents
    );
END;
$function$;

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
    UPDATE public.agents SET status = 'deactivated', downgraded_at = now(), updated_at = now()
    WHERE company_id = r.id AND status IN ('active', 'pending')
      AND id NOT IN (
        SELECT id FROM public.agents WHERE company_id = r.id AND status IN ('active', 'pending')
        ORDER BY created_at DESC LIMIT v_max_agents
      );
    UPDATE public.companies SET membership = 'basic', updated_at = now() WHERE id = r.id;
  END LOOP;

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
    UPDATE public.agents SET status = 'deactivated', downgraded_at = now(), updated_at = now()
    WHERE company_id = r.id AND status IN ('active', 'pending')
      AND id NOT IN (
        SELECT id FROM public.agents WHERE company_id = r.id AND status IN ('active', 'pending')
        ORDER BY created_at DESC LIMIT v_max_agents
      );
    UPDATE public.companies SET membership = 'basic', updated_at = now() WHERE id = r.id;
  END LOOP;

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

  DELETE FROM public.agents
  WHERE status = 'deactivated' AND downgraded_at IS NOT NULL AND downgraded_at < now() - interval '90 days';
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_change_membership(
  p_company_id uuid,
  p_new_membership text,
  p_new_end_date timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_properties int;
  v_max_projects int;
  v_max_events int;
  v_max_agents int;
  v_active_props int;
  v_active_projs int;
  v_active_events int;
  v_active_agents int;
  v_slots int;
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

  -- ===== REACTIVATE downgraded items up to new quota (oldest downgraded first) =====
  SELECT COUNT(*) INTO v_active_props FROM public.properties
    WHERE company_id = p_company_id AND status = 'active';
  v_slots := GREATEST(0, v_max_properties - v_active_props);
  IF v_slots > 0 THEN
    UPDATE public.properties
    SET status = 'active', downgraded_at = NULL, updated_at = now()
    WHERE id IN (
      SELECT id FROM public.properties
      WHERE company_id = p_company_id AND status = 'deactivated' AND downgraded_at IS NOT NULL
      ORDER BY downgraded_at ASC LIMIT v_slots
    );
  END IF;

  SELECT COUNT(*) INTO v_active_projs FROM public.projects
    WHERE company_id = p_company_id AND status = 'active';
  v_slots := GREATEST(0, v_max_projects - v_active_projs);
  IF v_slots > 0 THEN
    UPDATE public.projects
    SET status = 'active', downgraded_at = NULL, updated_at = now()
    WHERE id IN (
      SELECT id FROM public.projects
      WHERE company_id = p_company_id AND status = 'deactivated' AND downgraded_at IS NOT NULL
      ORDER BY downgraded_at ASC LIMIT v_slots
    );
  END IF;

  SELECT COUNT(*) INTO v_active_events FROM public.events
    WHERE company_id = p_company_id AND status = 'active';
  v_slots := GREATEST(0, v_max_events - v_active_events);
  IF v_slots > 0 THEN
    UPDATE public.events
    SET status = 'active', downgraded_at = NULL, updated_at = now()
    WHERE id IN (
      SELECT id FROM public.events
      WHERE company_id = p_company_id AND status = 'deactivated' AND downgraded_at IS NOT NULL
      ORDER BY downgraded_at ASC LIMIT v_slots
    );
  END IF;

  SELECT COUNT(*) INTO v_active_agents FROM public.agents
    WHERE company_id = p_company_id AND status IN ('active', 'pending');
  v_slots := GREATEST(0, v_max_agents - v_active_agents);
  IF v_slots > 0 THEN
    UPDATE public.agents
    SET status = 'active', downgraded_at = NULL, updated_at = now()
    WHERE id IN (
      SELECT id FROM public.agents
      WHERE company_id = p_company_id AND status = 'inactive' AND downgraded_at IS NOT NULL
      ORDER BY downgraded_at ASC LIMIT v_slots
    );
  END IF;

  -- ===== DOWNGRADE excess (only matters if new tier is smaller) =====
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

  UPDATE public.agents SET status = 'inactive', downgraded_at = now(), updated_at = now()
  WHERE company_id = p_company_id AND status IN ('active', 'pending')
    AND id NOT IN (
      SELECT id FROM public.agents WHERE company_id = p_company_id AND status IN ('active', 'pending')
      ORDER BY created_at DESC LIMIT v_max_agents
    );
END;
$$;

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

  -- Determine count statuses based on table
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

  -- Skip enforcement if the new record is being inserted with a non-counted status (e.g. deactivated, inactive)
  v_new_status := NEW.status;
  IF v_new_status IS NOT NULL AND NOT (v_new_status = ANY(v_count_statuses)) THEN
    RETURN NEW;
  END IF;

  -- Get company membership
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

INSERT INTO public.agents (company_id, name, email, designation, phone, languages, status, service_areas, downgraded_at)
VALUES ('7fe3f004-0a4f-4564-be17-305a0d1148a4', 'Elena Petrova', 'orionsyria@yahoo.com', 'Senior Agent', '+90 532 777 8899', ARRAY['English', 'Russian'], 'deactivated', '{}', now());

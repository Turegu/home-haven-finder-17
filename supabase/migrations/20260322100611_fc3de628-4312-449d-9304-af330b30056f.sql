
-- Fix downgrade_expired_memberships to use correct status values matching check constraints
-- Properties/Projects/Events only allow: 'active', 'deactivated'
-- Agents have no check constraint so 'inactive' is fine

CREATE OR REPLACE FUNCTION public.downgrade_expired_memberships()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  expired_company_ids uuid[];
  no_expiry_company_ids uuid[];
  archive_company_ids uuid[];
  delete_company_ids uuid[];
BEGIN
  -- 0) Any non-basic company with NO expiry date is invalid — downgrade immediately
  SELECT array_agg(id) INTO no_expiry_company_ids
  FROM public.companies
  WHERE membership != 'basic'
    AND package_end_date IS NULL;

  IF no_expiry_company_ids IS NOT NULL THEN
    UPDATE public.properties SET status = 'deactivated', updated_at = now()
    WHERE company_id = ANY(no_expiry_company_ids) AND status = 'active';

    UPDATE public.projects SET status = 'deactivated', updated_at = now()
    WHERE company_id = ANY(no_expiry_company_ids) AND status = 'active';

    UPDATE public.events SET status = 'deactivated', updated_at = now()
    WHERE company_id = ANY(no_expiry_company_ids) AND status = 'active';

    UPDATE public.agents SET status = 'inactive', updated_at = now()
    WHERE company_id = ANY(no_expiry_company_ids) AND status = 'active';

    UPDATE public.companies
    SET membership = 'basic', updated_at = now()
    WHERE id = ANY(no_expiry_company_ids);
  END IF;

  -- 1) Companies with expired package_end_date — downgrade to basic
  SELECT array_agg(id) INTO expired_company_ids
  FROM public.companies
  WHERE package_end_date IS NOT NULL
    AND package_end_date < now()
    AND membership != 'basic';

  IF expired_company_ids IS NOT NULL THEN
    UPDATE public.properties SET status = 'deactivated', updated_at = now()
    WHERE company_id = ANY(expired_company_ids) AND status = 'active';

    UPDATE public.projects SET status = 'deactivated', updated_at = now()
    WHERE company_id = ANY(expired_company_ids) AND status = 'active';

    UPDATE public.events SET status = 'deactivated', updated_at = now()
    WHERE company_id = ANY(expired_company_ids) AND status = 'active';

    UPDATE public.agents SET status = 'inactive', updated_at = now()
    WHERE company_id = ANY(expired_company_ids) AND status = 'active';

    UPDATE public.companies
    SET membership = 'basic', updated_at = now()
    WHERE id = ANY(expired_company_ids);
  END IF;

  -- 2) Delete all listings for basic companies expired > 30 days ago
  -- (Skipping archive stage since check constraints don't allow 'archived')
  SELECT array_agg(id) INTO delete_company_ids
  FROM public.companies
  WHERE membership = 'basic'
    AND package_end_date IS NOT NULL
    AND package_end_date < now() - interval '90 days';

  IF delete_company_ids IS NOT NULL THEN
    DELETE FROM public.properties WHERE company_id = ANY(delete_company_ids);

    DELETE FROM public.project_units
    WHERE project_id IN (SELECT id FROM public.projects WHERE company_id = ANY(delete_company_ids));

    DELETE FROM public.projects WHERE company_id = ANY(delete_company_ids);

    DELETE FROM public.events WHERE company_id = ANY(delete_company_ids);

    DELETE FROM public.agents WHERE company_id = ANY(delete_company_ids);

    UPDATE public.companies
    SET package_end_date = NULL, updated_at = now()
    WHERE id = ANY(delete_company_ids);
  END IF;
END;
$function$;

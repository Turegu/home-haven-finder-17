
CREATE OR REPLACE FUNCTION public.downgrade_expired_memberships()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  expired_company_ids uuid[];
BEGIN
  -- Collect expired company IDs
  SELECT array_agg(id) INTO expired_company_ids
  FROM public.companies
  WHERE package_end_date IS NOT NULL
    AND package_end_date < now()
    AND membership != 'basic';

  -- If no expired companies, exit
  IF expired_company_ids IS NULL THEN
    RETURN;
  END IF;

  -- Deactivate all active properties for expired companies
  UPDATE public.properties
  SET status = 'inactive', updated_at = now()
  WHERE company_id = ANY(expired_company_ids)
    AND status = 'active';

  -- Deactivate all active projects for expired companies
  UPDATE public.projects
  SET status = 'inactive', updated_at = now()
  WHERE company_id = ANY(expired_company_ids)
    AND status = 'active';

  -- Deactivate all active events for expired companies
  UPDATE public.events
  SET status = 'inactive', updated_at = now()
  WHERE company_id = ANY(expired_company_ids)
    AND status = 'active';

  -- Deactivate all active agents for expired companies
  UPDATE public.agents
  SET status = 'inactive', updated_at = now()
  WHERE company_id = ANY(expired_company_ids)
    AND status = 'active';

  -- Downgrade the companies themselves
  UPDATE public.companies
  SET membership = 'basic',
      package_end_date = NULL,
      updated_at = now()
  WHERE id = ANY(expired_company_ids);
END;
$function$;

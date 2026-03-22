
CREATE OR REPLACE FUNCTION public.admin_change_membership(
  p_company_id uuid,
  p_new_membership text,
  p_new_end_date timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update the company membership
  UPDATE public.companies
  SET membership = p_new_membership::membership_type,
      package_end_date = p_new_end_date,
      updated_at = now()
  WHERE id = p_company_id;

  -- If downgrading to basic, deactivate all active listings
  IF p_new_membership = 'basic' THEN
    UPDATE public.properties SET status = 'deactivated', updated_at = now()
    WHERE company_id = p_company_id AND status = 'active';

    UPDATE public.projects SET status = 'deactivated', updated_at = now()
    WHERE company_id = p_company_id AND status = 'active';

    UPDATE public.events SET status = 'deactivated', updated_at = now()
    WHERE company_id = p_company_id AND status = 'active';

    UPDATE public.agents SET status = 'inactive', updated_at = now()
    WHERE company_id = p_company_id AND status = 'active';
  END IF;
END;
$$;


CREATE OR REPLACE FUNCTION public.downgrade_expired_memberships()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.companies
  SET membership = 'basic',
      package_end_date = NULL,
      updated_at = now()
  WHERE package_end_date IS NOT NULL
    AND package_end_date < now()
    AND membership != 'basic';
END;
$$;

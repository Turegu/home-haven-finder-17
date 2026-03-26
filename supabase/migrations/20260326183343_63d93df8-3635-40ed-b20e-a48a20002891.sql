
CREATE OR REPLACE FUNCTION public.check_property_request_rate_limit(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    SELECT count(*)
    FROM public.property_requests
    WHERE email = p_email
      AND created_at > now() - interval '24 hours'
  ) < 5;
$$;

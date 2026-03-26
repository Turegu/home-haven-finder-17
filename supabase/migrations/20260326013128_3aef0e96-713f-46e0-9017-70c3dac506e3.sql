-- Ensure property requests are routed to ALL eligible companies (Plus/Pro via has_property_requests)
CREATE OR REPLACE FUNCTION public.distribute_property_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_message text;
BEGIN
  v_message := 'Enquiry: ' || COALESCE(replace(NEW.enquiry_type, '_', ' '), 'N/A')
    || ' | Type: ' || COALESCE(NEW.property_type, 'N/A')
    || ' | Province: ' || COALESCE(NEW.province, 'N/A')
    || ' | District: ' || COALESCE(NEW.district, 'N/A')
    || ' | Budget: ' || COALESCE(NEW.budget, 'N/A')
    || ' | Area: ' || COALESCE(NEW.area_sqm, 'N/A') || ' m²';

  INSERT INTO public.company_inbox (company_id, inbox_type, full_name, email, phone, message, budget)
  SELECT c.id, 'property_request', NEW.full_name, NEW.email, NEW.phone, v_message, NEW.budget
  FROM public.companies c
  JOIN public.membership_packages mp
    ON mp.package_type = c.membership::text
  WHERE mp.has_property_requests = true;

  RETURN NEW;
END;
$$;

-- Recreate trigger to ensure it's present and correctly wired
DROP TRIGGER IF EXISTS trg_distribute_property_request ON public.property_requests;
CREATE TRIGGER trg_distribute_property_request
AFTER INSERT ON public.property_requests
FOR EACH ROW
EXECUTE FUNCTION public.distribute_property_request();
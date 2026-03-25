
-- Create a trigger function that distributes property requests to eligible companies
CREATE OR REPLACE FUNCTION public.distribute_property_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company RECORD;
  v_message text;
BEGIN
  -- Build a summary message from the request details
  v_message := 'Enquiry: ' || COALESCE(replace(NEW.enquiry_type, '_', ' '), 'N/A')
    || ' | Type: ' || COALESCE(NEW.property_type, 'N/A')
    || ' | Province: ' || COALESCE(NEW.province, 'N/A')
    || ' | District: ' || COALESCE(NEW.district, 'N/A')
    || ' | Budget: ' || COALESCE(NEW.budget, 'N/A')
    || ' | Area: ' || COALESCE(NEW.area_sqm, 'N/A') || ' m²';

  -- Insert into company_inbox for every active company whose membership plan has has_property_requests = true
  FOR v_company IN
    SELECT c.id AS company_id
    FROM public.companies c
    JOIN public.membership_packages mp ON mp.package_type = c.membership::text
    WHERE mp.has_property_requests = true
  LOOP
    INSERT INTO public.company_inbox (company_id, inbox_type, full_name, email, phone, message, budget)
    VALUES (v_company.company_id, 'property_request', NEW.full_name, NEW.email, NEW.phone, v_message, NEW.budget);
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER trg_distribute_property_request
AFTER INSERT ON public.property_requests
FOR EACH ROW
EXECUTE FUNCTION public.distribute_property_request();

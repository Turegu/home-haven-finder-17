-- Reliable inbox insert path for profile contact dialogs
CREATE OR REPLACE FUNCTION public.submit_company_inbox_message(
  p_company_id uuid,
  p_full_name text,
  p_email text,
  p_agent_id uuid DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_message text DEFAULT NULL,
  p_inbox_type text DEFAULT 'inquiry',
  p_property_id uuid DEFAULT NULL,
  p_project_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.company_inbox (
    company_id,
    agent_id,
    full_name,
    email,
    phone,
    message,
    inbox_type,
    property_id,
    project_id
  )
  VALUES (
    p_company_id,
    p_agent_id,
    p_full_name,
    p_email,
    NULLIF(p_phone, ''),
    p_message,
    COALESCE(NULLIF(p_inbox_type, ''), 'inquiry'),
    p_property_id,
    p_project_id
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_company_inbox_message(uuid, text, text, uuid, text, text, text, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_company_inbox_message(uuid, text, text, uuid, text, text, text, uuid, uuid) TO anon, authenticated;
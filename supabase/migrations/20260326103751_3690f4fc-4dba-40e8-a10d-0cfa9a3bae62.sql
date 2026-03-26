CREATE OR REPLACE FUNCTION public.submit_company_inbox_message(
  p_company_id uuid,
  p_full_name text,
  p_email text,
  p_agent_id uuid DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_message text DEFAULT NULL,
  p_inbox_type text DEFAULT 'message',
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
  v_inbox_type text;
BEGIN
  v_inbox_type := lower(COALESCE(NULLIF(trim(p_inbox_type), ''), 'message'));

  IF v_inbox_type = 'inquiry' AND p_property_id IS NULL AND p_project_id IS NULL THEN
    v_inbox_type := 'message';
  END IF;

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
    v_inbox_type,
    p_property_id,
    p_project_id
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_company_inbox_message(uuid, text, text, uuid, text, text, text, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_company_inbox_message(uuid, text, text, uuid, text, text, text, uuid, uuid) TO anon, authenticated;
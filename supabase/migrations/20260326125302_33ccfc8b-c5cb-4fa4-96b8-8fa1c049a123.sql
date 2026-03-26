
-- Part B: Rate limit function
CREATE OR REPLACE FUNCTION public.check_contact_rate_limit(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM company_inbox
  WHERE email = p_email
    AND created_at > NOW() - INTERVAL '1 hour';
  
  IF v_count >= 10 THEN
    RETURN FALSE;
  END IF;
  RETURN TRUE;
END;
$$;

-- Part C: Replace submit_company_inbox_message with rate limiting + sanitization
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
SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
  v_inbox_type text;
  v_full_name text;
  v_email text;
  v_message text;
  v_phone text;
BEGIN
  -- Trim all text inputs
  v_full_name := trim(COALESCE(p_full_name, ''));
  v_email := trim(COALESCE(p_email, ''));
  v_message := trim(COALESCE(p_message, ''));
  v_phone := NULLIF(trim(COALESCE(p_phone, '')), '');

  -- Validate full name (min 2 characters)
  IF length(v_full_name) < 2 THEN
    RAISE EXCEPTION 'Name must be at least 2 characters long.';
  END IF;

  -- Validate email (basic pattern)
  IF v_email !~ '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Please provide a valid email address.';
  END IF;

  -- Validate message not empty
  IF length(v_message) = 0 THEN
    RAISE EXCEPTION 'Message cannot be empty.';
  END IF;

  -- Rate limit check
  IF NOT check_contact_rate_limit(v_email) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before sending another message.';
  END IF;

  -- Determine inbox type
  v_inbox_type := lower(COALESCE(NULLIF(trim(p_inbox_type), ''), 'message'));

  IF v_inbox_type = 'inquiry' AND p_property_id IS NULL AND p_project_id IS NULL THEN
    v_inbox_type := 'message';
  END IF;

  INSERT INTO public.company_inbox (
    company_id, agent_id, full_name, email, phone, message, inbox_type, property_id, project_id
  )
  VALUES (
    p_company_id, p_agent_id, v_full_name, v_email, v_phone, v_message, v_inbox_type, p_property_id, p_project_id
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

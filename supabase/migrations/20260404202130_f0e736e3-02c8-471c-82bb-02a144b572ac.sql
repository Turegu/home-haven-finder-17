
-- =============================================================
-- 1. REVOKE anon access to private user tables
-- =============================================================
REVOKE ALL ON public.saved_properties FROM anon;
REVOKE ALL ON public.saved_searches FROM anon;
REVOKE ALL ON public.user_notifications FROM anon;
REVOKE ALL ON public.property_comparisons FROM anon;
REVOKE ALL ON public.email_templates FROM anon;

-- Profiles: revoke anon entirely
REVOKE ALL ON public.profiles FROM anon;

-- =============================================================
-- 2. company_inbox: revoke anon + block direct INSERT
-- =============================================================
REVOKE ALL ON public.company_inbox FROM anon;

-- Remove any existing INSERT policies that might allow direct inserts
-- (none found but being safe)

-- Block direct INSERT from authenticated too — force RPC
REVOKE INSERT ON public.company_inbox FROM authenticated;

-- =============================================================
-- 3. property_requests: revoke SELECT from anon (keep INSERT for public form)
-- =============================================================
REVOKE SELECT, UPDATE, DELETE ON public.property_requests FROM anon;

-- =============================================================
-- 4. Properties: ensure no anon DELETE/UPDATE/INSERT
-- =============================================================
REVOKE INSERT, UPDATE, DELETE ON public.properties FROM anon;

-- =============================================================
-- 5. Admin settings: block pattern_code keys from non-admin reads
-- =============================================================
-- Drop existing public-read policy and replace with one that excludes sensitive keys
DROP POLICY IF EXISTS "Anyone can view non-sensitive settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Public can view settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Authenticated can view credit settings" ON public.admin_settings;

-- Public (incl anon) can read only whitelisted non-sensitive settings
CREATE POLICY "Public can view non-sensitive settings"
ON public.admin_settings FOR SELECT
TO public
USING (
  setting_key = ANY(ARRAY[
    'map_provider', 'ai_search_enabled', 'response_rate_visible',
    'premium_1_month_credits', 'premium_3_months_credits',
    'featured_1_month_credits', 'featured_3_months_credits',
    'boost_company_3_months_credits', 'boost_company_6_months_credits', 'boost_company_12_months_credits',
    'boost_agent_3_months_credits', 'boost_agent_6_months_credits', 'boost_agent_12_months_credits',
    'allowed_display_currency', 'site_name'
  ])
);

-- Admins can still see everything (already have ALL policy)

-- =============================================================
-- 6. Enhanced rate limiting in submit_company_inbox_message
-- =============================================================
CREATE OR REPLACE FUNCTION public.check_contact_rate_limit(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Global: max 10 messages per email per hour (existing)
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

-- Add per-company rate limit check function
CREATE OR REPLACE FUNCTION public.check_contact_rate_limit_per_company(p_email text, p_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM company_inbox
  WHERE email = p_email
    AND company_id = p_company_id
    AND created_at > NOW() - INTERVAL '1 hour';

  IF v_count >= 5 THEN
    RETURN FALSE;
  END IF;
  RETURN TRUE;
END;
$$;

-- Update submit_company_inbox_message to include per-company rate limit
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

  -- Global rate limit check (10 per hour across all companies)
  IF NOT check_contact_rate_limit(v_email) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before sending another message.';
  END IF;

  -- Per-company rate limit check (5 per company per hour)
  IF NOT check_contact_rate_limit_per_company(v_email, p_company_id) THEN
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

-- Defense-in-depth: revoke SELECT from anon on advertising_requests
-- RLS already restricts SELECT to admin role, but this adds grant-level protection
REVOKE SELECT ON public.advertising_requests FROM anon;

-- Ensure INSERT remains available for the public form
GRANT INSERT ON public.advertising_requests TO anon;

-- Note: agent_response_metrics is a SECURITY DEFINER view exposing only
-- aggregate stats (response rates). It contains no PII and is intentionally
-- designed this way. Already marked as ignored in the security scanner.
CREATE OR REPLACE VIEW public.agent_response_metrics
WITH (security_invoker = false) AS
SELECT
  ci.agent_id,
  COUNT(*) AS total_inquiries,
  COUNT(ci.responded_at) AS responded_count,
  ROUND((COUNT(ci.responded_at)::numeric / NULLIF(COUNT(*), 0)) * 100) AS response_rate,
  ROUND(AVG(EXTRACT(EPOCH FROM (ci.responded_at - ci.created_at)) / 3600)::numeric, 1) AS avg_response_hours
FROM public.company_inbox ci
WHERE ci.agent_id IS NOT NULL
GROUP BY ci.agent_id;

GRANT SELECT ON public.agent_response_metrics TO anon, authenticated;

CREATE OR REPLACE VIEW public.company_response_metrics
WITH (security_invoker = false) AS
SELECT
  ci.company_id,
  COUNT(*) AS total_inquiries,
  COUNT(ci.responded_at) AS responded_count,
  ROUND((COUNT(ci.responded_at)::numeric / NULLIF(COUNT(*), 0)) * 100) AS response_rate,
  ROUND(AVG(EXTRACT(EPOCH FROM (ci.responded_at - ci.created_at)) / 3600)::numeric, 1) AS avg_response_hours
FROM public.company_inbox ci
GROUP BY ci.company_id;

GRANT SELECT ON public.company_response_metrics TO anon, authenticated;
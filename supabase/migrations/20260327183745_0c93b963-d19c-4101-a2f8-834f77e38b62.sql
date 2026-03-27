DROP VIEW IF EXISTS public.agent_response_metrics;
DROP VIEW IF EXISTS public.company_response_metrics;

CREATE VIEW public.agent_response_metrics WITH (security_invoker = true) AS
SELECT
  agent_id,
  COUNT(*) AS total_inquiries,
  COUNT(*) FILTER (WHERE responded_at IS NOT NULL) AS responded_count,
  ROUND((COUNT(*) FILTER (WHERE responded_at IS NOT NULL)::numeric / NULLIF(COUNT(*), 0)) * 100) AS response_rate,
  ROUND(AVG(EXTRACT(EPOCH FROM (responded_at - created_at)) / 3600) FILTER (WHERE responded_at IS NOT NULL)) AS avg_response_hours
FROM public.company_inbox
WHERE agent_id IS NOT NULL
GROUP BY agent_id;

CREATE VIEW public.company_response_metrics WITH (security_invoker = true) AS
SELECT
  company_id,
  COUNT(*) AS total_inquiries,
  COUNT(*) FILTER (WHERE responded_at IS NOT NULL) AS responded_count,
  ROUND((COUNT(*) FILTER (WHERE responded_at IS NOT NULL)::numeric / NULLIF(COUNT(*), 0)) * 100) AS response_rate,
  ROUND(AVG(EXTRACT(EPOCH FROM (responded_at - created_at)) / 3600) FILTER (WHERE responded_at IS NOT NULL)) AS avg_response_hours
FROM public.company_inbox
GROUP BY company_id;

GRANT SELECT ON public.agent_response_metrics TO anon, authenticated;
GRANT SELECT ON public.company_response_metrics TO anon, authenticated;
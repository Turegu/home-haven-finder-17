
-- Add responded_at timestamp to company_inbox for response rate tracking
ALTER TABLE public.company_inbox ADD COLUMN IF NOT EXISTS responded_at timestamptz DEFAULT NULL;

-- Create a view for company response metrics
CREATE OR REPLACE VIEW public.company_response_metrics AS
SELECT
  company_id,
  COUNT(*) FILTER (WHERE inbox_type IN ('inquiry', 'message')) AS total_inquiries,
  COUNT(*) FILTER (WHERE inbox_type IN ('inquiry', 'message') AND responded_at IS NOT NULL) AS responded_count,
  ROUND(
    (COUNT(*) FILTER (WHERE inbox_type IN ('inquiry', 'message') AND responded_at IS NOT NULL)::numeric /
     NULLIF(COUNT(*) FILTER (WHERE inbox_type IN ('inquiry', 'message')), 0)) * 100
  ) AS response_rate,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (responded_at - created_at)) / 3600) FILTER (WHERE responded_at IS NOT NULL)
  ) AS avg_response_hours
FROM public.company_inbox
GROUP BY company_id;

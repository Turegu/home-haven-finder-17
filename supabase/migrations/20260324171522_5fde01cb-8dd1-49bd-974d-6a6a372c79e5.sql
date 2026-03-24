
ALTER TABLE public.company_pattern_codes ADD COLUMN is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.agent_pattern_codes ADD COLUMN is_active boolean NOT NULL DEFAULT true;

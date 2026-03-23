
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS boost_end_date timestamptz DEFAULT NULL;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS boost_end_date timestamptz DEFAULT NULL;

UPDATE public.companies SET profile_classification = 'standard' WHERE profile_classification NOT IN ('standard', 'boosted');
UPDATE public.agents SET profile_classification = 'standard' WHERE profile_classification NOT IN ('standard', 'boosted');

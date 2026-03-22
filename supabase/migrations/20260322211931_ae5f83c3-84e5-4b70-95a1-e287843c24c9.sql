
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS profile_classification text NOT NULL DEFAULT 'standard';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS profile_classification text NOT NULL DEFAULT 'standard';

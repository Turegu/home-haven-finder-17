
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS title_fr text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS description_fr text;

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS title_fr text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description_fr text;

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS title_fr text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS description_fr text;

ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS name_fr text;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS description_fr text;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS name_fr text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS about_fr text;

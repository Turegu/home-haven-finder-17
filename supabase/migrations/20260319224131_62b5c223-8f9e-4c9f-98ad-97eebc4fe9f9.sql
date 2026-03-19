ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS advertising_tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS property_classification text DEFAULT NULL;
ALTER TABLE public.membership_packages ADD COLUMN has_ai_search boolean NOT NULL DEFAULT false;

-- Enable AI search for Pro package by default
UPDATE public.membership_packages SET has_ai_search = true WHERE package_type = 'pro';
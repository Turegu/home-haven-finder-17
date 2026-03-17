
-- Unified filter management system with multi-language support
CREATE TABLE public.filter_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key text NOT NULL UNIQUE,
  title text NOT NULL,
  translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  applies_to text[] NOT NULL DEFAULT '{}'::text[],
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.filter_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.filter_categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.filter_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filter_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage filter categories"
  ON public.filter_categories FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active filter categories"
  ON public.filter_categories FOR SELECT
  TO public
  USING (status = 'active');

CREATE POLICY "Admins can manage filter options"
  ON public.filter_options FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active filter options"
  ON public.filter_options FOR SELECT
  TO public
  USING (status = 'active');

CREATE INDEX idx_filter_options_category ON public.filter_options(category_id);


CREATE TABLE public.languages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active languages" ON public.languages
  FOR SELECT USING (status = 'active' OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage languages" ON public.languages
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_languages_updated_at
  BEFORE UPDATE ON public.languages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default languages
INSERT INTO public.languages (name, code, sort_order) VALUES
  ('Turkish', 'tr', 1),
  ('French', 'fr', 2),
  ('English', 'en', 3),
  ('Arabic', 'ar', 4),
  ('Russian', 'ru', 5),
  ('Farsi', 'fa', 6),
  ('German', 'de', 7);

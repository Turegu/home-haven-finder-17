
-- Create FAQs table
CREATE TABLE public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- FAQ translations for multi-language
CREATE TABLE public.faq_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  faq_id UUID NOT NULL REFERENCES public.faqs(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  question TEXT NOT NULL DEFAULT '',
  answer TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(faq_id, language_code)
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage faqs" ON public.faqs FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active faqs" ON public.faqs FOR SELECT TO public
USING (status = 'active' OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage faq translations" ON public.faq_translations FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view faq translations" ON public.faq_translations FOR SELECT TO public
USING (true);

CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON public.faqs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faq_translations_updated_at BEFORE UPDATE ON public.faq_translations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

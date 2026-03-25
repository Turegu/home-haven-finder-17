
-- Designations table (for agent designations, admin-managed with translations)
CREATE TABLE public.designations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  translations JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active designations"
  ON public.designations FOR SELECT
  USING (true);

-- Company types table (admin-managed with translations)
CREATE TABLE public.company_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  translations JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.company_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active company types"
  ON public.company_types FOR SELECT
  USING (true);

-- Seed existing designations
INSERT INTO public.designations (title, translations, sort_order) VALUES
  ('Sales Director', '{"ar": "مدير المبيعات", "fr": "Directeur des ventes"}', 1),
  ('Sales Manager', '{"ar": "مدير مبيعات", "fr": "Responsable des ventes"}', 2),
  ('Senior Property Consultant', '{"ar": "مستشار عقاري أول", "fr": "Consultant immobilier senior"}', 3),
  ('Property Consultant', '{"ar": "مستشار عقاري", "fr": "Consultant immobilier"}', 4),
  ('Property Specialist', '{"ar": "أخصائي عقاري", "fr": "Spécialiste immobilier"}', 5),
  ('Property Agent', '{"ar": "وكيل عقاري", "fr": "Agent immobilier"}', 6),
  ('Sales Agent', '{"ar": "وكيل مبيعات", "fr": "Agent commercial"}', 7),
  ('Leasing Agent', '{"ar": "وكيل تأجير", "fr": "Agent de location"}', 8),
  ('Marketing Consultant', '{"ar": "مستشار تسويق", "fr": "Consultant marketing"}', 9),
  ('Branch Manager', '{"ar": "مدير فرع", "fr": "Directeur d''agence"}', 10),
  ('Regional Manager', '{"ar": "مدير إقليمي", "fr": "Directeur régional"}', 11),
  ('Property Manager', '{"ar": "مدير عقارات", "fr": "Gestionnaire immobilier"}', 12),
  ('Investment Advisor', '{"ar": "مستشار استثماري", "fr": "Conseiller en investissement"}', 13),
  ('Valuation Expert', '{"ar": "خبير تقييم", "fr": "Expert en évaluation"}', 14);

-- Seed existing company types
INSERT INTO public.company_types (title, translations, sort_order) VALUES
  ('Real Estate Company', '{"ar": "شركة عقارية", "fr": "Société immobilière"}', 1),
  ('Real Estate Developer', '{"ar": "مطور عقاري", "fr": "Promoteur immobilier"}', 2),
  ('Construction Company', '{"ar": "شركة إنشاءات", "fr": "Entreprise de construction"}', 3),
  ('Marketing & Advertising Company', '{"ar": "شركة تسويق وإعلان", "fr": "Société de marketing et publicité"}', 4);

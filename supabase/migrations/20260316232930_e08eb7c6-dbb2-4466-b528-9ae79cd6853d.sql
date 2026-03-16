
-- Banks table for mortgage/loan advertising
CREATE TABLE public.banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  interest_rate numeric,
  finance_amount_percentage numeric,
  maximum_amount numeric,
  maximum_duration integer,
  down_payment numeric,
  final_payment numeric,
  bank_info_link text,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage banks" ON public.banks FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active banks" ON public.banks FOR SELECT TO public
  USING (status = 'active');

-- Storage bucket for bank logos
INSERT INTO storage.buckets (id, name, public) VALUES ('bank-logos', 'bank-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view bank logos" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'bank-logos');

CREATE POLICY "Admins can upload bank logos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bank-logos');

CREATE POLICY "Admins can delete bank logos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'bank-logos');


CREATE TABLE public.project_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  unit_name text NOT NULL,
  unit_type text NOT NULL DEFAULT 'apartment',
  price numeric,
  currency text DEFAULT 'USD',
  area numeric,
  area_unit text DEFAULT 'm²',
  rooms text,
  bathrooms integer,
  car_parking integer,
  images text[],
  status text NOT NULL DEFAULT 'available',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.project_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage project units" ON public.project_units FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view available units" ON public.project_units FOR SELECT TO public
  USING (status IN ('available', 'reserved'));

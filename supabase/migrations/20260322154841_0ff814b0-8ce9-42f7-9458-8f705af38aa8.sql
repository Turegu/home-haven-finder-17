
-- Property Payment Plans (mirrors unit_payment_plans)
CREATE TABLE public.property_payment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  plan_name text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_payment_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active property plans" ON public.property_payment_plans
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins can manage all property plans" ON public.property_payment_plans
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Company owners can manage own property plans" ON public.property_payment_plans
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM properties p
      JOIN companies c ON c.id = p.company_id
      WHERE p.id = property_payment_plans.property_id AND c.owner_user_id = auth.uid()
    )
  );

-- Property Payment Plan Steps (mirrors unit_payment_plan_steps)
CREATE TABLE public.property_payment_plan_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.property_payment_plans(id) ON DELETE CASCADE,
  percentage numeric NOT NULL DEFAULT 0,
  title text NOT NULL DEFAULT '',
  subtitle text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_payment_plan_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view property plan steps" ON public.property_payment_plan_steps
  FOR SELECT TO public USING (
    EXISTS (
      SELECT 1 FROM property_payment_plans WHERE id = property_payment_plan_steps.plan_id AND is_active = true
    )
  );

CREATE POLICY "Admins can manage all property plan steps" ON public.property_payment_plan_steps
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Company owners can manage own property plan steps" ON public.property_payment_plan_steps
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM property_payment_plans pp
      JOIN properties p ON p.id = pp.property_id
      JOIN companies c ON c.id = p.company_id
      WHERE pp.id = property_payment_plan_steps.plan_id AND c.owner_user_id = auth.uid()
    )
  );

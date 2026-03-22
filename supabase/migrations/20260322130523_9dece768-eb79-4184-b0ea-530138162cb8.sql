
-- Payment plans table: each unit can have multiple payment plan options (tabs)
-- Each plan option has multiple installment steps
CREATE TABLE public.unit_payment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.project_units(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL DEFAULT 'Option 1',
  is_active BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.unit_payment_plan_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.unit_payment_plans(id) ON DELETE CASCADE,
  percentage NUMERIC NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.unit_payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_payment_plan_steps ENABLE ROW LEVEL SECURITY;

-- Anyone can view active payment plans (for public project detail page)
CREATE POLICY "Anyone can view active payment plans"
  ON public.unit_payment_plans FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Anyone can view plan steps"
  ON public.unit_payment_plan_steps FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.unit_payment_plans
      WHERE unit_payment_plans.id = unit_payment_plan_steps.plan_id
        AND unit_payment_plans.is_active = true
    )
  );

-- Company owners can manage payment plans for their project units
CREATE POLICY "Company owners can manage payment plans"
  ON public.unit_payment_plans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_units pu
      JOIN public.projects p ON p.id = pu.project_id
      JOIN public.companies c ON c.id = p.company_id
      WHERE pu.id = unit_payment_plans.unit_id
        AND c.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Company owners can manage plan steps"
  ON public.unit_payment_plan_steps FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.unit_payment_plans upp
      JOIN public.project_units pu ON pu.id = upp.unit_id
      JOIN public.projects p ON p.id = pu.project_id
      JOIN public.companies c ON c.id = p.company_id
      WHERE upp.id = unit_payment_plan_steps.plan_id
        AND c.owner_user_id = auth.uid()
    )
  );

-- Admins can manage all
CREATE POLICY "Admins can manage all payment plans"
  ON public.unit_payment_plans FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all plan steps"
  ON public.unit_payment_plan_steps FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers
CREATE TRIGGER update_unit_payment_plans_updated_at
  BEFORE UPDATE ON public.unit_payment_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

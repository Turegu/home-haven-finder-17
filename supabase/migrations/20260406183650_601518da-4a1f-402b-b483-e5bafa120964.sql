
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties (status);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON public.properties (property_type);
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON public.properties (agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_company_id ON public.properties (company_id);
CREATE INDEX IF NOT EXISTS idx_property_payment_plans_property_id ON public.property_payment_plans (property_id);
CREATE INDEX IF NOT EXISTS idx_property_payment_plans_is_active ON public.property_payment_plans (is_active);
CREATE INDEX IF NOT EXISTS idx_property_payment_plan_steps_plan_id ON public.property_payment_plan_steps (plan_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects (company_id);
CREATE INDEX IF NOT EXISTS idx_projects_agent_id ON public.projects (agent_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events (status);
CREATE INDEX IF NOT EXISTS idx_events_company_id ON public.events (company_id);

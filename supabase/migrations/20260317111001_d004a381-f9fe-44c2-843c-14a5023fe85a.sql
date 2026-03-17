
-- Create agents table
CREATE TABLE public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid DEFAULT NULL,
  name text NOT NULL,
  designation text DEFAULT NULL,
  email text NOT NULL,
  phone text DEFAULT NULL,
  whatsapp text DEFAULT NULL,
  description text DEFAULT NULL,
  service_areas text[] DEFAULT '{}',
  languages text[] DEFAULT '{}',
  registration_number text DEFAULT NULL,
  avatar_url text DEFAULT NULL,
  credit_balance numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Admins can manage all agents
CREATE POLICY "Admins can manage agents"
ON public.agents FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Company owners can view own agents
CREATE POLICY "Company owners can view own agents"
ON public.agents FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM companies WHERE companies.id = agents.company_id AND companies.owner_user_id = auth.uid()
));

-- Company owners can insert agents
CREATE POLICY "Company owners can insert agents"
ON public.agents FOR INSERT TO authenticated
WITH CHECK (
  (EXISTS (SELECT 1 FROM companies WHERE companies.id = agents.company_id AND companies.owner_user_id = auth.uid()))
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Company owners can update own agents
CREATE POLICY "Company owners can update own agents"
ON public.agents FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM companies WHERE companies.id = agents.company_id AND companies.owner_user_id = auth.uid()
));

-- Company owners can delete own agents
CREATE POLICY "Company owners can delete own agents"
ON public.agents FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM companies WHERE companies.id = agents.company_id AND companies.owner_user_id = auth.uid()
));

-- Public can view active agents
CREATE POLICY "Anyone can view active agents"
ON public.agents FOR SELECT
USING (status = 'active');

-- Agents can view their own profile
CREATE POLICY "Agents can view own profile"
ON public.agents FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Agents can update own profile
CREATE POLICY "Agents can update own profile"
ON public.agents FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- Add agent_id to properties, projects, events for assignment
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL;

-- Trigger for updated_at
CREATE TRIGGER update_agents_updated_at
BEFORE UPDATE ON public.agents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for agent avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('agent-avatars', 'agent-avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view agent avatars"
ON storage.objects FOR SELECT USING (bucket_id = 'agent-avatars');

CREATE POLICY "Authenticated can upload agent avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'agent-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete agent avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'agent-avatars' AND auth.role() = 'authenticated');

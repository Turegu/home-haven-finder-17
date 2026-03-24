
-- Create agent-specific pattern codes table
CREATE TABLE public.agent_pattern_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  pattern_code text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id)
);

ALTER TABLE public.agent_pattern_codes ENABLE ROW LEVEL SECURITY;

-- Admins can manage all
CREATE POLICY "Admins can manage agent patterns"
  ON public.agent_pattern_codes FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Agents can view their own pattern (for login verification)
CREATE POLICY "Agents can view own pattern"
  ON public.agent_pattern_codes FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM agents WHERE agents.id = agent_pattern_codes.agent_id AND agents.user_id = auth.uid()
  ));

-- Agents can update their own pattern
CREATE POLICY "Agents can update own pattern"
  ON public.agent_pattern_codes FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM agents WHERE agents.id = agent_pattern_codes.agent_id AND agents.user_id = auth.uid()
  ));

-- Agents can insert their own pattern
CREATE POLICY "Agents can insert own pattern"
  ON public.agent_pattern_codes FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM agents WHERE agents.id = agent_pattern_codes.agent_id AND agents.user_id = auth.uid()
  ));

-- Company owners can view patterns for their agents
CREATE POLICY "Company owners can view agent patterns"
  ON public.agent_pattern_codes FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM agents a JOIN companies c ON c.id = a.company_id
    WHERE a.id = agent_pattern_codes.agent_id AND c.owner_user_id = auth.uid()
  ));

-- Public can view for login verification
CREATE POLICY "Public can view agent patterns for login"
  ON public.agent_pattern_codes FOR SELECT
  TO anon
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_agent_pattern_codes_updated_at
  BEFORE UPDATE ON public.agent_pattern_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

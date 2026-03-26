-- BUG 3 fix: Add agent RLS policies for company_inbox so agents can read/update their assigned inbox items
CREATE POLICY "Agents can view assigned inbox items"
ON public.company_inbox FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.agents
  WHERE agents.id = company_inbox.agent_id AND agents.user_id = auth.uid()
));

CREATE POLICY "Agents can update assigned inbox items"
ON public.company_inbox FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.agents
  WHERE agents.id = company_inbox.agent_id AND agents.user_id = auth.uid()
));
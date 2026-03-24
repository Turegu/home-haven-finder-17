
-- Allow company owners to delete their own pattern
CREATE POLICY "Company owners can delete own pattern"
  ON public.company_pattern_codes FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = company_pattern_codes.company_id
      AND companies.owner_user_id = auth.uid()
  ));

-- Allow agents to delete their own pattern
CREATE POLICY "Agents can delete own pattern"
  ON public.agent_pattern_codes FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = agent_pattern_codes.agent_id
      AND agents.user_id = auth.uid()
  ));

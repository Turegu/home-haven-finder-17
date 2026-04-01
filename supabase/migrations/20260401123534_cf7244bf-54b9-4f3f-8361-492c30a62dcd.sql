DROP POLICY IF EXISTS "agents_public_select" ON agents;
DROP POLICY IF EXISTS "Agents are publicly readable" ON agents;
DROP POLICY IF EXISTS "Public can view active agents" ON agents;

CREATE POLICY "agents_public_select" ON agents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = agents.company_id
      AND companies.is_verified = true
    )
  );
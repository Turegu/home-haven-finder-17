-- Allow agents to view followers of their company
CREATE POLICY "Agents can view company followers"
ON public.company_followers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agents a
    WHERE a.company_id = company_followers.company_id
    AND a.user_id = auth.uid()
  )
);
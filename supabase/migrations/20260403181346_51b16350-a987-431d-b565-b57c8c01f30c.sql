-- Restore table-level SELECT for authenticated on companies
-- Column-level restrictions break PostgREST join resolution
-- RLS policies already restrict row access appropriately
GRANT SELECT ON public.companies TO authenticated;

-- Clear stale column-level ACLs on companies for authenticated
-- (table-level grant supersedes them, but clean up for clarity)
REVOKE ALL (email, owner_user_id, credit_balance, verification_token, package_end_date, created_by) ON public.companies FROM authenticated;
GRANT SELECT (email, owner_user_id, credit_balance, verification_token, package_end_date, created_by) ON public.companies TO authenticated;
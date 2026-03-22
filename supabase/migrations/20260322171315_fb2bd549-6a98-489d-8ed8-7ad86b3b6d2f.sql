
-- Credit transactions ledger
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  transaction_type text NOT NULL DEFAULT 'topup',
  description text,
  listing_type text,
  listing_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_credit_transactions_company ON public.credit_transactions(company_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins can manage credit transactions"
  ON public.credit_transactions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Company owners can view own transactions
CREATE POLICY "Company owners can view own transactions"
  ON public.credit_transactions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id = credit_transactions.company_id
    AND companies.owner_user_id = auth.uid()
  ));

-- Agents can view transactions for their company
CREATE POLICY "Agents can view company transactions"
  ON public.credit_transactions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.agents
    WHERE agents.company_id = credit_transactions.company_id
    AND agents.user_id = auth.uid()
  ));


CREATE OR REPLACE FUNCTION public.share_credits(
  p_company_id uuid,
  p_agent_id uuid,
  p_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company_balance numeric;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Lock the company row and check balance
  SELECT credit_balance INTO v_company_balance
  FROM public.companies
  WHERE id = p_company_id
  FOR UPDATE;

  IF v_company_balance IS NULL THEN
    RAISE EXCEPTION 'Company not found';
  END IF;

  IF v_company_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient company credits';
  END IF;

  -- Deduct from company
  UPDATE public.companies
  SET credit_balance = credit_balance - p_amount, updated_at = now()
  WHERE id = p_company_id;

  -- Add to agent
  UPDATE public.agents
  SET credit_balance = credit_balance + p_amount, updated_at = now()
  WHERE id = p_agent_id AND company_id = p_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agent not found or does not belong to this company';
  END IF;

  -- Log the transaction
  INSERT INTO public.credit_transactions (company_id, agent_id, amount, transaction_type, description)
  VALUES (p_company_id, p_agent_id, -p_amount, 'share', 'Credits shared with agent');
END;
$$;

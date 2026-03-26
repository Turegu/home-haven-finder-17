-- When an agent is deleted, clean up their followers
ALTER TABLE public.agent_followers DROP CONSTRAINT IF EXISTS agent_followers_agent_id_fkey;
ALTER TABLE public.agent_followers ADD CONSTRAINT agent_followers_agent_id_fkey 
  FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;

-- When a company is deleted, clean up their followers  
ALTER TABLE public.company_followers DROP CONSTRAINT IF EXISTS company_followers_company_id_fkey;
ALTER TABLE public.company_followers ADD CONSTRAINT company_followers_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
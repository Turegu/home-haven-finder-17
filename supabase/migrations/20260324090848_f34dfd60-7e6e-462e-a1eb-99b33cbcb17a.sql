
-- Add 'marketing_agency' to the company_type enum
ALTER TYPE public.company_type ADD VALUE IF NOT EXISTS 'marketing_agency';

-- Add company_types text[] column for multi-select
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS company_types text[] DEFAULT '{}';

-- Migrate existing single company_type values to the new array column
UPDATE public.companies 
SET company_types = ARRAY[company_type::text] 
WHERE company_type IS NOT NULL AND (company_types IS NULL OR company_types = '{}');

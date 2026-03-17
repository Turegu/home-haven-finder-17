
-- Create currencies table
CREATE TABLE public.currencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  symbol TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage currencies"
ON public.currencies FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active currencies"
ON public.currencies FOR SELECT TO public
USING (status = 'active' OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_currencies_updated_at
BEFORE UPDATE ON public.currencies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed common currencies
INSERT INTO public.currencies (name, code, symbol, sort_order) VALUES
('US Dollar', 'USD', '$', 1),
('Turkish Lira', 'TRY', '₺', 2),
('Euro', 'EUR', '€', 3),
('Pound', 'GBP', '£', 4),
('Russian Ruble', 'RUB', '₽', 5),
('Saudi Riyal', 'SAR', 'ر.س', 6),
('Canadian Dollar', 'CAD', '$', 7),
('United Arab Emirates Dirham', 'AED', 'Dhs', 8),
('Qatari Riyal', 'QAR', 'QR', 9),
('Lebanese Pound', 'LBP', 'LL', 10),
('Algerian Dinar', 'DZD', 'DA', 11),
('Syrian Pound', 'SYP', 'LS', 12),
('Kuwaiti Dinar', 'KWD', 'د.ك', 13),
('Bahraini Dinar', 'BHD', 'BD', 14),
('Omani Rial', 'OMR', 'ر.ع', 15),
('Jordanian Dinar', 'JOD', 'JD', 16),
('Egyptian Pound', 'EGP', 'E£', 17),
('Moroccan Dirham', 'MAD', 'MAD', 18),
('Tunisian Dinar', 'TND', 'DT', 19),
('Iraqi Dinar', 'IQD', 'ع.د', 20),
('Iranian Rial', 'IRR', '﷼', 21),
('Pakistani Rupee', 'PKR', '₨', 22),
('Indian Rupee', 'INR', '₹', 23),
('Chinese Yuan', 'CNY', '¥', 24),
('Japanese Yen', 'JPY', '¥', 25),
('Australian Dollar', 'AUD', 'A$', 26),
('Swiss Franc', 'CHF', 'CHF', 27),
('Swedish Krona', 'SEK', 'kr', 28),
('Norwegian Krone', 'NOK', 'kr', 29),
('Danish Krone', 'DKK', 'kr', 30);


-- Part A: Add search_vector column, populate it, create GIN index, and trigger

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE public.properties SET search_vector =
  setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(title_ar, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(location, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(province, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(town, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(description, '')), 'C');

CREATE INDEX IF NOT EXISTS idx_properties_search_vector ON public.properties USING GIN(search_vector);

CREATE OR REPLACE FUNCTION public.update_property_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.title_ar, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.location, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.province, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.town, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS properties_search_vector_update ON public.properties;
CREATE TRIGGER properties_search_vector_update
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_property_search_vector();

ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.build_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proformas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proforma_counters ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE t text; r text;
BEGIN
 FOREACH t IN ARRAY ARRAY['components','component_images','stores','prices','benchmarks','builds','build_items','proformas','proforma_counters']
 LOOP
  EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC',t);
  FOREACH r IN ARRAY ARRAY['anon','authenticated']
  LOOP
   IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I',t,r); END IF;
  END LOOP;
 END LOOP;
END $$;

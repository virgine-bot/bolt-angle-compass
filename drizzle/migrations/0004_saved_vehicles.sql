CREATE TABLE public.vehicles (
  id text PRIMARY KEY DEFAULT ('veh-' || substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('motorbike','bicycle','scooter')),
  plate text CHECK (plate IS NULL OR char_length(plate) <= 30),
  note text CHECK (note IS NULL OR char_length(note) <= 200),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.vehicles TO anon, authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view vehicles" ON public.vehicles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add vehicles" ON public.vehicles FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.vehicle_references (
  id text PRIMARY KEY DEFAULT ('ref-' || substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  vehicle_id text NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 60),
  photo_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vehicle_references_vehicle_idx ON public.vehicle_references(vehicle_id);
GRANT SELECT, INSERT ON public.vehicle_references TO anon, authenticated;
GRANT ALL ON public.vehicle_references TO service_role;
ALTER TABLE public.vehicle_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view vehicle references" ON public.vehicle_references FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add vehicle references" ON public.vehicle_references FOR INSERT TO anon, authenticated WITH CHECK (photo_path LIKE 'shared/%');
CREATE INDEX IF NOT EXISTS inspections_vehicle_idx ON public.inspections(vehicle_id);
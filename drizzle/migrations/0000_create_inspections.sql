CREATE TABLE public.inspections (
  id text PRIMARY KEY DEFAULT ('ins-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  vehicle_id text NOT NULL,
  reference_id text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  processing_ms integer NOT NULL DEFAULT 0,
  inspector_name text NOT NULL,
  inspector_id uuid,
  bolts jsonb NOT NULL DEFAULT '[]'::jsonb,
  photo_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.inspections TO authenticated;
GRANT ALL ON public.inspections TO service_role;

ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view inspections"
  ON public.inspections FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team members can add their own inspections"
  ON public.inspections FOR INSERT TO authenticated WITH CHECK (inspector_id = auth.uid());

CREATE INDEX inspections_vehicle_captured_idx ON public.inspections (vehicle_id, captured_at DESC);
CREATE INDEX inspections_reference_captured_idx ON public.inspections (reference_id, captured_at DESC);

CREATE POLICY "Team members can view inspection photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'inspection-photos');

CREATE POLICY "Team members upload photos to their own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'inspection-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

INSERT INTO public.inspections (id, vehicle_id, reference_id, captured_at, processing_ms, inspector_name, bolts) VALUES
('ins-1048', 'sc-0142', 'r1', '2026-11-18T08:42:00+07:00', 3240, 'Erlangga H.', '[{"boltId":"b1","angle":2.1,"confidence":0.93},{"boltId":"b2","angle":11.4,"confidence":0.88},{"boltId":"b3","angle":-18.7,"confidence":0.91}]'),
('ins-1047', 'bc-2210', 'r3', '2026-11-17T16:10:00+07:00', 2810, 'Airi S.', '[{"boltId":"b1","angle":0.8,"confidence":0.95},{"boltId":"b2","angle":-1.6,"confidence":0.94},{"boltId":"b3","angle":3.2,"confidence":0.9}]'),
('ins-1046', 'mb-0031', 'r4', '2026-11-17T10:25:00+07:00', 2150, 'Anas N.', '[{"boltId":"b1","angle":7.9,"confidence":0.86}]'),
('ins-1045', 'sc-0087', 'r6', '2026-11-16T14:02:00+07:00', 3610, 'Erlangga H.', '[{"boltId":"b1","angle":1.2,"confidence":0.9},{"boltId":"b2","angle":-2.4,"confidence":0.89},{"boltId":"b3","angle":4.1,"confidence":0.87}]'),
('ins-1044', 'bc-1904', 'r7', '2026-11-15T09:30:00+07:00', 2990, 'Airi S.', '[{"boltId":"b1","angle":16.3,"confidence":0.84},{"boltId":"b2","angle":0.4,"confidence":0.93},{"boltId":"b3","angle":-6.2,"confidence":0.88}]'),
('ins-1041', 'sc-0142', 'r1', '2026-11-04T10:15:00+07:00', 2870, 'Anas N.', '[{"boltId":"b1","angle":1.2,"confidence":0.92},{"boltId":"b2","angle":5.6,"confidence":0.9},{"boltId":"b3","angle":-9.4,"confidence":0.9}]'),
('ins-1039', 'bc-2210', 'r3', '2026-11-03T15:40:00+07:00', 2640, 'Airi S.', '[{"boltId":"b1","angle":0.5,"confidence":0.94},{"boltId":"b2","angle":-0.9,"confidence":0.93},{"boltId":"b3","angle":1.4,"confidence":0.91}]'),
('ins-1037', 'mb-0031', 'r4', '2026-11-02T09:05:00+07:00', 2410, 'Anas N.', '[{"boltId":"b1","angle":3.1,"confidence":0.88}]'),
('ins-1036', 'sc-0087', 'r6', '2026-11-01T13:20:00+07:00', 3320, 'Erlangga H.', '[{"boltId":"b1","angle":0.4,"confidence":0.91},{"boltId":"b2","angle":-1.1,"confidence":0.9},{"boltId":"b3","angle":2.0,"confidence":0.88}]'),
('ins-1034', 'bc-1904', 'r7', '2026-10-31T11:45:00+07:00', 3050, 'Airi S.', '[{"boltId":"b1","angle":6.1,"confidence":0.9},{"boltId":"b2","angle":0.2,"confidence":0.94},{"boltId":"b3","angle":-2.3,"confidence":0.9}]'),
('ins-1033', 'sc-0142', 'r1', '2026-10-20T08:30:00+07:00', 3110, 'Erlangga H.', '[{"boltId":"b1","angle":0.3,"confidence":0.94},{"boltId":"b2","angle":1.8,"confidence":0.91},{"boltId":"b3","angle":-3.2,"confidence":0.92}]');
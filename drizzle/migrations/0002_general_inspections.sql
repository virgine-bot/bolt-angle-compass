ALTER TABLE public.inspections ALTER COLUMN vehicle_id DROP NOT NULL;
ALTER TABLE public.inspections ALTER COLUMN reference_id DROP NOT NULL;
ALTER TABLE public.inspections ADD COLUMN vehicle_type text NOT NULL DEFAULT 'other'
  CHECK (vehicle_type IN ('motorbike', 'bicycle', 'scooter', 'other'));
ALTER TABLE public.inspections ADD COLUMN area_label text CHECK (char_length(area_label) <= 60);
ALTER TABLE public.inspections ADD COLUMN reference_photo_path text;

UPDATE public.inspections SET vehicle_type = CASE
  WHEN vehicle_id LIKE 'sc-%' THEN 'scooter'
  WHEN vehicle_id LIKE 'bc-%' THEN 'bicycle'
  WHEN vehicle_id LIKE 'mb-%' THEN 'motorbike'
  ELSE 'other' END;

UPDATE public.inspections SET area_label = CASE
  WHEN reference_id IN ('r1', 'r5', 'r6') THEN 'Rear axle & caliper'
  WHEN reference_id IN ('r2', 'r4') THEN 'Front fork clamp'
  WHEN reference_id IN ('r3', 'r7') THEN 'Handlebar stem'
  ELSE area_label END;

CREATE INDEX inspections_type_captured_idx ON public.inspections (vehicle_type, captured_at DESC);
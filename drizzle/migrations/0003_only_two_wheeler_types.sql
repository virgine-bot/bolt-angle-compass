ALTER TABLE public.inspections DROP CONSTRAINT IF EXISTS inspections_vehicle_type_check;
ALTER TABLE public.inspections ALTER COLUMN vehicle_type DROP DEFAULT;
ALTER TABLE public.inspections ADD CONSTRAINT inspections_vehicle_type_check CHECK (vehicle_type IN ('motorbike', 'bicycle', 'scooter'));
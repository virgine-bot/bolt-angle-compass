GRANT SELECT, INSERT ON public.inspections TO anon;

CREATE POLICY "Anyone can view inspections"
  ON public.inspections FOR SELECT TO anon USING (true);

CREATE POLICY "Anyone can add inspections without an account"
  ON public.inspections FOR INSERT TO anon, authenticated
  WITH CHECK (inspector_id IS NULL);

CREATE POLICY "Anyone can view inspection photos"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'inspection-photos');

CREATE POLICY "Anyone can upload inspection photos to the shared folder"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'inspection-photos' AND (storage.foldername(name))[1] = 'shared');
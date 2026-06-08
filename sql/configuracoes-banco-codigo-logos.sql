ALTER TABLE configuracoes
ADD COLUMN IF NOT EXISTS banco_codigo VARCHAR(20);

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS public_read_logos ON storage.objects;
DROP POLICY IF EXISTS admin_insert_logos ON storage.objects;
DROP POLICY IF EXISTS admin_update_logos ON storage.objects;
DROP POLICY IF EXISTS admin_delete_logos ON storage.objects;

CREATE POLICY public_read_logos
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

CREATE POLICY admin_insert_logos
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'logos' AND is_admin());

CREATE POLICY admin_update_logos
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'logos' AND is_admin())
WITH CHECK (bucket_id = 'logos' AND is_admin());

CREATE POLICY admin_delete_logos
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'logos' AND is_admin());

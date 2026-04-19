-- =============================================================================
-- NEXUM — Supabase Storage setup for listing images
-- Run this in: Supabase Dashboard → SQL Editor
-- =============================================================================

-- 1. Create the public 'listings' bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'listings',
    'listings',
    true,                          -- public: anyone can read without auth
    5242880,                       -- 5 MB per file
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
    SET public            = EXCLUDED.public,
        file_size_limit   = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;


-- 2. Public read — anyone (including unauthenticated users) can view images
CREATE POLICY "Public read access on listings bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'listings');


-- 3. Server-side upload — the service role key bypasses RLS automatically,
--    but this policy allows authenticated users too (future direct uploads).
CREATE POLICY "Authenticated users can upload to listings bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listings');


-- 4. Allow authenticated users to replace their own uploads (upsert)
CREATE POLICY "Authenticated users can update their own uploads"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'listings' AND auth.uid() = owner);


-- 5. Allow authenticated users to delete their own uploads
CREATE POLICY "Authenticated users can delete their own uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'listings' AND auth.uid() = owner);

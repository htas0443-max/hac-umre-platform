-- ============================================
-- PRIVATE STORAGE BUCKET FOR LICENSE DOCUMENTS
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Create private bucket for license documents
-- NOTE: Run this via Supabase Dashboard → Storage → Create Bucket
-- Name: license-documents-private
-- Public: OFF (unchecked)

-- 2. Storage policies for private bucket
-- Users can only access their own files

-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload own license"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'license-documents-private' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own files
CREATE POLICY "Users can view own license"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'license-documents-private' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own license"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'license-documents-private' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own license"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'license-documents-private' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Admins can view all license documents
CREATE POLICY "Admins can view all licenses"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'license-documents-private'
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND user_role = 'admin'
    )
);

-- ============================================
-- PRIVATE BUCKET SETUP COMPLETE
-- ============================================
-- IMPORTANT: After running this SQL:
-- 1. Update server.py to use 'license-documents-private' bucket
-- 2. Use create_signed_url() instead of get_public_url()
-- ============================================

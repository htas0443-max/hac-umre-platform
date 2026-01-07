-- ============================================
-- DEVLET ONAYLI İZİN BELGESİ FEATURE
-- License Document Upload for Tour Operators
-- ============================================

-- 1. Add license fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS license_document_url TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS license_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS license_verified_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS license_verified_at TIMESTAMP WITH TIME ZONE;

-- 2. Create storage bucket for license documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'license-documents',
  'license-documents',
  false, -- Private bucket (only authenticated users)
  5242880, -- 5MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS policies for license documents

-- Allow operators to upload their own license
CREATE POLICY "Operators can upload their own license"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'license-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow operators to view their own license
CREATE POLICY "Operators can view their own license"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'license-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all licenses
CREATE POLICY "Admins can view all licenses"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'license-documents'
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND user_role = 'admin'
  )
);

-- Allow operators to delete/update their own license
CREATE POLICY "Operators can delete their own license"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'license-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. RPC function to verify operator license (admin only)
CREATE OR REPLACE FUNCTION verify_operator_license(
    operator_id_param UUID,
    admin_id UUID,
    verified BOOLEAN,
    license_number_param TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = admin_id AND user_role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can verify licenses';
    END IF;
    
    -- Update license verification
    UPDATE public.users
    SET 
        license_verified = verified,
        license_verified_by = admin_id,
        license_verified_at = CASE WHEN verified THEN NOW() ELSE NULL END,
        license_number = COALESCE(license_number_param, license_number)
    WHERE id = operator_id_param AND user_role = 'operator';
    
    RETURN QUERY
    SELECT 
        true AS success,
        CASE 
            WHEN verified THEN 'License verified successfully'
            ELSE 'License verification revoked'
        END::TEXT AS message;
END;
$$;

-- 5. RPC function to get operators pending license verification
CREATE OR REPLACE FUNCTION get_operators_pending_verification()
RETURNS TABLE(
    id UUID,
    email TEXT,
    company_name TEXT,
    license_document_url TEXT,
    license_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.company_name,
        u.license_document_url,
        u.license_number,
        u.created_at
    FROM public.users u
    WHERE 
        u.user_role = 'operator'
        AND u.license_document_url IS NOT NULL
        AND u.license_verified = false
    ORDER BY u.created_at DESC;
END;
$$;

-- 6. Add index for license queries
CREATE INDEX IF NOT EXISTS idx_users_license_verified ON public.users(license_verified) 
WHERE user_role = 'operator';

-- ============================================
-- LICENSE FEATURE COMPLETE
-- ============================================
-- Next: Run this SQL in Supabase Dashboard
-- Then: Update backend and frontend code
-- ============================================

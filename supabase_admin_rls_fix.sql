-- ============================================
-- SEC-008 FIX: Admin RLS Policies
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Admin can view ALL tours (any status)
CREATE POLICY "Admins can view all tours"
ON public.tours FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin')
);

-- 2. Admin can update ALL tours
CREATE POLICY "Admins can update all tours"
ON public.tours FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin')
);

-- 3. Admin can delete ALL tours
CREATE POLICY "Admins can delete all tours"
ON public.tours FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin')
);

-- 4. Admin can view all users
CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin')
);

-- 5. Admin can update all users (for license verification)
CREATE POLICY "Admins can update all users"
ON public.users FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin')
);

-- 6. Admin can view all comparisons (for analytics)
CREATE POLICY "Admins can view all comparisons"
ON public.comparisons FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin')
);

-- 7. Admin can view all chats (for analytics/moderation)
CREATE POLICY "Admins can view all chats"
ON public.chats FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin')
);

-- 8. Admin can manage all import jobs
CREATE POLICY "Admins can view all import jobs"
ON public.import_jobs FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin')
);

-- ============================================
-- SEC-008 ADMIN RLS POLICIES COMPLETE
-- ============================================

-- ============================================
-- HAC & UMRE PLATFORM - SUPABASE DATABASE SCHEMA
-- ============================================
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Create ENUM types
CREATE TYPE user_role AS ENUM ('user', 'operator', 'admin');
CREATE TYPE tour_status AS ENUM ('draft', 'pending', 'approved', 'rejected');

-- 2. Create users table (extends auth.users)
CREATE TABLE public.users (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    user_role user_role DEFAULT 'user',
    company_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create tours table
CREATE TABLE public.tours (
    id BIGSERIAL PRIMARY KEY,
    operator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    operator TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'TRY',
    start_date TEXT,
    end_date TEXT,
    duration TEXT NOT NULL,
    hotel TEXT NOT NULL,
    services TEXT[] NOT NULL DEFAULT '{}',
    visa TEXT NOT NULL,
    transport TEXT NOT NULL,
    guide TEXT NOT NULL,
    itinerary TEXT[] NOT NULL DEFAULT '{}',
    rating NUMERIC(2, 1),
    source TEXT DEFAULT 'manual',
    status tour_status DEFAULT 'draft',
    created_by TEXT,
    approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    approval_reason TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Create comparisons table
CREATE TABLE public.comparisons (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tour_ids TEXT[] NOT NULL,
    criteria TEXT[] NOT NULL,
    ai_provider TEXT NOT NULL DEFAULT 'anthropic',
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Create chats table
CREATE TABLE public.chats (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    context_tour_ids TEXT[] DEFAULT '{}',
    ai_provider TEXT NOT NULL DEFAULT 'anthropic',
    answer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Create import_jobs table
CREATE TABLE public.import_jobs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    filename TEXT,
    status TEXT DEFAULT 'pending',
    imported_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Create indexes for performance
CREATE INDEX idx_tours_operator_id ON public.tours(operator_id);
CREATE INDEX idx_tours_status ON public.tours(status);
CREATE INDEX idx_tours_created_at ON public.tours(created_at DESC);
CREATE INDEX idx_tours_price ON public.tours(price);
CREATE INDEX idx_comparisons_user_id ON public.comparisons(user_id);
CREATE INDEX idx_chats_user_id ON public.chats(user_id);

-- 8. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for users table
CREATE POLICY "Users can view their own profile"
ON public.users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 10. RLS Policies for tours table

-- Users can view approved tours
CREATE POLICY "Users can view approved tours"
ON public.tours FOR SELECT
TO authenticated
USING (status = 'approved');

-- Operators can view their own tours (all statuses)
CREATE POLICY "Operators can view own tours"
ON public.tours FOR SELECT
TO authenticated
USING (operator_id = auth.uid());

-- Operators can create tours
CREATE POLICY "Operators can create tours"
ON public.tours FOR INSERT
TO authenticated
WITH CHECK (operator_id = auth.uid());

-- Operators can update their own tours
CREATE POLICY "Operators can update own tours"
ON public.tours FOR UPDATE
TO authenticated
USING (operator_id = auth.uid())
WITH CHECK (operator_id = auth.uid());

-- Operators can delete their own tours
CREATE POLICY "Operators can delete own tours"
ON public.tours FOR DELETE
TO authenticated
USING (operator_id = auth.uid());

-- 11. RLS Policies for comparisons
CREATE POLICY "Users can view own comparisons"
ON public.comparisons FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create comparisons"
ON public.comparisons FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comparisons"
ON public.comparisons FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 12. RLS Policies for chats
CREATE POLICY "Users can view own chats"
ON public.chats FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create chats"
ON public.chats FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 13. RLS Policies for import_jobs
CREATE POLICY "Users can view own import jobs"
ON public.import_jobs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create import jobs"
ON public.import_jobs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 14. Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, user_role, company_name)
  VALUES (
    new.id,
    new.email,
    COALESCE((new.raw_user_meta_data->>'user_role')::user_role, 'user'),
    new.raw_user_meta_data->>'company_name'
  );
  RETURN new;
END;
$$;

-- 15. Trigger to automatically create user profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 16. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 17. Add updated_at triggers
CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_tours
    BEFORE UPDATE ON public.tours
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- SCHEMA CREATION COMPLETE
-- ============================================
-- Next: Run backend with Supabase client
-- ============================================

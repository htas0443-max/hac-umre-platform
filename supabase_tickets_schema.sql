-- ============================================
-- SUPPORT TICKET SYSTEM - DATABASE SCHEMA
-- ============================================
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Create ticket status enum
DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM ('open', 'pending', 'resolved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create ticket priority enum
DO $$ BEGIN
    CREATE TYPE ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status ticket_status DEFAULT 'open',
    priority ticket_priority DEFAULT 'normal',
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create ticket messages table
CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create ticket attachments table
CREATE TABLE IF NOT EXISTS public.ticket_attachments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);

-- 7. Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for tickets

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
ON public.tickets FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
ON public.tickets FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND user_role = 'admin'
    )
);

-- Users can create tickets
CREATE POLICY "Users can create tickets"
ON public.tickets FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own tickets (close them)
CREATE POLICY "Users can update own tickets"
ON public.tickets FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Admins can update any ticket
CREATE POLICY "Admins can update any ticket"
ON public.tickets FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND user_role = 'admin'
    )
);

-- 9. RLS Policies for ticket_messages

-- Users can view messages on their tickets
CREATE POLICY "Users can view own ticket messages"
ON public.ticket_messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.tickets 
        WHERE id = ticket_id AND user_id = auth.uid()
    )
);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
ON public.ticket_messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND user_role = 'admin'
    )
);

-- Users can create messages on their tickets
CREATE POLICY "Users can create messages on own tickets"
ON public.ticket_messages FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.tickets 
        WHERE id = ticket_id AND user_id = auth.uid()
    )
);

-- Admins can create messages on any ticket
CREATE POLICY "Admins can create messages on any ticket"
ON public.ticket_messages FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND user_role = 'admin'
    )
);

-- 10. Updated_at trigger for tickets
CREATE OR REPLACE TRIGGER set_updated_at_tickets
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- SCHEMA COMPLETE
-- ============================================

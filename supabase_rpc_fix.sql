-- Fix RPC JSON response issues

-- 1. Fixed approve_tour function
CREATE OR REPLACE FUNCTION approve_tour(
    tour_id_param BIGINT,
    admin_id UUID,
    approval_reason_param TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT, tour_id BIGINT, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = admin_id AND user_role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can approve tours';
    END IF;
    
    -- Update tour status
    UPDATE public.tours
    SET 
        status = 'approved',
        approved_by = admin_id,
        approval_reason = approval_reason_param,
        updated_at = NOW()
    WHERE id = tour_id_param;
    
    -- Return simple table result
    RETURN QUERY
    SELECT 
        true AS success,
        'Tour approved'::TEXT AS message,
        tour_id_param AS tour_id,
        'approved'::TEXT AS status;
END;
$$;

-- 2. Fixed reject_tour function
CREATE OR REPLACE FUNCTION reject_tour(
    tour_id_param BIGINT,
    admin_id UUID,
    rejection_reason_param TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT, tour_id BIGINT, status TEXT, rejection_reason TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = admin_id AND user_role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can reject tours';
    END IF;
    
    -- Update tour status
    UPDATE public.tours
    SET 
        status = 'rejected',
        approved_by = admin_id,
        rejection_reason = rejection_reason_param,
        updated_at = NOW()
    WHERE id = tour_id_param;
    
    -- Return simple table result
    RETURN QUERY
    SELECT 
        true AS success,
        'Tour rejected'::TEXT AS message,
        tour_id_param AS tour_id,
        'rejected'::TEXT AS status,
        rejection_reason_param AS rejection_reason;
END;
$$;

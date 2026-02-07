-- ============================================
-- SUPABASE RPC FUNCTIONS
-- Advanced queries and business logic
-- ============================================

-- 1. Get operator dashboard stats
CREATE OR REPLACE FUNCTION get_operator_stats(operator_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_tours', COUNT(*),
        'approved_tours', COUNT(*) FILTER (WHERE status = 'approved'),
        'pending_tours', COUNT(*) FILTER (WHERE status = 'pending'),
        'draft_tours', COUNT(*) FILTER (WHERE status = 'draft'),
        'rejected_tours', COUNT(*) FILTER (WHERE status = 'rejected')
    )
    INTO result
    FROM public.tours
    WHERE operator_id = operator_user_id;
    
    RETURN result;
END;
$$;

-- 2. Get tours with filters (advanced search)
CREATE OR REPLACE FUNCTION search_tours(
    min_price NUMERIC DEFAULT 0,
    max_price NUMERIC DEFAULT 999999,
    operator_name TEXT DEFAULT '',
    status_filter tour_status DEFAULT 'approved',
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS SETOF public.tours
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.tours
    WHERE 
        price >= min_price
        AND price <= max_price
        AND (operator_name = '' OR operator ILIKE '%' || operator_name || '%')
        AND status = status_filter
    ORDER BY created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- 3. Approve tour (admin function)
CREATE OR REPLACE FUNCTION approve_tour(
    tour_id_param BIGINT,
    admin_id UUID,
    approval_reason_param TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_tour public.tours;
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
    WHERE id = tour_id_param
    RETURNING * INTO updated_tour;
    
    IF updated_tour IS NULL THEN
        RAISE EXCEPTION 'Tour not found';
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Tour approved',
        'tour_id', updated_tour.id,
        'status', updated_tour.status
    );
END;
$$;

-- 4. Reject tour (admin function)
CREATE OR REPLACE FUNCTION reject_tour(
    tour_id_param BIGINT,
    admin_id UUID,
    rejection_reason_param TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_tour public.tours;
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
    WHERE id = tour_id_param
    RETURNING * INTO updated_tour;
    
    IF updated_tour IS NULL THEN
        RAISE EXCEPTION 'Tour not found';
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Tour rejected',
        'tour_id', updated_tour.id,
        'status', updated_tour.status,
        'rejection_reason', updated_tour.rejection_reason
    );
END;
$$;

-- 5. Get pending tours (admin dashboard)
CREATE OR REPLACE FUNCTION get_pending_tours()
RETURNS SETOF public.tours
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.tours
    WHERE status = 'pending'
    ORDER BY created_at ASC;
END;
$$;

-- 6. Get user comparisons with tour details
CREATE OR REPLACE FUNCTION get_user_comparisons_with_tours(user_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT json_agg(
            json_build_object(
                'id', c.id,
                'tour_ids', c.tour_ids,
                'criteria', c.criteria,
                'ai_provider', c.ai_provider,
                'result', c.result,
                'created_at', c.created_at
            )
        )
        FROM public.comparisons c
        WHERE c.user_id = user_id_param
        ORDER BY c.created_at DESC
    );
END;
$$;

-- 7. Get tour count by status
CREATE OR REPLACE FUNCTION get_tour_count_by_status()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT json_build_object(
            'total', COUNT(*),
            'approved', COUNT(*) FILTER (WHERE status = 'approved'),
            'pending', COUNT(*) FILTER (WHERE status = 'pending'),
            'draft', COUNT(*) FILTER (WHERE status = 'draft'),
            'rejected', COUNT(*) FILTER (WHERE status = 'rejected')
        )
        FROM public.tours
    );
END;
$$;

-- 8. Check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(
    user_id_param UUID,
    required_role user_role
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role_value user_role;
BEGIN
    SELECT user_role INTO user_role_value
    FROM public.users
    WHERE id = user_id_param;
    
    RETURN user_role_value = required_role OR user_role_value = 'admin';
END;
$$;

-- 9. Get tours for comparison (with details)
CREATE OR REPLACE FUNCTION get_tours_for_comparison(tour_ids_param TEXT[])
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT json_agg(
            json_build_object(
                'id', id,
                'title', title,
                'operator', operator,
                'price', price,
                'currency', currency,
                'duration', duration,
                'hotel', hotel,
                'services', services,
                'visa', visa,
                'transport', transport,
                'guide', guide,
                'itinerary', itinerary,
                'rating', rating
            )
        )
        FROM public.tours
        WHERE id::TEXT = ANY(tour_ids_param)
        AND status = 'approved'
    );
END;
$$;

-- 10. Create tour with validation
CREATE OR REPLACE FUNCTION create_tour_with_validation(
    operator_id_param UUID,
    tour_data JSON
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_tour_id BIGINT;
    company_name_value TEXT;
BEGIN
    -- Get operator company name
    SELECT company_name INTO company_name_value
    FROM public.users
    WHERE id = operator_id_param AND user_role = 'operator';
    
    IF company_name_value IS NULL THEN
        RAISE EXCEPTION 'Operator company name not found';
    END IF;
    
    -- Insert tour
    INSERT INTO public.tours (
        operator_id, title, operator, price, currency, start_date, end_date,
        duration, hotel, services, visa, transport, guide, itinerary,
        rating, source, status, created_by
    )
    VALUES (
        operator_id_param,
        tour_data->>'title',
        company_name_value,
        (tour_data->>'price')::NUMERIC,
        COALESCE(tour_data->>'currency', 'TRY'),
        tour_data->>'start_date',
        tour_data->>'end_date',
        tour_data->>'duration',
        tour_data->>'hotel',
        ARRAY(SELECT json_array_elements_text(tour_data->'services')),
        tour_data->>'visa',
        tour_data->>'transport',
        tour_data->>'guide',
        ARRAY(SELECT json_array_elements_text(tour_data->'itinerary')),
        (tour_data->>'rating')::NUMERIC,
        COALESCE(tour_data->>'source', 'operator'),
        'pending',
        (SELECT email FROM auth.users WHERE id = operator_id_param)
    )
    RETURNING id INTO new_tour_id;
    
    RETURN json_build_object(
        'success', true,
        'tour_id', new_tour_id,
        'message', 'Tur oluşturuldu ve onay bekliyor'
    );
END;
$$;

-- ============================================
-- RPC FUNCTIONS COMPLETE
-- ============================================

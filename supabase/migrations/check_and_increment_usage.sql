
-- Function to check and increment usage limits based on subscription tier
CREATE OR REPLACE FUNCTION public.check_and_increment_usage(p_user_id uuid, p_action text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_tier subscription_tier;
    v_current_usage integer;
    v_max_limit integer;
    v_increment_count integer;
BEGIN
    -- Get user's subscription tier
    SELECT tier INTO v_tier
    FROM public.user_subscriptions
    WHERE user_id = p_user_id;

    -- Get current usage
    SELECT CASE 
        WHEN p_action = 'ideas' THEN ideas_generated
        WHEN p_action = 'scripts' THEN scripts_generated
        WHEN p_action = 'hooks' THEN hooks_generated
        ELSE 0
    END INTO v_current_usage
    FROM public.user_daily_usage
    WHERE user_id = p_user_id AND date = CURRENT_DATE;

    -- If no record exists yet, initialize usage to 0
    IF v_current_usage IS NULL THEN
        v_current_usage := 0;
    END IF;

    -- Set max limit based on tier and action
    IF p_action = 'ideas' THEN
        v_max_limit := CASE 
            WHEN v_tier = 'free' THEN 5  -- Updated to match new limits
            WHEN v_tier = 'pro' THEN 50
            WHEN v_tier = 'plus' THEN 50
            WHEN v_tier = 'business' THEN 100 -- Updated from unlimited to 100
            ELSE 5  -- Updated default to match free tier
        END;
        -- For ideas, increment by 5
        v_increment_count := 5;
    ELSIF p_action = 'scripts' THEN
        v_max_limit := CASE 
            WHEN v_tier = 'free' THEN 1
            WHEN v_tier = 'pro' THEN 10
            WHEN v_tier = 'plus' THEN 10
            WHEN v_tier = 'business' THEN 20 -- Updated from unlimited to 20
            ELSE 1
        END;
        v_increment_count := 1;
    ELSIF p_action = 'hooks' THEN
        v_max_limit := CASE 
            WHEN v_tier = 'free' THEN 4
            WHEN v_tier = 'pro' THEN 20
            WHEN v_tier = 'plus' THEN 20
            WHEN v_tier = 'business' THEN 40 -- Updated from unlimited to 40
            ELSE 4
        END;
        v_increment_count := 1;
    ELSE
        v_increment_count := 1;
    END IF;

    -- Check if under limit
    IF v_current_usage >= v_max_limit THEN
        RETURN false;
    END IF;

    -- Insert or update usage
    INSERT INTO public.user_daily_usage (user_id, date, ideas_generated, scripts_generated, hooks_generated)
    VALUES (
        p_user_id,
        CURRENT_DATE,
        CASE WHEN p_action = 'ideas' THEN v_increment_count ELSE 0 END,
        CASE WHEN p_action = 'scripts' THEN v_increment_count ELSE 0 END,
        CASE WHEN p_action = 'hooks' THEN v_increment_count ELSE 0 END
    )
    ON CONFLICT (user_id, date) DO UPDATE
    SET 
        ideas_generated = CASE 
            WHEN p_action = 'ideas' THEN user_daily_usage.ideas_generated + v_increment_count
            ELSE user_daily_usage.ideas_generated
        END,
        scripts_generated = CASE 
            WHEN p_action = 'scripts' THEN user_daily_usage.scripts_generated + v_increment_count
            ELSE user_daily_usage.scripts_generated
        END,
        hooks_generated = CASE 
            WHEN p_action = 'hooks' THEN user_daily_usage.hooks_generated + v_increment_count
            ELSE user_daily_usage.hooks_generated
        END;

    RETURN true;
END;
$function$;

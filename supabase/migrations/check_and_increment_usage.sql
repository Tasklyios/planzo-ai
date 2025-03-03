
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
BEGIN
    -- Get user's subscription tier
    SELECT tier INTO v_tier
    FROM public.user_subscriptions
    WHERE user_id = p_user_id;

    -- Business tier users always return true (unlimited usage)
    IF v_tier = 'business' THEN
        RETURN true;
    END IF;

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
            WHEN v_tier = 'free' THEN 5
            WHEN v_tier = 'pro' THEN 20
            WHEN v_tier = 'plus' THEN 50
            WHEN v_tier = 'business' THEN 99999 -- Should not reach here but added as fallback
            ELSE 5
        END;
    ELSIF p_action = 'scripts' THEN
        v_max_limit := CASE 
            WHEN v_tier = 'free' THEN 3
            WHEN v_tier = 'pro' THEN 10
            WHEN v_tier = 'plus' THEN 25
            WHEN v_tier = 'business' THEN 99999 -- Should not reach here but added as fallback
            ELSE 3
        END;
    ELSIF p_action = 'hooks' THEN
        v_max_limit := CASE 
            WHEN v_tier = 'free' THEN 5
            WHEN v_tier = 'pro' THEN 15
            WHEN v_tier = 'plus' THEN 30
            WHEN v_tier = 'business' THEN 99999 -- Should not reach here but added as fallback
            ELSE 5
        END;
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
        CASE WHEN p_action = 'ideas' THEN 1 ELSE 0 END,
        CASE WHEN p_action = 'scripts' THEN 1 ELSE 0 END,
        CASE WHEN p_action = 'hooks' THEN 1 ELSE 0 END
    )
    ON CONFLICT (user_id, date) DO UPDATE
    SET 
        ideas_generated = CASE 
            WHEN p_action = 'ideas' THEN user_daily_usage.ideas_generated + 1
            ELSE user_daily_usage.ideas_generated
        END,
        scripts_generated = CASE 
            WHEN p_action = 'scripts' THEN user_daily_usage.scripts_generated + 1
            ELSE user_daily_usage.scripts_generated
        END,
        hooks_generated = CASE 
            WHEN p_action = 'hooks' THEN user_daily_usage.hooks_generated + 1
            ELSE user_daily_usage.hooks_generated
        END;

    RETURN true;
END;
$function$;

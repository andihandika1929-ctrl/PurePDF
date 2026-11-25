-- PurePDF Security Hardening Migration
-- Enables strict Row Level Security (RLS), blocks direct client tampering of
-- credits/VVIP/role columns, and adds an atomic credit consumption RPC.

-- 1. Ensure usage_logs columns exist
ALTER TABLE IF EXISTS public.usage_logs
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tool_slug text,
  ADD COLUMN IF NOT EXISTS is_pro boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS credits_spent integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 2. Enable RLS on profiles and usage_logs
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- 3. Drop overly permissive legacy policies if present
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- 4. Strict profiles RLS policies
-- Users can ONLY read their own profile row
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can ONLY insert their own profile row with safe non-privileged defaults
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND COALESCE(credits, 0) <= 10
    AND COALESCE(is_vvip, false) = false
    AND COALESCE(role, 'user') = 'user'
  );

-- Users can update their own row (privileged columns are locked by trigger below)
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Column-level protection trigger: prevent non-service-role sessions from
-- modifying credits, is_vvip, vvip_expires_at, role, or daily_ai_used directly.
CREATE OR REPLACE FUNCTION public.prevent_privileged_profile_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role (backend/admin API/webhooks) and postgres superuser
  IF current_setting('role', true) = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.credits IS DISTINCT FROM OLD.credits
     OR NEW.is_vvip IS DISTINCT FROM OLD.is_vvip
     OR NEW.vvip_expires_at IS DISTINCT FROM OLD.vvip_expires_at
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.daily_ai_used IS DISTINCT FROM OLD.daily_ai_used THEN
    RAISE EXCEPTION 'Direct modification of privileged billing/role columns is forbidden.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_privileged_profile_mutation ON public.profiles;
CREATE TRIGGER trg_prevent_privileged_profile_mutation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_privileged_profile_mutation();

-- 6. Strict usage_logs RLS policies
DROP POLICY IF EXISTS "usage_logs_insert_authenticated" ON public.usage_logs;
DROP POLICY IF EXISTS "usage_logs_select_own" ON public.usage_logs;

CREATE POLICY "usage_logs_insert_authenticated"
  ON public.usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "usage_logs_select_own"
  ON public.usage_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 7. Atomic Credit & AI Quota Consumption RPC (Row-Level FOR UPDATE Lock)
CREATE OR REPLACE FUNCTION public.consume_ai_quota_atomic(
  p_user_id uuid,
  p_cost integer DEFAULT 2
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_today date := (now() AT TIME ZONE 'utc')::date;
  v_last_reset date;
  v_daily_used integer;
  v_is_vvip_active boolean;
  v_new_credits integer;
BEGIN
  -- Ensure caller can only consume their own quota unless service_role
  IF current_setting('role', true) <> 'service_role' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object('allowed', false, 'error_reason', 'forbidden');
  END IF;

  IF p_cost < 0 THEN
    RETURN jsonb_build_object('allowed', false, 'error_reason', 'invalid_cost');
  END IF;

  -- Lock row to prevent concurrent double-spend race conditions
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'error_reason', 'profile_not_found');
  END IF;

  -- 1. Admin / Unlimited role bypasses credit deduction
  IF v_profile.role IN ('admin', 'unlimited') THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'quota_type', 'unlimited',
      'daily_used', COALESCE(v_profile.daily_ai_used, 0),
      'credits_remaining', v_profile.credits
    );
  END IF;

  -- Reset daily counter if new UTC day
  v_last_reset := COALESCE((v_profile.last_ai_reset)::date, v_today);
  v_daily_used := CASE WHEN v_last_reset = v_today THEN COALESCE(v_profile.daily_ai_used, 0) ELSE 0 END;

  -- 2. Active VVIP member: 15 free daily ops, then backup credits
  v_is_vvip_active := COALESCE(v_profile.is_vvip, false)
    AND (v_profile.vvip_expires_at IS NULL OR v_profile.vvip_expires_at > now());

  IF v_is_vvip_active THEN
    IF v_daily_used < 15 THEN
      UPDATE public.profiles
      SET daily_ai_used = v_daily_used + 1,
          last_ai_reset = v_today,
          updated_at = now()
      WHERE id = p_user_id;

      RETURN jsonb_build_object(
        'allowed', true,
        'quota_type', 'vvip_daily',
        'daily_used', v_daily_used + 1,
        'credits_remaining', v_profile.credits
      );
    END IF;

    IF v_profile.credits >= p_cost THEN
      v_new_credits := v_profile.credits - p_cost;
      UPDATE public.profiles
      SET credits = v_new_credits,
          daily_ai_used = 15,
          last_ai_reset = v_today,
          updated_at = now()
      WHERE id = p_user_id AND credits >= p_cost;

      RETURN jsonb_build_object(
        'allowed', true,
        'quota_type', 'vvip_backup',
        'daily_used', 15,
        'credits_remaining', v_new_credits
      );
    END IF;

    RETURN jsonb_build_object(
      'allowed', false,
      'error_reason', 'daily_and_credits_exhausted',
      'daily_used', 15,
      'credits_remaining', v_profile.credits
    );
  END IF;

  -- 3. Regular user: atomic deduction WHERE credits >= p_cost
  IF v_profile.credits >= p_cost THEN
    v_new_credits := v_profile.credits - p_cost;
    UPDATE public.profiles
    SET credits = v_new_credits,
        updated_at = now()
    WHERE id = p_user_id AND credits >= p_cost;

    RETURN jsonb_build_object(
      'allowed', true,
      'quota_type', 'free_credits',
      'daily_used', 0,
      'credits_remaining', v_new_credits
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', false,
    'error_reason', 'insufficient_credits',
    'daily_used', 0,
    'credits_remaining', v_profile.credits
  );
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_quota_atomic(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota_atomic(uuid, integer) TO authenticated, service_role;

// frontend/src/lib/supabaseClient.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return clientInstance;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  credits: number;
  is_vvip: boolean;
  is_unlimited?: boolean;
  vvip_expires_at?: string | null;
  role?: string;
  is_admin?: boolean;
  daily_ai_used?: number;
  last_ai_reset?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UsageLog {
  id?: string;
  tool_slug: string;
  is_pro: boolean;
  credits_spent: number;
  created_at: string;
}

/**
 * Sign in using Google OAuth with explicit callback redirect
 */
export async function signInWithGoogle() {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('Supabase not configured, simulating Google login in local development');
    return {
      simulated: true,
      user: {
        id: 'usr_mock_' + Math.random().toString(36).substring(2, 8),
        email: 'user@purepdf.app',
        full_name: 'Demo User',
      },
    };
  }

  const redirectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : undefined;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  });

  if (error) {
    console.error('Supabase Google OAuth error:', error);
    throw error;
  }
  return data;
}

/**
 * Sign in using Email and Password with auto-fallback to server authentication
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('Supabase not configured, simulating Email login in local development');
    return {
      simulated: true,
      user: {
        id: 'usr_mock_' + Math.random().toString(36).substring(2, 8),
        email,
        full_name: email.split('@')[0],
      },
    };
  }

  // 1. First attempt native client login
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!error && data?.session) {
    return data;
  }

  // 2. If provider is disabled in GoTrue config, fallback seamlessly to server auth
  const errorMsg = error?.message?.toLowerCase() || '';
  const errorCode = (error as any)?.code || (error as any)?.error_code || '';
  const isProviderDisabled =
    errorMsg.includes('email logins are disabled') ||
    errorMsg.includes('email signups are disabled') ||
    errorCode === 'email_provider_disabled';

  if (isProviderDisabled || error) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const resJson = await res.json();
      if (!res.ok || resJson.error) {
        throw new Error(resJson.error || 'Email atau kata sandi tidak valid.');
      }

      if (resJson.otp) {
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: resJson.otp,
          type: 'magiclink',
        });
        if (verifyError) throw verifyError;
        return verifyData;
      }
    } catch (fallbackErr: any) {
      throw fallbackErr;
    }
  }

  throw error;
}

/**
 * Register new user with Email, Password, and Full Name
 * Uses robust server-side registration endpoint with direct OTP session exchange
 */
export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('Supabase not configured, simulating Sign Up in local development');
    return {
      simulated: true,
      user: {
        id: 'usr_mock_' + Math.random().toString(36).substring(2, 8),
        email,
        full_name: fullName,
      },
    };
  }

  // Call robust server registration API
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName }),
  });

  const resJson = await res.json();
  if (!res.ok || resJson.error) {
    throw new Error(resJson.error || 'Pendaftaran akun gagal.');
  }

  // Exchange OTP for valid browser Supabase session
  if (resJson.otp) {
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: resJson.otp,
      type: 'magiclink',
    });

    if (verifyError) {
      console.warn('OTP exchange notice:', verifyError);
      return resJson;
    }

    return verifyData;
  }

  return resJson;
}

/**
 * Request password reset email
 */
export async function resetPasswordForEmail(email: string) {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('Supabase not configured, simulating password reset in local development');
    return { simulated: true };
  }

  const redirectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/reset-password`
    : undefined;

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  if (error) {
    console.error('Supabase reset password error:', error);
    throw error;
  }
  return data;
}

/**
 * Update current user's password with client & server fallback
 */
export async function updateUserPassword(password: string, userId?: string) {
  const supabase = getSupabase();
  if (password.length < 6) {
    throw new Error('Kata sandi minimal 6 karakter.');
  }

  // 1. Try native client update
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      if (!error && data?.user) return data;
    } catch {}
  }

  // 2. Fallback to server endpoint
  const res = await fetch('/api/auth/update-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, userId }),
  });

  const resJson = await res.json();
  if (!res.ok || resJson.error) {
    throw new Error(resJson.error || 'Gagal mengubah kata sandi.');
  }
  return resJson;
}

/**
 * Sign out
 */
export async function signOutUser() {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
  }
}

function mapDbRowToProfile(row: any, adminEmail: string): UserProfile {
  const isAdm = Boolean(row.role === 'admin' || (row.email && row.email.toLowerCase() === adminEmail.toLowerCase()));
  const isUnl = Boolean(row.is_unlimited || isAdm || row.role === 'unlimited');
  const today = new Date().toISOString().split('T')[0];
  const lastReset = row.last_ai_reset ? String(row.last_ai_reset).split('T')[0] : today;
  const dailyUsed = lastReset === today ? (Number(row.daily_ai_used) || 0) : 0;

  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name || (row.email ? row.email.split('@')[0] : 'User'),
    avatar_url: row.avatar_url,
    credits: Number(row.credits) || 0,
    is_vvip: Boolean(row.is_vvip),
    vvip_expires_at: row.vvip_expires_at,
    role: isAdm ? 'admin' : (row.role || 'user'),
    is_admin: isAdm,
    is_unlimited: isUnl,
    daily_ai_used: dailyUsed,
    last_ai_reset: today,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Auto-sync or create profile in `profiles` table upon login
 */
export async function syncUserProfile(
  user: { id: string; email?: string; full_name?: string },
  initialCredits = 10
): Promise<UserProfile> {
  const supabase = getSupabase();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'andihandika1929@gmail.com';
  const isAdmin = Boolean(user.email && user.email.toLowerCase() === adminEmail.toLowerCase());

  const defaultProfile: UserProfile = {
    id: user.id,
    email: user.email || 'user@purepdf.app',
    full_name: user.full_name || (user.email ? user.email.split('@')[0] : 'User'),
    credits: isAdmin ? 99999 : initialCredits, // 10 starter credits for regular users
    is_vvip: isAdmin ? true : false,
    is_unlimited: isAdmin ? true : false,
    role: isAdmin ? 'admin' : 'user',
    is_admin: isAdmin,
    created_at: new Date().toISOString(),
  };

  if (!supabase) {
    // Read or initialize from localStorage for offline development
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`purepdf_profile_${user.id}`);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
      localStorage.setItem(`purepdf_profile_${user.id}`, JSON.stringify(defaultProfile));
    }
    return defaultProfile;
  }

  try {
    // 1. Check existing profile by ID
    const { data: existing, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existing) {
      const prof = mapDbRowToProfile(existing, adminEmail);
      // Auto-elevate admin if email matches
      if (isAdmin && (!prof.is_vvip || prof.role !== 'admin' || !prof.is_admin)) {
        prof.is_vvip = true;
        prof.is_unlimited = true;
        prof.role = 'admin';
        prof.is_admin = true;
        await supabase
          .from('profiles')
          .update({ is_vvip: true, role: 'admin' })
          .eq('id', user.id);
      }
      return prof;
    }

    // 2. Fallback check by email (in case profile was created with alternate id)
    if (user.email) {
      const { data: byEmail } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .single();

      if (byEmail) {
        return mapDbRowToProfile(byEmail, adminEmail);
      }
    }

    // 3. Insert new profile with valid database columns
    const insertPayload = {
      id: user.id,
      email: user.email || 'user@purepdf.app',
      full_name: user.full_name || (user.email ? user.email.split('@')[0] : 'User'),
      credits: isAdmin ? 99999 : initialCredits,
      is_vvip: isAdmin ? true : false,
      role: isAdmin ? 'admin' : 'user',
    };

    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .insert([insertPayload])
      .select('*')
      .single();

    if (insertError) {
      console.warn('Could not insert profile to Supabase, fallback to default:', insertError);
      return defaultProfile;
    }

    return inserted ? mapDbRowToProfile(inserted, adminEmail) : defaultProfile;
  } catch (err) {
    console.warn('Profile sync error:', err);
    return defaultProfile;
  }
}

/**
 * Persist credit updates to Supabase profiles table
 */
export async function updateUserCredits(userId: string, newCredits: number) {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('profiles').update({ credits: newCredits }).eq('id', userId);
    } catch (e) {
      console.warn('Could not update user credits in Supabase:', e);
    }
  }
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(`purepdf_profile_${userId}`);
    if (raw) {
      try {
        const p = JSON.parse(raw);
        p.credits = newCredits;
        localStorage.setItem(`purepdf_profile_${userId}`, JSON.stringify(p));
      } catch {}
    }
  }
}

/**
 * Persist VVIP activation to Supabase profiles table
 */
export async function updateUserVvip(userId: string, isVvip: boolean, expiryDays = 30) {
  const supabase = getSupabase();
  const vvipExpiry = isVvip
    ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  if (supabase) {
    try {
      await supabase
        .from('profiles')
        .update({ is_vvip: isVvip, vvip_expires_at: vvipExpiry })
        .eq('id', userId);
    } catch (e) {
      console.warn('Could not update user VVIP in Supabase:', e);
    }
  }
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(`purepdf_profile_${userId}`);
    if (raw) {
      try {
        const p = JSON.parse(raw);
        p.is_vvip = isVvip;
        p.vvip_expires_at = vvipExpiry;
        localStorage.setItem(`purepdf_profile_${userId}`, JSON.stringify(p));
      } catch {}
    }
  }
}

export interface QuotaCheckResult {
  allowed: boolean;
  quotaType?: 'unlimited' | 'vvip_daily' | 'vvip_backup' | 'free_credits';
  dailyUsed?: number;
  creditsRemaining?: number;
  errorReason?: 'insufficient_credits' | 'not_logged_in' | 'daily_and_credits_exhausted';
}

/**
 * Hybrid PRO AI Quota Consumer:
 * - Unlimited: Free & uncapped
 * - VVIP (active): 15 free daily operations -> then 2 backup credits per op
 * - Free: 2 credits per op
 */
export async function consumeAiQuota(
  user: UserProfile | null,
  cost = 2
): Promise<QuotaCheckResult> {
  if (!user) {
    return { allowed: false, errorReason: 'not_logged_in' };
  }

  const supabase = getSupabase();
  const today = new Date().toISOString().split('T')[0];

  // 1. Unlimited access
  if (user.is_unlimited || user.role === 'admin' || user.is_admin) {
    return {
      allowed: true,
      quotaType: 'unlimited',
      dailyUsed: user.daily_ai_used || 0,
      creditsRemaining: user.credits,
    };
  }

  // Calculate current daily used with day-reset
  const lastReset = user.last_ai_reset ? String(user.last_ai_reset).split('T')[0] : today;
  const currentDailyUsed = lastReset === today ? (user.daily_ai_used || 0) : 0;

  // 2. Active VVIP Member
  const isVvipActive = user.is_vvip && (!user.vvip_expires_at || new Date(user.vvip_expires_at) > new Date());
  if (isVvipActive) {
    if (currentDailyUsed < 15) {
      const newDailyUsed = currentDailyUsed + 1;
      if (supabase) {
        try {
          await supabase.from('profiles').update({
            daily_ai_used: newDailyUsed,
            last_ai_reset: today,
            updated_at: new Date().toISOString(),
          }).eq('id', user.id);
        } catch (e) {
          console.warn('Could not update daily_ai_used in Supabase:', e);
        }
      }
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`purepdf_profile_${user.id}`);
        if (stored) {
          try {
            const p = JSON.parse(stored);
            p.daily_ai_used = newDailyUsed;
            p.last_ai_reset = today;
            localStorage.setItem(`purepdf_profile_${user.id}`, JSON.stringify(p));
          } catch {}
        }
      }
      return {
        allowed: true,
        quotaType: 'vvip_daily',
        dailyUsed: newDailyUsed,
        creditsRemaining: user.credits,
      };
    }

    // Daily 15x exhausted: Deduct 2 backup credits
    if (user.credits >= cost) {
      const newCredits = user.credits - cost;
      await updateUserCredits(user.id, newCredits);
      return {
        allowed: true,
        quotaType: 'vvip_backup',
        dailyUsed: 15,
        creditsRemaining: newCredits,
      };
    }

    return {
      allowed: false,
      errorReason: 'daily_and_credits_exhausted',
      dailyUsed: 15,
      creditsRemaining: user.credits,
    };
  }

  // 3. Regular Free user: Deduct 2 credits
  if (user.credits >= cost) {
    const newCredits = user.credits - cost;
    await updateUserCredits(user.id, newCredits);
    return {
      allowed: true,
      quotaType: 'free_credits',
      dailyUsed: 0,
      creditsRemaining: newCredits,
    };
  }

  return {
    allowed: false,
    errorReason: 'insufficient_credits',
    dailyUsed: 0,
    creditsRemaining: user.credits,
  };
}

/**
 * Log tool usage to `usage_logs` without storing user files
 */
export async function recordToolUsage(toolSlug: string, isPro: boolean, creditsSpent = 0) {
  const supabase = getSupabase();
  const logEntry: UsageLog = {
    tool_slug: toolSlug,
    is_pro: isPro,
    credits_spent: creditsSpent,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      await supabase.from('usage_logs').insert([logEntry]);
    } catch (e) {
      console.warn('Could not record usage to Supabase', e);
    }
  }

  // Also maintain local memory count for instant analytics
  if (typeof window !== 'undefined') {
    try {
      const history: UsageLog[] = JSON.parse(localStorage.getItem('purepdf_usage_history') || '[]');
      history.unshift(logEntry);
      localStorage.setItem('purepdf_usage_history', JSON.stringify(history.slice(0, 100)));
    } catch {}
  }
}

export { recordToolUsage as recordUsageLog };

/**
 * Admin: Get usage statistics from `usage_logs`
 */
export async function getUsageAnalytics(): Promise<{
  totalOperations: number;
  freeOperations: number;
  proOperations: number;
  totalCreditsSpent: number;
  topTools: { slug: string; count: number }[];
}> {
  const supabase = getSupabase();
  let logs: UsageLog[] = [];

  if (supabase) {
    try {
      const { data } = await supabase.from('usage_logs').select('*').limit(500);
      if (data) logs = data as UsageLog[];
    } catch {}
  }

  if (logs.length === 0 && typeof window !== 'undefined') {
    try {
      logs = JSON.parse(localStorage.getItem('purepdf_usage_history') || '[]');
    } catch {}
  }

  // Default seed data if system is new
  if (logs.length === 0) {
    logs = [
      { tool_slug: 'compress-pdf', is_pro: false, credits_spent: 0, created_at: new Date().toISOString() },
      { tool_slug: 'merge-pdf', is_pro: false, credits_spent: 0, created_at: new Date().toISOString() },
      { tool_slug: 'ai-edit-pdf', is_pro: true, credits_spent: 3, created_at: new Date().toISOString() },
      { tool_slug: 'force-unlock-pdf', is_pro: true, credits_spent: 3, created_at: new Date().toISOString() },
      { tool_slug: 'pdf-to-word', is_pro: false, credits_spent: 0, created_at: new Date().toISOString() },
    ];
  }

  const toolCounts: Record<string, number> = {};
  let proOps = 0;
  let creditsSpent = 0;

  logs.forEach((l) => {
    toolCounts[l.tool_slug] = (toolCounts[l.tool_slug] || 0) + 1;
    if (l.is_pro) proOps++;
    creditsSpent += l.credits_spent || 0;
  });

  const topTools = Object.entries(toolCounts)
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalOperations: logs.length,
    freeOperations: logs.length - proOps,
    proOperations: proOps,
    totalCreditsSpent: creditsSpent,
    topTools,
  };
}

/**
 * Admin: Fetch 3 key statistics
 */
export async function getAdminStats(): Promise<{
  totalUsers: number;
  activeVvipUsers: number;
  totalCreditsCirculating: number;
}> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

      if (profiles && profiles.length > 0) {
        const now = new Date();
        const activeVvip = profiles.filter((p: any) => {
          const isUnl = Boolean(p.is_unlimited || p.role === 'admin' || p.role === 'unlimited');
          if (!p.is_vvip && !isUnl) return false;
          if (isUnl) return true;
          if (!p.vvip_expires_at) return true;
          return new Date(p.vvip_expires_at) > now;
        }).length;

        const totalCredits = profiles.reduce((sum: number, p: any) => sum + (Number(p.credits) || 0), 0);

        return {
          totalUsers: profiles.length,
          activeVvipUsers: activeVvip,
          totalCreditsCirculating: totalCredits,
        };
      }
    } catch (e) {
      console.warn('Could not query admin stats from Supabase', e);
    }
  }

  // Fallback demo metrics if database empty or offline
  return {
    totalUsers: 1,
    activeVvipUsers: 1,
    totalCreditsCirculating: 10,
  };
}

/**
 * Admin: Fetch users list with filter and search
 */
export async function getAdminUsersList(searchQuery = '', statusFilter = 'all'): Promise<UserProfile[]> {
  const supabase = getSupabase();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'andihandika1929@gmail.com';

  if (supabase) {
    try {
      let query = supabase.from('profiles').select('*');

      if (searchQuery.trim()) {
        const term = searchQuery.trim();
        query = query.or(`email.ilike.%${term}%,full_name.ilike.%${term}%`);
      }

      if (statusFilter === 'vvip') {
        query = query.eq('is_vvip', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(100);
      if (data && data.length > 0) {
        let list: UserProfile[] = data.map((row: any) => mapDbRowToProfile(row, adminEmail));

        if (statusFilter === 'unlimited') {
          list = list.filter((u) => u.is_unlimited);
        } else if (statusFilter === 'free') {
          list = list.filter((u) => !u.is_vvip && !u.is_unlimited);
        }

        return list;
      }
    } catch (e) {
      console.warn('Could not query admin profiles from Supabase', e);
    }
  }

  // Fallback demo users for dashboard preview
  let demoUsers: UserProfile[] = [
    {
      id: 'usr_admin_01',
      email: adminEmail,
      full_name: 'Andi Handika (Super Admin)',
      credits: 99999,
      is_vvip: true,
      is_unlimited: true,
      vvip_expires_at: '2029-12-31T23:59:59Z',
      role: 'admin',
      is_admin: true,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'usr_power_02',
      email: 'creator@studio.id',
      full_name: 'Siti Rahmawati',
      credits: 60,
      is_vvip: true,
      is_unlimited: false,
      vvip_expires_at: new Date(Date.now() + 25 * 86400000).toISOString(),
      role: 'user',
      is_admin: false,
      created_at: '2026-02-14T10:30:00Z',
    },
    {
      id: 'usr_trial_03',
      email: 'budi.santoso@gmail.com',
      full_name: 'Budi Santoso',
      credits: 10,
      is_vvip: false,
      is_unlimited: false,
      role: 'user',
      is_admin: false,
      created_at: '2026-03-01T15:20:00Z',
    },
    {
      id: 'usr_corp_04',
      email: 'team@kantor.co.id',
      full_name: 'Kantor Notaris Prima',
      credits: 500,
      is_vvip: true,
      is_unlimited: true,
      vvip_expires_at: new Date(Date.now() + 180 * 86400000).toISOString(),
      role: 'user',
      is_admin: false,
      created_at: '2026-03-10T08:15:00Z',
    },
  ];

  if (statusFilter === 'vvip') {
    demoUsers = demoUsers.filter((u) => u.is_vvip);
  } else if (statusFilter === 'unlimited') {
    demoUsers = demoUsers.filter((u) => u.is_unlimited);
  } else if (statusFilter === 'free') {
    demoUsers = demoUsers.filter((u) => !u.is_vvip && !u.is_unlimited);
  }

  if (!searchQuery.trim()) return demoUsers;
  const term = searchQuery.toLowerCase();
  return demoUsers.filter(
    (u) =>
      u.email.toLowerCase().includes(term) ||
      (u.full_name && u.full_name.toLowerCase().includes(term))
  );
}

/**
 * Admin: Comprehensive User Profile Update (Credits, Unlimited, VVIP, Expiration)
 */
export async function adminUpdateUserProfile(
  userId: string,
  updates: {
    credits?: number;
    is_unlimited?: boolean;
    is_vvip?: boolean;
    vvip_expires_at?: string | null;
    role?: string;
  }
) {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const dbPayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.credits !== undefined) dbPayload.credits = updates.credits;
      if (updates.is_vvip !== undefined) dbPayload.is_vvip = updates.is_vvip;
      if (updates.vvip_expires_at !== undefined) dbPayload.vvip_expires_at = updates.vvip_expires_at;
      if (updates.role !== undefined) dbPayload.role = updates.role;

      // Handle unlimited flag
      if (updates.is_unlimited !== undefined) {
        dbPayload.is_unlimited = updates.is_unlimited;
        // If role not explicitly set, align role
        if (updates.is_unlimited && (!dbPayload.role || dbPayload.role !== 'admin')) {
          dbPayload.role = 'unlimited';
        } else if (!updates.is_unlimited && dbPayload.role === 'unlimited') {
          dbPayload.role = 'user';
        }
      }

      // First attempt: try updating with all fields (including is_unlimited if column exists)
      let { error } = await supabase.from('profiles').update(dbPayload).eq('id', userId);

      // If schema cache says is_unlimited column doesn't exist (PGRST204 or 42703), safely retry without that column
      if (error && (error.message?.includes('is_unlimited') || error.code === 'PGRST204' || error.code === '42703')) {
        delete dbPayload.is_unlimited;
        const retry = await supabase.from('profiles').update(dbPayload).eq('id', userId);
        error = retry.error;
      }

      if (error) throw error;
    } catch (e) {
      console.warn('Admin update profile Supabase error:', e);
      throw e;
    }
  }

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(`purepdf_profile_${userId}`);
    if (raw) {
      try {
        const p = JSON.parse(raw);
        Object.assign(p, updates);
        localStorage.setItem(`purepdf_profile_${userId}`, JSON.stringify(p));
      } catch {}
    }
  }
}

/**
 * Admin: Update user credits manually (backward compatibility)
 */
export async function adminUpdateCredits(userId: string, newCredits: number) {
  return adminUpdateUserProfile(userId, { credits: newCredits });
}

/**
 * Admin: Toggle user VVIP status (backward compatibility)
 */
export async function adminToggleVvip(userId: string, isVvip: boolean) {
  const vvipExpiry = isVvip
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;
  return adminUpdateUserProfile(userId, { is_vvip: isVvip, vvip_expires_at: vvipExpiry });
}

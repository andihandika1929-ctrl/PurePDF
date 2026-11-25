// frontend/src/lib/serverAdminAuth.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type AdminAuthResult =
  | { ok: true; adminUserId: string; adminEmail: string; serviceClient: SupabaseClient }
  | { ok: false; status: number; error: string };

/**
 * Server-side admin verification guard for Next.js Route Handlers.
 * Validates the authenticated Supabase session from HttpOnly cookies and verifies
 * admin privilege against `profiles.role === 'admin'` (or server-only ADMIN_EMAIL).
 */
export async function verifyAdminRequest(): Promise<AdminAuthResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return {
      ok: false,
      status: 503,
      error: 'Server Supabase admin configuration is incomplete (SUPABASE_SERVICE_ROLE_KEY required).',
    };
  }

  const cookieStore = cookies();
  const authClient = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Read-only inside route handler verification
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return { ok: false, status: 401, error: 'Authentication required.' };
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile } = await serviceClient
    .from('profiles')
    .select('id, email, role')
    .eq('id', user.id)
    .single();

  const configuredAdminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const userEmail = (user.email || '').trim().toLowerCase();
  const isAdmin =
    profile?.role === 'admin' ||
    (Boolean(configuredAdminEmail) && userEmail === configuredAdminEmail);

  if (!isAdmin) {
    return { ok: false, status: 403, error: 'Administrator privileges required.' };
  }

  return {
    ok: true,
    adminUserId: user.id,
    adminEmail: user.email || '',
    serviceClient,
  };
}

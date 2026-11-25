// frontend/src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/serverAdminAuth';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const searchQuery = (searchParams.get('q') || '').trim();
  const statusFilter = (searchParams.get('status') || 'all').trim();

  try {
    let query = auth.serviceClient.from('profiles').select('*');

    if (searchQuery) {
      query = query.or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`);
    }
    if (statusFilter === 'vvip') {
      query = query.eq('is_vvip', true);
    }

    const { data: rows, error } = await query
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const allProfiles = rows || [];
    const now = new Date();

    const activeVvipUsers = allProfiles.filter((p: any) => {
      const isUnl = Boolean(p.is_unlimited || p.role === 'admin' || p.role === 'unlimited');
      if (!p.is_vvip && !isUnl) return false;
      if (isUnl) return true;
      if (!p.vvip_expires_at) return true;
      return new Date(p.vvip_expires_at) > now;
    }).length;

    const totalCreditsCirculating = allProfiles.reduce(
      (sum: number, p: any) => sum + (Number(p.credits) || 0),
      0
    );

    let filtered = allProfiles.map((row: any) => ({
      id: row.id,
      email: row.email,
      full_name: row.full_name || (row.email ? row.email.split('@')[0] : 'User'),
      avatar_url: row.avatar_url,
      credits: Number(row.credits) || 0,
      is_vvip: Boolean(row.is_vvip),
      is_unlimited: Boolean(row.is_unlimited || row.role === 'admin' || row.role === 'unlimited'),
      vvip_expires_at: row.vvip_expires_at,
      role: row.role || 'user',
      is_admin: row.role === 'admin',
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    if (statusFilter === 'unlimited') {
      filtered = filtered.filter((u) => u.is_unlimited);
    } else if (statusFilter === 'free') {
      filtered = filtered.filter((u) => !u.is_vvip && !u.is_unlimited);
    }

    return NextResponse.json({
      stats: {
        totalUsers: allProfiles.length,
        activeVvipUsers,
        totalCreditsCirculating,
      },
      users: filtered,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load admin users.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await verifyAdminRequest();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { userId, credits, is_unlimited, is_vvip, vvip_expires_at, role } = body || {};

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Valid userId is required.' }, { status: 400 });
    }

    const dbPayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (credits !== undefined) {
      const numericCredits = Number(credits);
      if (!Number.isFinite(numericCredits) || numericCredits < 0) {
        return NextResponse.json({ error: 'Invalid credits value.' }, { status: 400 });
      }
      dbPayload.credits = Math.floor(numericCredits);
    }
    if (is_vvip !== undefined) dbPayload.is_vvip = Boolean(is_vvip);
    if (vvip_expires_at !== undefined) dbPayload.vvip_expires_at = vvip_expires_at;
    if (role !== undefined && ['user', 'unlimited', 'admin'].includes(role)) {
      dbPayload.role = role;
    }
    if (is_unlimited !== undefined) {
      dbPayload.is_unlimited = Boolean(is_unlimited);
      if (is_unlimited && dbPayload.role !== 'admin') {
        dbPayload.role = 'unlimited';
      } else if (!is_unlimited && dbPayload.role === 'unlimited') {
        dbPayload.role = 'user';
      }
    }

    let { error } = await auth.serviceClient
      .from('profiles')
      .update(dbPayload)
      .eq('id', userId);

    if (error && (error.message?.includes('is_unlimited') || error.code === 'PGRST204' || error.code === '42703')) {
      delete dbPayload.is_unlimited;
      const retry = await auth.serviceClient
        .from('profiles')
        .update(dbPayload)
        .eq('id', userId);
      error = retry.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update profile.' }, { status: 500 });
  }
}

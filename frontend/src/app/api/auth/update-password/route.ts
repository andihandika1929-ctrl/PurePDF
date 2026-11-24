// frontend/src/app/api/auth/update-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export async function POST(req: NextRequest) {
  try {
    const { password, userId } = await req.json();

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Kata sandi minimal 6 karakter.' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Konfigurasi database server belum lengkap.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let targetUserId = userId;

    // If userId not explicitly provided, attempt to retrieve from session header / cookie
    if (!targetUserId) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: userData } = await supabaseAdmin.auth.getUser(token);
        if (userData?.user) {
          targetUserId = userData.user.id;
        }
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan. Silakan login kembali.' }, { status: 401 });
    }

    const { hash, salt } = hashPassword(password);

    // Get current user metadata to preserve
    const { data: currentUser } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
    const existingMeta = currentUser?.user?.user_metadata || {};

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
      password,
      user_metadata: {
        ...existingMeta,
        pw_hash: hash,
        pw_salt: salt,
      },
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Kata sandi berhasil diperbarui.',
    });
  } catch (err: any) {
    console.error('Update password API error:', err);
    return NextResponse.json({ error: err?.message || 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}

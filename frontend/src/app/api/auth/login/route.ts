// frontend/src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function verifyPassword(password: string, hash: string, salt: string) {
  const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return testHash === hash;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Mohon masukkan email dan kata sandi.' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Konfigurasi server database belum lengkap.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Locate user in Supabase Auth
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (listError || !usersData?.users) {
      return NextResponse.json({ error: 'Gagal memverifikasi akun pengguna.' }, { status: 500 });
    }

    const foundUser = usersData.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (!foundUser) {
      return NextResponse.json({ error: 'Email atau kata sandi tidak sesuai.' }, { status: 400 });
    }

    const meta = foundUser.user_metadata || {};

    // 2. If password hash is available, verify it
    if (meta.pw_hash && meta.pw_salt) {
      const isMatch = verifyPassword(password, meta.pw_hash, meta.pw_salt);
      if (!isMatch) {
        return NextResponse.json({ error: 'Email atau kata sandi tidak sesuai.' }, { status: 400 });
      }
    }

    // 3. Generate direct login OTP token
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
    });

    if (linkError || !linkData?.properties?.email_otp) {
      return NextResponse.json({ error: 'Gagal membuat sesi masuk akun.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      otp: linkData.properties.email_otp,
      user: foundUser,
    });
  } catch (err: any) {
    console.error('Login API error:', err);
    return NextResponse.json(
      { error: err?.message || 'Terjadi kesalahan sistem saat masuk.' },
      { status: 500 }
    );
  }
}

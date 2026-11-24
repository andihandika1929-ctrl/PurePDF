// frontend/src/app/api/auth/register/route.ts
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
    const { email, password, fullName } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Mohon lengkapi nama, email, dan kata sandi.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Kata sandi minimal 6 karakter.' }, { status: 400 });
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

    // 1. Check if user already exists
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const existing = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (existing) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Silakan masuk pada tab Masuk.' },
        { status: 400 }
      );
    }

    // 2. Hash password & create user in Supabase Auth
    const { hash, salt } = hashPassword(password);
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim(),
        pw_hash: hash,
        pw_salt: salt,
      },
    });

    if (createError || !userData?.user) {
      return NextResponse.json(
        { error: createError?.message || 'Gagal mendaftarkan akun baru.' },
        { status: 400 }
      );
    }

    const userId = userData.user.id;
    const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'andihandika1929@gmail.com').toLowerCase();
    const isAdmin = normalizedEmail === adminEmail;

    // 3. Upsert profile in `profiles` table with 10 starter credits
    await supabaseAdmin.from('profiles').upsert({
      id: userId,
      email: normalizedEmail,
      full_name: fullName.trim(),
      credits: isAdmin ? 99999 : 10,
      is_vvip: isAdmin,
      role: isAdmin ? 'admin' : 'user',
      updated_at: new Date().toISOString(),
    });

    // 4. Generate direct sign-in OTP token
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
    });

    if (linkError || !linkData?.properties?.email_otp) {
      // User created, return success even if link generation requires manual login
      return NextResponse.json({
        success: true,
        email: normalizedEmail,
        user: userData.user,
      });
    }

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      otp: linkData.properties.email_otp,
      user: userData.user,
    });
  } catch (err: any) {
    console.error('Register API error:', err);
    return NextResponse.json(
      { error: err?.message || 'Terjadi kesalahan sistem saat mendaftar.' },
      { status: 500 }
    );
  }
}

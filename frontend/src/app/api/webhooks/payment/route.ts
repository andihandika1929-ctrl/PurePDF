// frontend/src/app/api/webhooks/payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const paymentServerKey = process.env.PAYMENT_SERVER_KEY || '';

  // Fail closed: never allow hardcoded fallback secrets or anon key writes
  if (!paymentServerKey) {
    return NextResponse.json(
      { error: 'Payment webhook secret is not configured on server.' },
      { status: 503 }
    );
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Supabase service role configuration missing on server.' },
      { status: 503 }
    );
  }

  try {
    const rawBody = await req.text();
    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = Object.fromEntries(new URLSearchParams(rawBody));
    }

    const signatureHeader =
      req.headers.get('x-signature') || req.headers.get('x-callback-signature') || '';

    // Mandatory cryptographic signature verification (Midtrans SHA-512 OR LemonSqueezy HMAC-SHA256)
    let signatureVerified = false;

    // 1. Midtrans: SHA512(order_id + status_code + gross_amount + ServerKey)
    if (payload.signature_key && payload.order_id && payload.status_code && payload.gross_amount) {
      const expectedHash = crypto
        .createHash('sha512')
        .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${paymentServerKey}`)
        .digest('hex');

      const expectedBuf = Buffer.from(expectedHash, 'utf8');
      const providedBuf = Buffer.from(String(payload.signature_key), 'utf8');
      if (
        expectedBuf.length === providedBuf.length &&
        crypto.timingSafeEqual(expectedBuf, providedBuf)
      ) {
        signatureVerified = true;
      } else {
        return NextResponse.json({ error: 'Invalid Midtrans signature.' }, { status: 401 });
      }
    }

    // 2. LemonSqueezy / Generic Webhook: HMAC-SHA256 of raw body
    if (!signatureVerified && signatureHeader) {
      const expectedHmac = crypto
        .createHmac('sha256', paymentServerKey)
        .update(rawBody)
        .digest('hex');

      const expectedBuf = Buffer.from(expectedHmac, 'utf8');
      const providedBuf = Buffer.from(signatureHeader.trim(), 'utf8');
      if (
        expectedBuf.length === providedBuf.length &&
        crypto.timingSafeEqual(expectedBuf, providedBuf)
      ) {
        signatureVerified = true;
      } else {
        return NextResponse.json({ error: 'Invalid webhook HMAC signature.' }, { status: 401 });
      }
    }

    // Reject unsigned webhook payloads unconditionally
    if (!signatureVerified) {
      return NextResponse.json(
        { error: 'Missing required webhook cryptographic signature.' },
        { status: 401 }
      );
    }

    const status = payload.transaction_status || payload.status || payload.event_name || '';
    const isSuccess =
      status === 'settlement' ||
      status === 'capture' ||
      status === 'success' ||
      status === 'order_created';

    if (!isSuccess) {
      return NextResponse.json({ message: `Ignoring non-settled status: ${status}` }, { status: 200 });
    }

    const email =
      payload.customer_email ||
      payload.email ||
      (payload.data && payload.data.attributes?.user_email);
    const orderId = payload.order_id || (payload.data && payload.data.id);
    const itemType = String(payload.item_name || payload.package_id || 'starter').toLowerCase();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Customer email missing in webhook payload.' }, { status: 400 });
    }

    const creditMap: Record<string, number> = {
      starter: 5,
      decoy: 12,
      standard: 12,
      popular: 25,
      vvip: 0,
    };

    const isVvipOrder = itemType.includes('vvip');
    const creditsToAdd = isVvipOrder ? 0 : creditMap[itemType] || 5;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile, error: lookupError } = await supabase
      .from('profiles')
      .select('id, credits')
      .eq('email', email)
      .single();

    if (lookupError || !profile) {
      return NextResponse.json({ error: 'Target user profile not found.' }, { status: 404 });
    }

    const updateData: Record<string, any> = {
      credits: (Number(profile.credits) || 0) + creditsToAdd,
      updated_at: new Date().toISOString(),
    };
    if (isVvipOrder) {
      updateData.is_vvip = true;
      updateData.vvip_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profile.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      order_id: orderId,
      status: 'credited',
      credits_added: creditsToAdd,
      is_vvip: isVvipOrder,
    });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: err.message || 'Webhook failed' }, { status: 500 });
  }
}

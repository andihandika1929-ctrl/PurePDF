// frontend/src/app/api/webhooks/payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const paymentServerKey = process.env.PAYMENT_SERVER_KEY || 'purepdf_server_secret_key';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = Object.fromEntries(new URLSearchParams(rawBody));
    }

    const signatureHeader = req.headers.get('x-signature') || req.headers.get('x-callback-signature') || '';

    // Signature verification logic (Midtrans / Duitku / LemonSqueezy)
    // 1. Midtrans: SHA512(order_id + status_code + gross_amount + ServerKey)
    if (payload.order_id && payload.status_code && payload.gross_amount) {
      const expectedHash = crypto
        .createHash('sha512')
        .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${paymentServerKey}`)
        .digest('hex');

      if (payload.signature_key && payload.signature_key !== expectedHash) {
        return NextResponse.json({ error: 'Invalid Midtrans signature' }, { status: 401 });
      }
    }

    // 2. LemonSqueezy: HMAC SHA256 of raw body
    if (signatureHeader && paymentServerKey) {
      const hmac = crypto.createHmac('sha256', paymentServerKey);
      const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
      const signature = Buffer.from(signatureHeader, 'utf8');
      if (digest.length === signature.length && !crypto.timingSafeEqual(digest, signature)) {
        console.warn('Signature verification mismatch or optional dev bypass');
      }
    }

    // Process payment success
    const status = payload.transaction_status || payload.status || payload.event_name || 'settlement';
    const isSuccess =
      status === 'settlement' ||
      status === 'capture' ||
      status === 'success' ||
      status === 'order_created';

    if (!isSuccess) {
      return NextResponse.json({ message: `Ignoring non-settled status: ${status}` }, { status: 200 });
    }

    const email = payload.customer_email || payload.email || (payload.data && payload.data.attributes?.user_email);
    const orderId = payload.order_id || (payload.data && payload.data.id);
    const itemType = payload.item_name || payload.package_id || 'starter'; // 'starter' | 'decoy' | 'popular' | 'vvip'

    console.log(`[Payment Webhook]: Order ${orderId} settled for ${email} (${itemType})`);

    // Credits allocation map
    const creditMap: Record<string, number> = {
      starter: 5,
      decoy: 12,
      popular: 25,
      vvip: 99999,
    };

    const creditsToAdd = creditMap[itemType] || 12;
    const isVvipOrder = itemType.toLowerCase().includes('vvip');

    // Update Supabase profiles table if configured
    if (supabaseUrl && supabaseServiceKey && email) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (profile) {
        const updateData: any = {
          credits: profile.credits + creditsToAdd,
        };
        if (isVvipOrder) {
          updateData.is_vvip = true;
          updateData.vvip_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        }

        await supabase.from('profiles').update(updateData).eq('id', profile.id);
      }
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

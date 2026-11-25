// frontend/src/app/api/webhooks/payment/route.ts
import { NextResponse } from 'next/server';

/**
 * Self-service / automated credit provisioning endpoint is disabled.
 * All credit top-ups and VVIP activations are verified manually (QRIS/Transfer)
 * and provisioned exclusively via the authenticated Admin Command Center (/api/admin/users).
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        'Automated billing webhook is disabled. Credits and VVIP are provisioned exclusively by an administrator.',
    },
    { status: 403 }
  );
}

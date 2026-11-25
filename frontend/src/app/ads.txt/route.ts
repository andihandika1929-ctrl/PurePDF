// frontend/src/app/ads.txt/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rawPublisherId = (
    process.env.ADSENSE_PUBLISHER_ID ||
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ||
    ''
  ).trim();

  const normalizedPubId = rawPublisherId.replace(/^ca-/, '');

  const body = normalizedPubId
    ? `google.com, ${normalizedPubId}, DIRECT, f08c47fec0942fa0\n`
    : `# PurePDF ads.txt placeholder\n# Set ADSENSE_PUBLISHER_ID (e.g. pub-1234567890123456) in Vercel Environment Variables to activate Google AdSense verification.\n`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

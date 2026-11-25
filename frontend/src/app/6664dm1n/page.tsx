import React from 'react';
import { notFound } from 'next/navigation';
import { verifyAdminRequest } from '@/lib/serverAdminAuth';
import { SecretAdminDashboard } from '@/components/admin/SecretAdminDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'PurePDF Admin Command Center',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  // Server-side admin verification: strictly reject guests and non-admin users before rendering
  const auth = await verifyAdminRequest();
  if (!auth.ok) {
    notFound();
  }

  return <SecretAdminDashboard secretParam="6664dm1n" />;
}

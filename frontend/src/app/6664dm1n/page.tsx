import React from 'react';
import { SecretAdminDashboard } from '@/components/admin/SecretAdminDashboard';

export const metadata = {
  title: 'PurePDF Admin Command Center',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <SecretAdminDashboard secretParam="6664dm1n" />;
}

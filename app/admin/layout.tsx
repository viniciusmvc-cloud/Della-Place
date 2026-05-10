import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AdminShell from './AdminShell';
import { getCurrentAdmin } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Della Pace · Admin',
  manifest: '/admin/manifest.webmanifest',
  icons: {
    icon: '/icons/dellapace-admin-icon.png',
    shortcut: '/icons/dellapace-admin-icon.png',
    apple: '/icons/dellapace-admin-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Della Pace Admin',
    statusBarStyle: 'default',
    startupImage: '/icons/dellapace-admin-icon.png',
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect('/login');
  }
  return (
    <AdminShell userEmail={admin.email} userName={admin.name}>
      {children}
    </AdminShell>
  );
}

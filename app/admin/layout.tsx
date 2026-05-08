import { redirect } from 'next/navigation';
import AdminShell from './AdminShell';
import { getCurrentAdmin } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

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

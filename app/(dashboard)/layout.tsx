import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { DashboardClientShell } from './DashboardClientShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <DashboardClientShell user={user}>{children}</DashboardClientShell>;
}

import { NextResponse } from 'next/server';
import { removeSessionCookie, getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    await createAuditLog({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'LOGOUT',
      category: 'SECURITY',
      details: 'User logged out of SMIT ERP.',
    });
  }

  await removeSessionCookie();
  return NextResponse.json({ success: true });
}

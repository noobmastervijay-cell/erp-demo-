import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, PERMISSION_CODES } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    if (!hasPermission(currentUser, PERMISSION_CODES.STAFF_DEACTIVATE) && currentUser.roleName !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to change staff activation status.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body; // ACTIVE, INACTIVE, SUSPENDED

    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid account status provided.' }, { status: 400 });
    }

    // Prevent Super Admin self-deactivation
    if (id === currentUser.id && status !== 'ACTIVE') {
      return NextResponse.json({ error: 'You cannot deactivate your own active Admin account.' }, { status: 400 });
    }

    const targetUser = await prisma.user.update({
      where: { id },
      data: { status },
    });

    await createAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      action: status === 'ACTIVE' ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      category: 'SECURITY',
      details: `Changed account status for ${targetUser.name} (${targetUser.employeeId}) to ${status}.`,
    });

    return NextResponse.json({ success: true, data: targetUser });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update user account status.' }, { status: 500 });
  }
}

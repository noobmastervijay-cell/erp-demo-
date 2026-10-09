import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { hasPermission, PERMISSION_CODES } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    if (!hasPermission(currentUser, PERMISSION_CODES.STAFF_RESET_PASSWORD) && currentUser.roleName !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to reset user passwords.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const newPassword = body.newPassword || 'Staff@123456';

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found.' }, { status: 404 });
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id },
      data: {
        passwordHash: newHash,
        mustChangePassword: true, // Forces user to change reset password on next login
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      action: 'USER_PASSWORD_RESET',
      category: 'SECURITY',
      details: `Admin reset password for staff user ${targetUser.name} (${targetUser.email}). Mandatory password change flagged.`,
    });

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for ${targetUser.name}.`,
      tempPassword: newPassword,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to reset user password.' }, { status: 500 });
  }
}

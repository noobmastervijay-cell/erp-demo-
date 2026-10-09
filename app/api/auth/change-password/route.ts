import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, hashPassword, comparePassword } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // If user is forced to change password (mustChangePassword === true), currentPassword check can be optional if provided, but if not forced, check current password.
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User record not found.' }, { status: 404 });
    }

    if (!dbUser.mustChangePassword && currentPassword) {
      const isValid = await comparePassword(currentPassword, dbUser.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
      }
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'PASSWORD_CHANGED',
      category: 'SECURITY',
      details: 'User successfully updated account password.',
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    console.error('Password change error:', err);
    return NextResponse.json({ error: 'Failed to update password.' }, { status: 500 });
  }
}

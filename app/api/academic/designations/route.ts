import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, PERMISSION_CODES } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const designations = await prisma.designation.findMany({
      orderBy: { title: 'asc' },
    });

    return NextResponse.json({ data: designations });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch designations.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    if (!hasPermission(user, PERMISSION_CODES.ACADEMIC_MANAGE) && user.roleName !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const body = await req.json();
    const { code, title, category } = body;

    if (!code || !title) {
      return NextResponse.json({ error: 'Code and Title are required.' }, { status: 400 });
    }

    const newDesig = await prisma.designation.create({
      data: {
        code: code.trim().toUpperCase(),
        title: title.trim(),
        category: category || 'TEACHING',
      },
    });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'DESIGNATION_CREATED',
      category: 'ACADEMIC',
      details: `Created new designation ${newDesig.title} (${newDesig.code}).`,
    });

    return NextResponse.json({ success: true, data: newDesig });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create designation.' }, { status: 500 });
  }
}

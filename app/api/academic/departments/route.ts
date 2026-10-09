import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, PERMISSION_CODES } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const departments = await prisma.department.findMany({
      where: includeArchived ? {} : { status: 'ACTIVE' },
      include: {
        hodUser: {
          select: { id: true, name: true, email: true, employeeId: true },
        },
        _count: {
          select: { staff: true, courses: true, subjects: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json({ data: departments });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch departments.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    if (!hasPermission(user, PERMISSION_CODES.ACADEMIC_MANAGE) && user.roleName !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Academic management permission required.' }, { status: 403 });
    }

    const body = await req.json();
    const { code, name, description, hodUserId } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Department Code and Name are required.' }, { status: 400 });
    }

    const newDept = await prisma.department.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description || null,
        hodUserId: hodUserId || null,
      },
    });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'DEPT_CREATED',
      category: 'ACADEMIC',
      details: `Created new department ${newDept.name} (${newDept.code}).`,
    });

    return NextResponse.json({ success: true, data: newDept });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create department.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    if (!hasPermission(user, PERMISSION_CODES.ACADEMIC_MANAGE) && user.roleName !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, description, hodUserId, status } = body;

    if (!id) return NextResponse.json({ error: 'Department ID required.' }, { status: 400 });

    const updated = await prisma.department.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(hodUserId !== undefined ? { hodUserId: hodUserId || null } : {}),
        ...(status ? { status } : {}),
      },
    });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'DEPT_UPDATED',
      category: 'ACADEMIC',
      details: `Updated department ${updated.name} (${updated.code}). Status: ${updated.status}`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update department.' }, { status: 500 });
  }
}

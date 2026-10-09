import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, PERMISSION_CODES } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const courses = await prisma.course.findMany({
      where: {
        ...(includeArchived ? {} : { status: 'ACTIVE' }),
        ...(departmentId ? { departmentId } : {}),
      },
      include: {
        department: { select: { id: true, code: true, name: true } },
        _count: { select: { subjects: true } },
      },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json({ data: courses });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch courses.' }, { status: 500 });
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
    const { code, name, departmentId, degreeType, durationYears, totalSemesters } = body;

    if (!code || !name || !departmentId) {
      return NextResponse.json({ error: 'Code, Name, and Department are required.' }, { status: 400 });
    }

    const newCourse = await prisma.course.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        departmentId,
        degreeType: degreeType || 'UNDERGRADUATE',
        durationYears: parseInt(durationYears || '4', 10),
        totalSemesters: parseInt(totalSemesters || '8', 10),
      },
    });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'COURSE_CREATED',
      category: 'ACADEMIC',
      details: `Created new course ${newCourse.name} (${newCourse.code}).`,
    });

    return NextResponse.json({ success: true, data: newCourse });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create course.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    if (!hasPermission(user, PERMISSION_CODES.ACADEMIC_MANAGE) && user.roleName !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, departmentId, degreeType, durationYears, totalSemesters, status } = body;

    if (!id) return NextResponse.json({ error: 'Course ID required.' }, { status: 400 });

    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(departmentId ? { departmentId } : {}),
        ...(degreeType ? { degreeType } : {}),
        ...(durationYears ? { durationYears: parseInt(durationYears, 10) } : {}),
        ...(totalSemesters ? { totalSemesters: parseInt(totalSemesters, 10) } : {}),
        ...(status ? { status } : {}),
      },
    });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'COURSE_UPDATED',
      category: 'ACADEMIC',
      details: `Updated course ${updated.name} (${updated.code}). Status: ${updated.status}`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update course.' }, { status: 500 });
  }
}

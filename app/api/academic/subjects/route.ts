import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, PERMISSION_CODES } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const departmentId = searchParams.get('departmentId');
    const semester = searchParams.get('semester');

    const subjects = await prisma.subject.findMany({
      where: {
        ...(departmentId ? { departmentId } : {}),
        ...(courseId ? { courseId } : {}),
        ...(semester ? { semester: parseInt(semester, 10) } : {}),
      },
      include: {
        department: { select: { id: true, code: true, name: true } },
        course: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ courseId: 'asc' }, { semester: 'asc' }, { code: 'asc' }],
    });

    return NextResponse.json({ data: subjects });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch subjects.' }, { status: 500 });
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
    const { code, name, departmentId, courseId, semester, credits, subjectType } = body;

    if (!code || !name || !departmentId || !courseId) {
      return NextResponse.json({ error: 'Code, Name, Department, and Course are required.' }, { status: 400 });
    }

    const newSubject = await prisma.subject.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        departmentId,
        courseId,
        semester: parseInt(semester || '1', 10),
        credits: parseInt(credits || '3', 10),
        subjectType: subjectType || 'THEORY',
      },
    });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'SUBJECT_CREATED',
      category: 'ACADEMIC',
      details: `Created new subject ${newSubject.name} (${newSubject.code}) for Semester ${newSubject.semester}.`,
    });

    return NextResponse.json({ success: true, data: newSubject });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create subject.' }, { status: 500 });
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
    const { id, name, semester, credits, subjectType, status } = body;

    if (!id) return NextResponse.json({ error: 'Subject ID required.' }, { status: 400 });

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(semester ? { semester: parseInt(semester, 10) } : {}),
        ...(credits ? { credits: parseInt(credits, 10) } : {}),
        ...(subjectType ? { subjectType } : {}),
        ...(status ? { status } : {}),
      },
    });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'SUBJECT_UPDATED',
      category: 'ACADEMIC',
      details: `Updated subject ${updated.name} (${updated.code}). Status: ${updated.status}`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update subject.' }, { status: 500 });
  }
}

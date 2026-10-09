import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, PERMISSION_CODES } from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    if (!hasPermission(user, PERMISSION_CODES.AUDIT_VIEW) && user.roleName !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin audit log permission required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const skip = (page - 1) * limit;

    const where: any = {
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { userName: { contains: search } },
              { userEmail: { contains: search } },
              { action: { contains: search } },
              { details: { contains: search } },
            ],
          }
        : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch audit logs.' }, { status: 500 });
  }
}

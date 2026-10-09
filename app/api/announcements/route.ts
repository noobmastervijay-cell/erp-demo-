import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';

/**
 * GET /api/announcements
 * Retrieve announcements filtered by user role:
 * - SUPER_ADMIN: Can view all announcements (with optional filters)
 * - HOD: Can only view PUBLISHED announcements targeted to 'ALL' or 'HOD'
 * - STAFF: Can only view PUBLISHED announcements targeted to 'ALL' or 'STAFF'
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const priority = searchParams.get('priority') || '';
    const target = searchParams.get('target') || '';

    // Build role-based filter condition
    let roleTargetFilter: any = {};
    if (user.roleName === 'HOD') {
      roleTargetFilter = {
        targetAudience: { in: ['ALL', 'HOD'] },
        status: 'PUBLISHED',
      };
    } else if (user.roleName === 'STAFF') {
      roleTargetFilter = {
        targetAudience: { in: ['ALL', 'STAFF'] },
        status: 'PUBLISHED',
      };
    } else if (user.roleName === 'SUPER_ADMIN') {
      // Super Admin can filter by status or target explicitly if provided
      if (target) {
        roleTargetFilter.targetAudience = target;
      }
    } else {
      // Fallback for non-privileged roles
      roleTargetFilter = {
        targetAudience: 'ALL',
        status: 'PUBLISHED',
      };
    }

    // Additional query filters
    const whereCondition: any = {
      ...roleTargetFilter,
    };

    if (search) {
      whereCondition.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    if (priority) {
      whereCondition.priority = priority;
    }

    const announcements = await prisma.announcement.findMany({
      where: whereCondition,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                label: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      announcements,
      userRole: user.roleName,
      isSuperAdmin: user.roleName === 'SUPER_ADMIN',
    });
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/announcements
 * Create a new announcement.
 * EXCLUSIVE PRIVILEGE: Strictly restricted to SUPER_ADMIN.
 * Returns 403 Forbidden for HODs and Staff.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // STRICT ROLE CHECK: Only Super Admin can create announcements
    if (user.roleName !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only Super Admins have privileges to create announcements.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, content, priority = 'NORMAL', targetAudience = 'ALL', isPinned = false, status = 'PUBLISHED' } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'Announcement title is required.' }, { status: 400 });
    }

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json({ error: 'Announcement content is required.' }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        priority,
        targetAudience,
        isPinned: Boolean(isPinned),
        status,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                label: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Write to audit log
    await createAuditLog({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'ANNOUNCEMENT_CREATED',
      category: 'SECURITY',
      details: `Created announcement "${announcement.title}" targeted to ${announcement.targetAudience} (Priority: ${announcement.priority})`,
    });

    return NextResponse.json({ success: true, announcement }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    );
  }
}

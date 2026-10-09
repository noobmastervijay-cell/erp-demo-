import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';

/**
 * GET /api/announcements/[id]
 * Retrieve single announcement detail with role visibility checks.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const announcement = await prisma.announcement.findUnique({
      where: { id },
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

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Role-based visibility check
    if (user.roleName === 'HOD' && !['ALL', 'HOD'].includes(announcement.targetAudience)) {
      return NextResponse.json({ error: 'Access denied to this announcement.' }, { status: 403 });
    }

    if (user.roleName === 'STAFF' && !['ALL', 'STAFF'].includes(announcement.targetAudience)) {
      return NextResponse.json({ error: 'Access denied to this announcement.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, announcement });
  } catch (error: any) {
    console.error('Error fetching announcement detail:', error);
    return NextResponse.json({ error: 'Failed to fetch announcement detail' }, { status: 500 });
  }
}

/**
 * PUT /api/announcements/[id]
 * Update an existing announcement.
 * EXCLUSIVE PRIVILEGE: Strictly restricted to SUPER_ADMIN.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // STRICT ROLE CHECK: Only Super Admin can update announcements
    if (user.roleName !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only Super Admins have privileges to edit announcements.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    const body = await req.json();
    const { title, content, priority, targetAudience, isPinned, status } = body;

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : existing.title,
        content: content !== undefined ? content.trim() : existing.content,
        priority: priority !== undefined ? priority : existing.priority,
        targetAudience: targetAudience !== undefined ? targetAudience : existing.targetAudience,
        isPinned: isPinned !== undefined ? Boolean(isPinned) : existing.isPinned,
        status: status !== undefined ? status : existing.status,
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

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'ANNOUNCEMENT_UPDATED',
      category: 'SECURITY',
      details: `Updated announcement "${updated.title}" (Target: ${updated.targetAudience}, Priority: ${updated.priority})`,
    });

    return NextResponse.json({ success: true, announcement: updated });
  } catch (error: any) {
    console.error('Error updating announcement:', error);
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
  }
}

/**
 * DELETE /api/announcements/[id]
 * Delete an announcement.
 * EXCLUSIVE PRIVILEGE: Strictly restricted to SUPER_ADMIN.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // STRICT ROLE CHECK: Only Super Admin can delete announcements
    if (user.roleName !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only Super Admins have privileges to delete announcements.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    await prisma.announcement.delete({ where: { id } });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'ANNOUNCEMENT_DELETED',
      category: 'SECURITY',
      details: `Deleted announcement "${existing.title}"`,
    });

    return NextResponse.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
  }
}

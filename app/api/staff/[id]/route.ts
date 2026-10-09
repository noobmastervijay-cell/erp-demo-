import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, PERMISSION_CODES } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    const { id } = await params;

    // Staff can view their own profile or users with staff:view permission
    const isSelf = user.id === id;
    const canViewAll = hasPermission(user, PERMISSION_CODES.STAFF_VIEW) || user.roleName === 'SUPER_ADMIN';

    if (!isSelf && !canViewAll && user.roleName !== 'HOD') {
      return NextResponse.json({ error: 'Forbidden access.' }, { status: 403 });
    }

    const staffMember = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        staffProfile: {
          include: {
            department: true,
            designation: true,
          },
        },
      },
    });

    if (!staffMember) {
      return NextResponse.json({ error: 'Staff member not found.' }, { status: 404 });
    }

    return NextResponse.json({ data: staffMember });
  } catch (err: any) {
    return NextResponse.json({ error: 'Error fetching staff profile.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    const { id } = await params;
    const isSelf = currentUser.id === id;
    const canEditAll = hasPermission(currentUser, PERMISSION_CODES.STAFF_EDIT) || currentUser.roleName === 'SUPER_ADMIN';

    if (!isSelf && !canEditAll) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to edit this profile.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      phone,
      departmentId,
      designationId,
      roleId,
      employmentStatus,
      qualification,
      experienceYears,
      address,
      photoUrl,
    } = body;

    // Build user update object
    const userUpdate: any = {};
    if (name && (isSelf || canEditAll)) userUpdate.name = name.trim();
    if (roleId && canEditAll) userUpdate.roleId = roleId;

    // Update User
    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id },
        data: userUpdate,
      });
    }

    // Build Staff Profile update
    const profileUpdate: any = {};
    if (phone !== undefined) profileUpdate.phone = phone;
    if (address !== undefined) profileUpdate.address = address;
    if (qualification !== undefined) profileUpdate.qualification = qualification;
    if (photoUrl !== undefined) profileUpdate.photoUrl = photoUrl;
    if (experienceYears !== undefined) profileUpdate.experienceYears = parseInt(experienceYears, 10);

    if (canEditAll) {
      if (departmentId !== undefined) profileUpdate.departmentId = departmentId || null;
      if (designationId !== undefined) profileUpdate.designationId = designationId || null;
      if (employmentStatus !== undefined) profileUpdate.employmentStatus = employmentStatus;
    }

    await prisma.staffProfile.upsert({
      where: { userId: id },
      create: {
        userId: id,
        ...profileUpdate,
      },
      update: profileUpdate,
    });

    const updatedStaff = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        staffProfile: {
          include: {
            department: true,
            designation: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      action: 'USER_EDITED',
      category: 'STAFF',
      details: `Updated staff profile information for ${updatedStaff?.name} (${updatedStaff?.employeeId}).`,
    });

    return NextResponse.json({ success: true, data: updatedStaff });
  } catch (err: any) {
    console.error('Staff PUT error:', err);
    return NextResponse.json({ error: 'Failed to update staff record.' }, { status: 500 });
  }
}

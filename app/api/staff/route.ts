import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { hasPermission, PERMISSION_CODES, isSuperAdmin, isHOD } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    // Permission check
    const canView = hasPermission(user, PERMISSION_CODES.STAFF_VIEW);
    if (!canView && !isSuperAdmin(user) && !isHOD(user)) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to view staff directory.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const departmentId = searchParams.get('departmentId');
    const roleId = searchParams.get('roleId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const skip = (page - 1) * limit;

    // Strict Branch Isolation: If HOD, targetDeptId is strictly locked to their departmentId
    let targetDeptId = departmentId;
    if (isHOD(user) && user.departmentId) {
      targetDeptId = user.departmentId;
    }

    const whereCondition: any = {
      ...(status ? { status } : {}),
      ...(roleId ? { roleId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { employeeId: { contains: search } },
            ],
          }
        : {}),
      ...(targetDeptId
        ? {
            staffProfile: {
              departmentId: targetDeptId,
            },
          }
        : {}),
    };

    const [staffList, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          employeeId: true,
          email: true,
          name: true,
          status: true,
          mustChangePassword: true,
          createdAt: true,
          role: {
            select: { id: true, name: true, label: true },
          },
          staffProfile: {
            select: {
              id: true,
              phone: true,
              dateJoined: true,
              employmentStatus: true,
              photoUrl: true,
              qualification: true,
              experienceYears: true,
              department: {
                select: { id: true, code: true, name: true },
              },
              designation: {
                select: { id: true, code: true, title: true },
              },
            },
          },
        },
      }),
      prisma.user.count({ where: whereCondition }),
    ]);

    return NextResponse.json({
      data: staffList,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err: any) {
    console.error('Staff GET error:', err);
    return NextResponse.json({ error: 'Failed to retrieve staff directory.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    if (!hasPermission(currentUser, PERMISSION_CODES.STAFF_CREATE) && !isSuperAdmin(currentUser)) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to add new staff.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      employeeId,
      name,
      email,
      password,
      roleId,
      departmentId,
      designationId,
      phone,
      employmentStatus,
      qualification,
      experienceYears,
      address,
    } = body;

    if (!employeeId || !name || !email || !roleId) {
      return NextResponse.json(
        { error: 'Employee ID, Full Name, Email, and Role are required fields.' },
        { status: 400 }
      );
    }

    // Branch Isolation: HOD can only create staff for their own department
    let targetDeptId = departmentId;
    if (isHOD(currentUser) && currentUser.departmentId) {
      targetDeptId = currentUser.departmentId;
    }

    // Check existing email or employeeId
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { employeeId }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A staff user with this Email or Employee ID already exists.' },
        { status: 400 }
      );
    }

    const defaultPassword = password || 'Staff@123456';
    const passwordHash = await hashPassword(defaultPassword);

    const newUser = await prisma.user.create({
      data: {
        employeeId: employeeId.trim(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        roleId,
        status: 'ACTIVE',
        mustChangePassword: true,
        staffProfile: {
          create: {
            phone: phone || null,
            departmentId: targetDeptId || null,
            designationId: designationId || null,
            employmentStatus: employmentStatus || 'FULL_TIME',
            qualification: qualification || null,
            experienceYears: experienceYears ? parseInt(experienceYears, 10) : 0,
            address: address || null,
          },
        },
      },
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
      action: 'USER_CREATED',
      category: 'STAFF',
      details: `Created new staff account ${newUser.name} (${newUser.employeeId}, ${newUser.email}) for department ${newUser.staffProfile?.department?.code || 'Unassigned'}.`,
    });

    return NextResponse.json({ success: true, data: newUser });
  } catch (err: any) {
    console.error('Staff POST error:', err);
    return NextResponse.json({ error: 'Failed to create staff user account.' }, { status: 500 });
  }
}

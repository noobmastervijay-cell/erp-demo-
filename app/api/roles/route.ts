import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, PERMISSION_CODES } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const [roles, permissions] = await Promise.all([
      prisma.role.findMany({
        include: {
          permissions: {
            select: { permissionId: true },
          },
          _count: {
            select: { users: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.permission.findMany({
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
    ]);

    // Format matrix data
    const formattedRoles = roles.map((role) => ({
      id: role.id,
      name: role.name,
      label: role.label,
      description: role.description,
      isSystem: role.isSystem,
      userCount: role._count.users,
      permissionIds: role.permissions.map((p) => p.permissionId),
    }));

    return NextResponse.json({
      roles: formattedRoles,
      permissions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch roles matrix.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    if (!hasPermission(currentUser, PERMISSION_CODES.ROLES_MANAGE) && currentUser.roleName !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Role management permission required.' }, { status: 403 });
    }

    const { roleId, permissionIds } = await req.json();

    if (!roleId || !Array.isArray(permissionIds)) {
      return NextResponse.json({ error: 'Role ID and permission IDs array required.' }, { status: 400 });
    }

    const targetRole = await prisma.role.findUnique({ where: { id: roleId } });
    if (!targetRole) return NextResponse.json({ error: 'Role not found.' }, { status: 404 });

    // Delete existing permissions for role
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Re-insert selected permissions
    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId: string) => ({
          roleId,
          permissionId,
        })),
      });
    }

    await createAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      action: 'ROLE_PERMISSIONS_UPDATED',
      category: 'SETTINGS',
      details: `Updated permissions matrix for role "${targetRole.label}". ${permissionIds.length} permissions mapped.`,
    });

    return NextResponse.json({ success: true, message: `Updated permissions for ${targetRole.label}.` });
  } catch (err: any) {
    console.error('Role Matrix PUT error:', err);
    return NextResponse.json({ error: 'Failed to update role permissions.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, PERMISSION_CODES } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

export async function GET() {
  try {
    const settings = await prisma.appSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({ data: settingsMap });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch settings.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    if (!hasPermission(user, PERMISSION_CODES.SETTINGS_MANAGE) && user.roleName !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Settings management permission required.' }, { status: 403 });
    }

    const settingsData: Record<string, string> = await req.json();

    for (const [key, value] of Object.entries(settingsData)) {
      await prisma.appSetting.upsert({
        where: { key },
        create: { key, value: String(value), group: 'GENERAL' },
        update: { value: String(value) },
      });
    }

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'SETTINGS_UPDATED',
      category: 'SETTINGS',
      details: `Updated SMIT College settings and branding configuration.`,
    });

    return NextResponse.json({ success: true, message: 'Settings saved successfully.' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to save settings.' }, { status: 500 });
  }
}

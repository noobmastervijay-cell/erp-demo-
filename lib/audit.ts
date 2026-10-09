import { prisma } from '@/lib/db';

export async function createAuditLog({
  userId,
  userName,
  userEmail,
  action,
  category,
  details,
  ipAddress = '127.0.0.1',
}: {
  userId?: string;
  userName?: string;
  userEmail?: string;
  action: string;
  category: 'USER' | 'STAFF' | 'ACADEMIC' | 'SETTINGS' | 'SECURITY' | 'SYSTEM' | string;
  details: string | object;
  ipAddress?: string;
}) {
  try {
    const detailString = typeof details === 'string' ? details : JSON.stringify(details);
    
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        userName: userName || 'System User',
        userEmail: userEmail || 'system@smit.edu.in',
        action,
        category,
        details: detailString,
        ipAddress,
      },
    });
  } catch (err) {
    console.error('Failed to create audit log entry:', err);
  }
}

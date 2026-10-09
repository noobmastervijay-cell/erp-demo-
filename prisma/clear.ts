import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing all data from SMIT ERP database...');

  // Deleting records in foreign-key safe order
  const auditLogs = await prisma.auditLog.deleteMany();
  const appSettings = await prisma.appSetting.deleteMany();
  const rolePermissions = await prisma.rolePermission.deleteMany();
  const permissions = await prisma.permission.deleteMany();
  const subjects = await prisma.subject.deleteMany();
  const courses = await prisma.course.deleteMany();
  const staffProfiles = await prisma.staffProfile.deleteMany();
  
  // Unlink HODs before deleting departments and users
  await prisma.department.updateMany({ data: { hodUserId: null } });
  const departments = await prisma.department.deleteMany();
  
  const designations = await prisma.designation.deleteMany();
  const users = await prisma.user.deleteMany();
  const roles = await prisma.role.deleteMany();

  console.log('✅ Database completely wiped for project submission!');
  console.log(`   - Deleted ${auditLogs.count} Audit Logs`);
  console.log(`   - Deleted ${appSettings.count} App Settings`);
  console.log(`   - Deleted ${rolePermissions.count} Role Permissions`);
  console.log(`   - Deleted ${permissions.count} Permissions`);
  console.log(`   - Deleted ${subjects.count} Subjects`);
  console.log(`   - Deleted ${courses.count} Courses`);
  console.log(`   - Deleted ${staffProfiles.count} Staff Profiles`);
  console.log(`   - Deleted ${departments.count} Departments`);
  console.log(`   - Deleted ${designations.count} Designations`);
  console.log(`   - Deleted ${users.count} Users`);
  console.log(`   - Deleted ${roles.count} Roles`);
  console.log('🎉 Database is now 100% empty.');
}

main()
  .catch((e) => {
    console.error('❌ Error clearing database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

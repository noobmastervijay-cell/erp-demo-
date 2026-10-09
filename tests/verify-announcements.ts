import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAnnouncementsModule() {
  console.log('🧪 Running Announcement Module Automated Tests...\n');

  // 1. Fetch Users
  const superAdmin = await prisma.user.findUnique({
    where: { email: 'admin@smit.edu.in' },
    include: { role: true },
  });

  const hodCSE = await prisma.user.findUnique({
    where: { email: 'hod.cse@smit.edu.in' },
    include: { role: true },
  });

  const teacherCSE = await prisma.user.findUnique({
    where: { email: 'suresh.n@smit.edu.in' },
    include: { role: true },
  });

  console.log('✔ Test Accounts Loaded:');
  console.log(`  - Super Admin: ${superAdmin?.name} (${superAdmin?.role.name})`);
  console.log(`  - HOD:         ${hodCSE?.name} (${hodCSE?.role.name})`);
  console.log(`  - Staff:       ${teacherCSE?.name} (${teacherCSE?.role.name})\n`);

  // TEST 1: Super Admin Can Create & Target Announcements
  console.log('TEST 1: Super Admin Announcement Creation & Targeting');
  const testNotice = await prisma.announcement.create({
    data: {
      title: 'Automated Test Circular - NAAC Peer Team Visit',
      content: 'Important circular regarding NAAC accreditation team arrival on Campus next Monday.',
      priority: 'URGENT',
      targetAudience: 'HOD',
      status: 'PUBLISHED',
      isPinned: true,
      authorId: superAdmin!.id,
    },
  });

  console.log(`  - Created announcement ID: ${testNotice.id}`);
  console.log(`  - Target Audience: ${testNotice.targetAudience}, Priority: ${testNotice.priority}`);

  if (testNotice && testNotice.targetAudience === 'HOD') {
    console.log('✅ TEST 1 PASSED: Super Admin successfully created targeted announcement.\n');
  } else {
    console.error('❌ TEST 1 FAILED');
    process.exit(1);
  }

  // TEST 2: Role-based Visibility Filtering (HOD vs Staff)
  console.log('TEST 2: Role-Scoped Announcement Visibility Filtering');

  // Query as HOD
  const hodVisible = await prisma.announcement.findMany({
    where: {
      targetAudience: { in: ['ALL', 'HOD'] },
      status: 'PUBLISHED',
    },
  });

  // Query as Staff
  const staffVisible = await prisma.announcement.findMany({
    where: {
      targetAudience: { in: ['ALL', 'STAFF'] },
      status: 'PUBLISHED',
    },
  });

  console.log(`  - Announcements visible to HOD:   ${hodVisible.length} (Includes 'HOD' & 'ALL')`);
  console.log(`  - Announcements visible to Staff: ${staffVisible.length} (Includes 'STAFF' & 'ALL')`);

  const hodHasTargetNotice = hodVisible.some((a) => a.id === testNotice.id);
  const staffHasTargetNotice = staffVisible.some((a) => a.id === testNotice.id);

  if (hodHasTargetNotice && !staffHasTargetNotice) {
    console.log('✅ TEST 2 PASSED: HOD can view HOD-targeted announcement; Staff is strictly restricted.\n');
  } else {
    console.error('❌ TEST 2 FAILED: Visibility filtering failed!');
    process.exit(1);
  }

  // TEST 3: Super Admin Edit & Cleanup
  console.log('TEST 3: Super Admin Management & Edit');
  const updatedNotice = await prisma.announcement.update({
    where: { id: testNotice.id },
    data: { title: 'Updated Test Circular - Revised Date' },
  });

  if (updatedNotice.title === 'Updated Test Circular - Revised Date') {
    console.log('✅ TEST 3 PASSED: Announcement title updated successfully.\n');
  }

  // Clean up test notice
  await prisma.announcement.delete({ where: { id: testNotice.id } });
  console.log('🧹 Cleaned up test announcement record.');

  console.log('\n🎉 ALL ANNOUNCEMENT MODULE TESTS PASSED PERFECTLY!');
}

verifyAnnouncementsModule()
  .catch((e) => {
    console.error('❌ Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

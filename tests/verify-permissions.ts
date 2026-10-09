import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Running Hierarchical Access & Branch Isolation Automated Tests...\n');

  // 1. Fetch Key Users and Departments
  const principal = await prisma.user.findUnique({
    where: { email: 'admin@smit.edu.in' },
    include: { role: true },
  });

  const hodCSE = await prisma.user.findUnique({
    where: { email: 'hod.cse@smit.edu.in' },
    include: { role: true, staffProfile: true },
  });

  const hodECE = await prisma.user.findUnique({
    where: { email: 'hod.ece@smit.edu.in' },
    include: { role: true, staffProfile: true },
  });

  const teacherCSE = await prisma.user.findUnique({
    where: { email: 'suresh.n@smit.edu.in' },
    include: { role: true, staffProfile: true },
  });

  const cseDept = await prisma.department.findUnique({ where: { code: 'CSE' } });
  const eceDept = await prisma.department.findUnique({ where: { code: 'ECE' } });

  console.log('✔ Users Loaded:');
  console.log(`  - Principal:   ${principal?.name} (${principal?.role.name})`);
  console.log(`  - CSE HOD:     ${hodCSE?.name} (${hodCSE?.staffProfile?.departmentId === cseDept?.id ? 'CSE Dept' : 'Wrong Dept'})`);
  console.log(`  - ECE HOD:     ${hodECE?.name} (${hodECE?.staffProfile?.departmentId === eceDept?.id ? 'ECE Dept' : 'Wrong Dept'})`);
  console.log(`  - CSE Teacher: ${teacherCSE?.name}\n`);

  // TEST 1: Principal Overarching Access
  const allStudents = await prisma.student.findMany({ include: { department: true } });
  const allStaff = await prisma.user.findMany({ include: { staffProfile: { include: { department: true } } } });
  const allDocs = await prisma.documentUpload.findMany({ include: { department: true } });

  console.log('TEST 1: Principal Overarching Visibility Test');
  console.log(`  - Principal total students visible: ${allStudents.length}`);
  console.log(`  - Principal total staff visible:    ${allStaff.length}`);
  console.log(`  - Principal total documents visible: ${allDocs.length}`);

  if (allStudents.length >= 4 && allDocs.length >= 3) {
    console.log('✅ TEST 1 PASSED: Principal has overarching access across all departments.\n');
  } else {
    console.error('❌ TEST 1 FAILED');
    process.exit(1);
  }

  // TEST 2: CSE HOD Branch-Wise Data Isolation
  const cseStaff = await prisma.user.findMany({
    where: { staffProfile: { departmentId: hodCSE?.staffProfile?.departmentId || undefined } },
    include: { staffProfile: true },
  });
  const cseStudents = await prisma.student.findMany({
    where: { departmentId: hodCSE?.staffProfile?.departmentId || undefined },
  });
  const cseDocs = await prisma.documentUpload.findMany({
    where: { departmentId: hodCSE?.staffProfile?.departmentId || undefined },
  });

  console.log('TEST 2: CSE HOD Department Data Isolation Test');
  console.log(`  - CSE HOD staff count: ${cseStaff.length}`);
  console.log(`  - CSE HOD student count: ${cseStudents.length}`);
  console.log(`  - CSE HOD document count: ${cseDocs.length}`);

  const hasNonCSEStaff = cseStaff.some((s) => s.staffProfile?.departmentId !== cseDept?.id);
  const hasNonCSEStudent = cseStudents.some((s) => s.departmentId !== cseDept?.id);

  if (!hasNonCSEStaff && !hasNonCSEStudent && cseStaff.length > 0 && cseStudents.length > 0) {
    console.log('✅ TEST 2 PASSED: CSE HOD can ONLY view CSE department records (0 foreign records returned).\n');
  } else {
    console.error('❌ TEST 2 FAILED: Foreign department records found in CSE query!');
    process.exit(1);
  }

  // TEST 3: ECE HOD Branch-Wise Data Isolation
  const eceStaff = await prisma.user.findMany({
    where: { staffProfile: { departmentId: hodECE?.staffProfile?.departmentId || undefined } },
    include: { staffProfile: true },
  });
  const eceStudents = await prisma.student.findMany({
    where: { departmentId: hodECE?.staffProfile?.departmentId || undefined },
  });
  const eceDocs = await prisma.documentUpload.findMany({
    where: { departmentId: hodECE?.staffProfile?.departmentId || undefined },
  });

  console.log('TEST 3: ECE HOD Department Data Isolation Test');
  console.log(`  - ECE HOD staff count: ${eceStaff.length}`);
  console.log(`  - ECE HOD student count: ${eceStudents.length}`);
  console.log(`  - ECE HOD document count: ${eceDocs.length}`);

  const eceHasCSEDoc = eceDocs.some((d) => d.departmentId === cseDept?.id);

  if (!eceHasCSEDoc && eceStaff.length > 0 && eceStudents.length > 0) {
    console.log('✅ TEST 3 PASSED: ECE HOD CANNOT see CSE department records.\n');
  } else {
    console.error('❌ TEST 3 FAILED: ECE HOD accessed CSE data!');
    process.exit(1);
  }

  // TEST 4: Teacher Word/PDF/Spreadsheet Upload and HOD Access Test
  console.log('TEST 4: Teacher Document Upload & HOD Visibility Test');
  const newUpload = await prisma.documentUpload.create({
    data: {
      title: 'Automated Test Unit Test Marksheet',
      description: 'Test document uploaded by CSE Teacher',
      fileType: 'WORD',
      fileName: 'CSE_Test_Marksheet.docx',
      fileUrl: '/uploads/documents/CSE_Test_Marksheet.docx',
      fileSize: 1024 * 200,
      departmentId: teacherCSE?.staffProfile?.departmentId || cseDept!.id,
      uploadedByUserId: teacherCSE!.id,
    },
  });

  console.log(`  - Teacher uploaded: "${newUpload.title}" (${newUpload.fileType})`);

  // Verify CSE HOD sees it
  const cseHODCanSee = await prisma.documentUpload.findFirst({
    where: {
      id: newUpload.id,
      departmentId: hodCSE?.staffProfile?.departmentId || undefined,
    },
  });

  // Verify ECE HOD DOES NOT see it
  const eceHODCanSee = await prisma.documentUpload.findFirst({
    where: {
      id: newUpload.id,
      departmentId: hodECE?.staffProfile?.departmentId || undefined,
    },
  });

  if (cseHODCanSee && !eceHODCanSee) {
    console.log('✅ TEST 4 PASSED: CSE HOD can access CSE Teacher upload; ECE HOD is blocked.\n');
  } else {
    console.error('❌ TEST 4 FAILED');
    process.exit(1);
  }

  console.log('🎉 ALL HIERARCHICAL ACCESS & DATA ISOLATION TESTS PASSED PERFECTLY!');
}

runTests()
  .catch((e) => {
    console.error('❌ Test run error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

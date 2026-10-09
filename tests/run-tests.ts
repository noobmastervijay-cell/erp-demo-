import { prisma } from '../lib/db';
import { hashPassword, comparePassword, checkRateLimit } from '../lib/auth';
import { hasPermission } from '../lib/permissions';

async function runTests() {
  console.log('🧪 Starting SMIT ERP Automated Verification Tests...\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Password Hashing
  try {
    const rawPass = 'TestPass@123';
    const hash = await hashPassword(rawPass);
    const isValid = await comparePassword(rawPass, hash);
    const isInvalid = await comparePassword('WrongPass', hash);

    if (isValid && !isInvalid) {
      console.log('✅ PASS: Password hashing & verification logic');
      passed++;
    } else {
      console.error('❌ FAIL: Password comparison mismatch');
      failed++;
    }
  } catch (e) {
    console.error('❌ FAIL: Password test exception', e);
    failed++;
  }

  // Test 2: Rate Limiting
  try {
    const testKey = 'test_rate_limit_user';
    let allowedCount = 0;
    for (let i = 0; i < 6; i++) {
      const res = checkRateLimit(testKey);
      if (res.allowed) allowedCount++;
    }
    if (allowedCount === 5) {
      console.log('✅ PASS: Login rate limiter sliding window (blocks after 5 attempts)');
      passed++;
    } else {
      console.error(`❌ FAIL: Rate limiter allowed ${allowedCount} instead of 5`);
      failed++;
    }
  } catch (e) {
    console.error('❌ FAIL: Rate limit test exception', e);
    failed++;
  }

  // Test 3: Super Admin DB Account
  try {
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@smit.edu.in' },
      include: { role: true },
    });

    if (admin && admin.role.name === 'SUPER_ADMIN') {
      console.log(`✅ PASS: Database Super Admin seeded (${admin.name}, ${admin.email})`);
      passed++;
    } else {
      console.error('❌ FAIL: Super Admin user account missing in database');
      failed++;
    }
  } catch (e) {
    console.error('❌ FAIL: DB admin query exception', e);
    failed++;
  }

  // Test 4: Dynamic Permission Check
  try {
    const mockAdminUser: any = {
      id: '1',
      roleName: 'SUPER_ADMIN',
      permissions: [],
    };
    const mockStaffUser: any = {
      id: '2',
      roleName: 'STAFF',
      permissions: ['staff:view_self'],
    };

    const adminCheck = hasPermission(mockAdminUser, 'audit:view');
    const staffCheckAllowed = hasPermission(mockStaffUser, 'staff:view_self');
    const staffCheckBlocked = hasPermission(mockStaffUser, 'audit:view');

    if (adminCheck && staffCheckAllowed && !staffCheckBlocked) {
      console.log('✅ PASS: Role & Permission enforcement engine');
      passed++;
    } else {
      console.error('❌ FAIL: Permission check logic failed');
      failed++;
    }
  } catch (e) {
    console.error('❌ FAIL: Permission engine exception', e);
    failed++;
  }

  // Test 5: Academic Data Model
  try {
    const depts = await prisma.department.findMany();
    const courses = await prisma.course.findMany();
    const subjects = await prisma.subject.findMany();

    if (depts.length > 0 && courses.length > 0 && subjects.length > 0) {
      console.log(`✅ PASS: Academic structure populated (${depts.length} Depts, ${courses.length} Courses, ${subjects.length} Subjects)`);
      passed++;
    } else {
      console.error('❌ FAIL: Academic relational tables empty');
      failed++;
    }
  } catch (e) {
    console.error('❌ FAIL: Academic query exception', e);
    failed++;
  }

  console.log('\n----------------------------------------------------');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED.`);
  console.log('----------------------------------------------------');

  await prisma.$disconnect();

  if (failed > 0) process.exit(1);
}

runTests();

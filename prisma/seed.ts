import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SMIT ERP database seed with Hierarchical Access & Branch Isolation...');

  // 1. Clear existing data in safe foreign key order
  await prisma.announcement.deleteMany();
  await prisma.documentUpload.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.student.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.appSetting.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.course.deleteMany();
  await prisma.staffProfile.deleteMany();
  await prisma.department.updateMany({ data: { hodUserId: null } });
  await prisma.department.deleteMany();
  await prisma.designation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // 2. Define System Permissions
  const permissionsData = [
    // Staff Management
    { code: 'staff:view', name: 'View All Staff', category: 'Staff', description: 'Can view staff directory and profiles' },
    { code: 'staff:create', name: 'Add New Staff', category: 'Staff', description: 'Can create new staff user accounts' },
    { code: 'staff:edit', name: 'Edit Staff Profile', category: 'Staff', description: 'Can edit staff details and departments' },
    { code: 'staff:deactivate', name: 'Activate/Deactivate Staff', category: 'Staff', description: 'Can change staff activation status' },
    { code: 'staff:reset_password', name: 'Reset User Password', category: 'Staff', description: 'Can reset staff passwords' },
    { code: 'staff:export', name: 'Export Staff Data', category: 'Staff', description: 'Can export staff reports' },
    { code: 'staff:view_self', name: 'View Own Profile', category: 'Staff', description: 'Can view personal staff profile' },

    // Academic Management
    { code: 'academic:view', name: 'View Academic Master Data', category: 'Academic', description: 'Can view departments, courses, subjects, designations' },
    { code: 'academic:manage', name: 'Manage Academic Master Data', category: 'Academic', description: 'Can edit departments and courses' },

    // Students Management
    { code: 'students:view', name: 'View Student Directory', category: 'Students', description: 'Can view student roster and details' },
    { code: 'students:manage', name: 'Manage Students', category: 'Students', description: 'Can enroll or edit student profiles' },

    // Attendance Management
    { code: 'attendance:manage', name: 'Manage Attendance', category: 'Attendance', description: 'Can mark and view student attendance records' },

    // Document & Report Uploads
    { code: 'documents:upload', name: 'Upload Student Reports & Files', category: 'Documents', description: 'Can upload Word, PDF, Excel reports' },
    { code: 'documents:view', name: 'View Department Documents', category: 'Documents', description: 'Can view uploaded department files' },
    { code: 'documents:manage', name: 'Manage Documents', category: 'Documents', description: 'Can manage or delete document uploads' },

    // Reports & Analytics
    { code: 'reports:view', name: 'View & Download Reports', category: 'Reports', description: 'Can access reporting dashboard' },

    // Audit Logs
    { code: 'audit:view', name: 'View System Audit Logs', category: 'Audit', description: 'Can view system audit trails' },

    // System Settings & Roles
    { code: 'settings:manage', name: 'Manage College Settings', category: 'Settings', description: 'Can customize college settings' },
    { code: 'roles:manage', name: 'Manage Roles & Permissions', category: 'Settings', description: 'Can configure permissions assigned to each user role' },

    // Announcement Module
    { code: 'announcements:view', name: 'View Campus Announcements', category: 'Announcements', description: 'Can view official institution circulars and announcements' },
    { code: 'announcements:manage', name: 'Manage Announcements', category: 'Announcements', description: 'Exclusive permission to create, edit, target, and delete announcements' },
  ];

  const permissions: Record<string, string> = {};
  for (const item of permissionsData) {
    const created = await prisma.permission.create({ data: item });
    permissions[item.code] = created.id;
  }
  console.log(`✅ Created ${Object.keys(permissions).length} system permissions.`);

  // 3. System Roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'SUPER_ADMIN',
      label: 'Principal / Super Admin',
      description: 'Full overarching access to all departments, HODs, staff, students, and settings across the institution.',
      isSystem: true,
    },
  });

  const hodRole = await prisma.role.create({
    data: {
      name: 'HOD',
      label: 'Head of Department (HOD)',
      description: 'Access strictly restricted to reporting staff, students, attendance, and documents of their assigned department.',
      isSystem: true,
    },
  });

  const staffRole = await prisma.role.create({
    data: {
      name: 'STAFF',
      label: 'Faculty / Teacher',
      description: 'Can manage student attendance and upload Word, PDF, Spreadsheet reports for their assigned department.',
      isSystem: true,
    },
  });

  // Assign ALL permissions to Super Admin (Principal)
  for (const permId of Object.values(permissions)) {
    await prisma.rolePermission.create({
      data: { roleId: adminRole.id, permissionId: permId },
    });
  }

  // Assign permissions to HOD (Department Head)
  const hodPermCodes = [
    'staff:view', 'staff:edit', 'staff:view_self',
    'academic:view',
    'students:view', 'students:manage',
    'attendance:manage',
    'documents:upload', 'documents:view', 'documents:manage',
    'reports:view',
    'announcements:view'
  ];
  for (const code of hodPermCodes) {
    if (permissions[code]) {
      await prisma.rolePermission.create({
        data: { roleId: hodRole.id, permissionId: permissions[code] },
      });
    }
  }

  // Assign permissions to Staff / Teacher
  const staffPermCodes = [
    'staff:view_self',
    'academic:view',
    'students:view',
    'attendance:manage',
    'documents:upload', 'documents:view',
    'announcements:view'
  ];
  for (const code of staffPermCodes) {
    if (permissions[code]) {
      await prisma.rolePermission.create({
        data: { roleId: staffRole.id, permissionId: permissions[code] },
      });
    }
  }

  console.log('✅ Configured Roles (SUPER_ADMIN, HOD, STAFF) and mapped permission matrix.');

  // 4. Designations
  const profDesig = await prisma.designation.create({
    data: { code: 'PROF', title: 'Professor', category: 'TEACHING' },
  });
  const assocProfDesig = await prisma.designation.create({
    data: { code: 'ASSOC_PROF', title: 'Associate Professor', category: 'TEACHING' },
  });
  const asstProfDesig = await prisma.designation.create({
    data: { code: 'ASST_PROF', title: 'Assistant Professor', category: 'TEACHING' },
  });
  const adminOfficerDesig = await prisma.designation.create({
    data: { code: 'ADMIN_OFFICER', title: 'Administrative Officer', category: 'ADMINISTRATIVE' },
  });
  console.log('✅ Created Designations.');

  // 5. College Settings
  const defaultSettings = [
    { key: 'college_name', value: 'Sri Muthukumaran Institute of Technology', group: 'BRANDING' },
    { key: 'college_short_name', value: 'SMIT', group: 'BRANDING' },
    { key: 'college_tagline', value: 'Approved by AICTE, Affiliated to Anna University, Chennai', group: 'BRANDING' },
    { key: 'primary_color', value: '#701111', group: 'BRANDING' },
    { key: 'secondary_color', value: '#e59835', group: 'BRANDING' },
    { key: 'academic_year', value: '2026-2027', group: 'ACADEMIC' },
    { key: 'current_semester', value: 'Odd Semester (2026)', group: 'ACADEMIC' },
  ];
  for (const s of defaultSettings) {
    await prisma.appSetting.create({ data: s });
  }

  // 6. Departments
  const deptCSE = await prisma.department.create({
    data: { code: 'CSE', name: 'Computer Science & Engineering', description: 'Department of Computer Science & Engineering.' },
  });
  const deptECE = await prisma.department.create({
    data: { code: 'ECE', name: 'Electronics & Communication Engineering', description: 'Department of Electronics & Communication Engineering.' },
  });
  const deptAIDS = await prisma.department.create({
    data: { code: 'AIDS', name: 'Artificial Intelligence & Data Science', description: 'Department of AI & Data Science.' },
  });
  const deptMECH = await prisma.department.create({
    data: { code: 'MECH', name: 'Mechanical Engineering', description: 'Department of Mechanical Engineering.' },
  });
  const deptCIVIL = await prisma.department.create({
    data: { code: 'CIVIL', name: 'Civil Engineering', description: 'Department of Civil Engineering.' },
  });
  console.log('✅ Created 5 Departments (CSE, ECE, AIDS, MECH, CIVIL).');

  // 7. Courses & Subjects
  const courseBECSE = await prisma.course.create({
    data: { code: 'BE-CSE', name: 'B.E. Computer Science and Engineering', departmentId: deptCSE.id, degreeType: 'UNDERGRADUATE', durationYears: 4, totalSemesters: 8 },
  });
  const courseBEECE = await prisma.course.create({
    data: { code: 'BE-ECE', name: 'B.E. Electronics and Communication Engineering', departmentId: deptECE.id, degreeType: 'UNDERGRADUATE', durationYears: 4, totalSemesters: 8 },
  });
  const courseBTECHAIDS = await prisma.course.create({
    data: { code: 'BTECH-AIDS', name: 'B.Tech Artificial Intelligence and Data Science', departmentId: deptAIDS.id, degreeType: 'UNDERGRADUATE', durationYears: 4, totalSemesters: 8 },
  });

  const subCompiler = await prisma.subject.create({
    data: { code: 'CS3501', name: 'Compiler Design', departmentId: deptCSE.id, courseId: courseBECSE.id, semester: 5, credits: 3, subjectType: 'THEORY' },
  });
  const subNetworks = await prisma.subject.create({
    data: { code: 'CS3591', name: 'Computer Networks', departmentId: deptCSE.id, courseId: courseBECSE.id, semester: 5, credits: 4, subjectType: 'THEORY' },
  });
  const subDSP = await prisma.subject.create({
    data: { code: 'EC8451', name: 'Digital Signal Processing', departmentId: deptECE.id, courseId: courseBEECE.id, semester: 6, credits: 4, subjectType: 'THEORY' },
  });

  // 8. Password Hashes
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
  const customAdminPasswordHash = await bcrypt.hash('!@#%5321', 10);
  const staffPasswordHash = await bcrypt.hash('Staff@123456', 10);

  // 9. Users & Staff Profiles
  
  // Principal (Super Admin)
  const principalUser = await prisma.user.create({
    data: {
      employeeId: 'EMP-ADMIN-001',
      email: 'admin@smit.edu.in',
      name: 'Dr. K. S. Ramanathan (Principal)',
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
      status: 'ACTIVE',
      mustChangePassword: false,
      staffProfile: {
        create: {
          phone: '+91 98401 12345',
          designationId: adminOfficerDesig.id,
          employmentStatus: 'FULL_TIME',
          qualification: 'Ph.D in Computer Science & Engineering',
          experienceYears: 22,
          address: 'Principal Quarters, SMIT Campus, Chennai',
        },
      },
    },
  });

  // Custom IT Admin
  await prisma.user.create({
    data: {
      employeeId: 'IT123@123',
      email: 'IT123@123',
      name: 'IT Administrator',
      passwordHash: customAdminPasswordHash,
      roleId: adminRole.id,
      status: 'ACTIVE',
      mustChangePassword: false,
      staffProfile: {
        create: {
          phone: '+91 98400 12345',
          departmentId: deptCSE.id,
          designationId: adminOfficerDesig.id,
          employmentStatus: 'FULL_TIME',
          qualification: 'M.Tech IT System Administrator',
          experienceYears: 10,
          address: 'IT Department, SMIT Chennai',
        },
      },
    },
  });

  // HOD CSE
  const hodCSEUser = await prisma.user.create({
    data: {
      employeeId: 'EMP-CSE-001',
      email: 'hod.cse@smit.edu.in',
      name: 'Dr. M. Anbarasan (CSE HOD)',
      passwordHash: staffPasswordHash,
      roleId: hodRole.id,
      status: 'ACTIVE',
      mustChangePassword: false,
      staffProfile: {
        create: {
          phone: '+91 98402 23456',
          departmentId: deptCSE.id,
          designationId: profDesig.id,
          employmentStatus: 'FULL_TIME',
          qualification: 'Ph.D in Cloud & Distributed Systems',
          experienceYears: 16,
          address: 'Anna Nagar, Chennai',
        },
      },
    },
  });
  await prisma.department.update({ where: { id: deptCSE.id }, data: { hodUserId: hodCSEUser.id } });

  // HOD ECE
  const hodECEUser = await prisma.user.create({
    data: {
      employeeId: 'EMP-ECE-001',
      email: 'hod.ece@smit.edu.in',
      name: 'Dr. S. Vijayalakshmi (ECE HOD)',
      passwordHash: staffPasswordHash,
      roleId: hodRole.id,
      status: 'ACTIVE',
      mustChangePassword: false,
      staffProfile: {
        create: {
          phone: '+91 98403 34567',
          departmentId: deptECE.id,
          designationId: profDesig.id,
          employmentStatus: 'FULL_TIME',
          qualification: 'Ph.D in VLSI Design',
          experienceYears: 17,
          address: 'Porur, Chennai',
        },
      },
    },
  });
  await prisma.department.update({ where: { id: deptECE.id }, data: { hodUserId: hodECEUser.id } });

  // HOD AIDS
  const hodAIDSUser = await prisma.user.create({
    data: {
      employeeId: 'EMP-AIDS-001',
      email: 'hod.aids@smit.edu.in',
      name: 'Dr. R. Karthikeyan (AIDS HOD)',
      passwordHash: staffPasswordHash,
      roleId: hodRole.id,
      status: 'ACTIVE',
      mustChangePassword: false,
      staffProfile: {
        create: {
          phone: '+91 98404 45678',
          departmentId: deptAIDS.id,
          designationId: assocProfDesig.id,
          employmentStatus: 'FULL_TIME',
          qualification: 'Ph.D in Artificial Intelligence',
          experienceYears: 13,
          address: 'Kanchipuram, Tamil Nadu',
        },
      },
    },
  });
  await prisma.department.update({ where: { id: deptAIDS.id }, data: { hodUserId: hodAIDSUser.id } });

  // CSE Faculty Teachers
  const teacherCSE1 = await prisma.user.create({
    data: {
      employeeId: 'EMP-CSE-002',
      email: 'suresh.n@smit.edu.in',
      name: 'Prof. N. Suresh (CSE Teacher)',
      passwordHash: staffPasswordHash,
      roleId: staffRole.id,
      status: 'ACTIVE',
      mustChangePassword: false,
      staffProfile: {
        create: {
          phone: '+91 98405 56789',
          departmentId: deptCSE.id,
          designationId: asstProfDesig.id,
          employmentStatus: 'FULL_TIME',
          qualification: 'M.E. Computer Science & Engineering',
          experienceYears: 8,
          address: 'Tambaram, Chennai',
        },
      },
    },
  });

  const teacherCSE2 = await prisma.user.create({
    data: {
      employeeId: 'EMP-CSE-003',
      email: 'deepa.p@smit.edu.in',
      name: 'Prof. P. Deepa (CSE Teacher)',
      passwordHash: staffPasswordHash,
      roleId: staffRole.id,
      status: 'ACTIVE',
      mustChangePassword: false,
      staffProfile: {
        create: {
          phone: '+91 98406 67890',
          departmentId: deptCSE.id,
          designationId: assocProfDesig.id,
          employmentStatus: 'FULL_TIME',
          qualification: 'M.Tech Computer Science',
          experienceYears: 11,
          address: 'Mangadu, Chennai',
        },
      },
    },
  });

  // ECE Faculty Teacher
  const teacherECE1 = await prisma.user.create({
    data: {
      employeeId: 'EMP-ECE-002',
      email: 'ganesh.v@smit.edu.in',
      name: 'Prof. V. Ganesh (ECE Teacher)',
      passwordHash: staffPasswordHash,
      roleId: staffRole.id,
      status: 'ACTIVE',
      mustChangePassword: false,
      staffProfile: {
        create: {
          phone: '+91 98407 78901',
          departmentId: deptECE.id,
          designationId: asstProfDesig.id,
          employmentStatus: 'FULL_TIME',
          qualification: 'M.E. Communication Systems',
          experienceYears: 7,
          address: 'Poonamallee, Chennai',
        },
      },
    },
  });

  console.log('✅ Created Principal, HODs, and Department Faculty.');

  // 10. Students Seed
  const studentCSE1 = await prisma.student.create({
    data: {
      rollNumber: '211421104001',
      name: 'Aravind Kumar',
      email: 'aravind.cse21@smit.edu.in',
      phone: '+91 97890 12345',
      departmentId: deptCSE.id,
      courseId: courseBECSE.id,
      semester: 5,
      section: 'A',
      batch: '2021-2025',
      status: 'ACTIVE',
    },
  });

  const studentCSE2 = await prisma.student.create({
    data: {
      rollNumber: '211421104002',
      name: 'Bhavani Sankar',
      email: 'bhavani.cse21@smit.edu.in',
      phone: '+91 97890 23456',
      departmentId: deptCSE.id,
      courseId: courseBECSE.id,
      semester: 5,
      section: 'A',
      batch: '2021-2025',
      status: 'ACTIVE',
    },
  });

  const studentECE1 = await prisma.student.create({
    data: {
      rollNumber: '211421106001',
      name: 'Chitra Devi',
      email: 'chitra.ece21@smit.edu.in',
      phone: '+91 97890 34567',
      departmentId: deptECE.id,
      courseId: courseBEECE.id,
      semester: 6,
      section: 'A',
      batch: '2021-2025',
      status: 'ACTIVE',
    },
  });

  const studentECE2 = await prisma.student.create({
    data: {
      rollNumber: '211421106002',
      name: 'Dinesh Karthik',
      email: 'dinesh.ece21@smit.edu.in',
      phone: '+91 97890 45678',
      departmentId: deptECE.id,
      courseId: courseBEECE.id,
      semester: 6,
      section: 'A',
      batch: '2021-2025',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created CSE & ECE Students.');

  // 11. Attendance Records Seed
  await prisma.attendanceRecord.create({
    data: {
      studentId: studentCSE1.id,
      subjectId: subCompiler.id,
      departmentId: deptCSE.id,
      markedByUserId: teacherCSE1.id,
      date: new Date(),
      status: 'PRESENT',
      remarks: 'Active participation in lecture.',
    },
  });

  await prisma.attendanceRecord.create({
    data: {
      studentId: studentCSE2.id,
      subjectId: subCompiler.id,
      departmentId: deptCSE.id,
      markedByUserId: teacherCSE1.id,
      date: new Date(),
      status: 'ABSENT',
      remarks: 'Medical leave submitted.',
    },
  });

  await prisma.attendanceRecord.create({
    data: {
      studentId: studentECE1.id,
      subjectId: subDSP.id,
      departmentId: deptECE.id,
      markedByUserId: teacherECE1.id,
      date: new Date(),
      status: 'PRESENT',
      remarks: 'Lab experiment verified.',
    },
  });

  console.log('✅ Created Attendance Records.');

  // 12. Document & Student Report Uploads Seed (Word, PDF, Spreadsheet)
  await prisma.documentUpload.create({
    data: {
      title: 'CSE III Year Compiler Design Lab Assessment Report',
      description: 'Mid-semester laboratory practical assessment and submission marks sheet.',
      fileType: 'WORD',
      fileName: 'CSE_Compiler_Design_Report_2026.docx',
      fileUrl: '/uploads/documents/CSE_Compiler_Design_Report_2026.docx',
      fileSize: 1024 * 350, // ~350 KB
      departmentId: deptCSE.id,
      uploadedByUserId: teacherCSE1.id,
      studentId: studentCSE1.id,
    },
  });

  await prisma.documentUpload.create({
    data: {
      title: 'CSE Odd Semester 2026 Monthly Attendance Register',
      description: 'Master attendance tracking spreadsheet for BE-CSE 5th semester students.',
      fileType: 'SPREADSHEET',
      fileName: 'CSE_Attendance_Register_Odd2026.xlsx',
      fileUrl: '/uploads/documents/CSE_Attendance_Register_Odd2026.xlsx',
      fileSize: 1024 * 512, // ~512 KB
      departmentId: deptCSE.id,
      uploadedByUserId: teacherCSE2.id,
    },
  });

  await prisma.documentUpload.create({
    data: {
      title: 'ECE VI Semester DSP Mid-Term Exam Result Summary',
      description: 'Official result summary and grade breakdown PDF document for ECE department.',
      fileType: 'PDF',
      fileName: 'ECE_DSP_Exam_Results_2026.pdf',
      fileUrl: '/uploads/documents/ECE_DSP_Exam_Results_2026.pdf',
      fileSize: 1024 * 850, // ~850 KB
      departmentId: deptECE.id,
      uploadedByUserId: teacherECE1.id,
      studentId: studentECE1.id,
    },
  });

  console.log('✅ Created Document & Student Report Uploads (Word, PDF, Excel).');

  // 13. Seed Sample Announcements
  await prisma.announcement.create({
    data: {
      title: 'Annual Academic Conclave 2026 - Keynote & Schedule',
      content: 'All faculty members, Department Heads, and Administrative Staff are requested to attend the Annual Academic Conclave on October 15, 2026 in the Main Auditorium. Highlighting NAAC Accreditation targets and AI curriculum integration.',
      priority: 'HIGH',
      targetAudience: 'ALL',
      status: 'PUBLISHED',
      isPinned: true,
      authorId: principalUser.id,
    },
  });

  await prisma.announcement.create({
    data: {
      title: 'HOD Monthly Strategic Budget & Curriculum Review Meeting',
      content: 'Urgent meeting scheduled for all Department Heads (HODs) with the Principal on Friday at 3:00 PM in the Executive Board Room. Topics include Q4 laboratory equipment budget allocations and upcoming Anna University syllabus revisions.',
      priority: 'URGENT',
      targetAudience: 'HOD',
      status: 'PUBLISHED',
      isPinned: true,
      authorId: principalUser.id,
    },
  });

  await prisma.announcement.create({
    data: {
      title: 'Anna University End-Semester Invigilation Roster Released',
      content: 'The official invigilation duty roster for the upcoming end-semester practical and theory examinations has been uploaded to the portal. All faculty staff members must verify their assigned exam slots and submit acknowledgement.',
      priority: 'NORMAL',
      targetAudience: 'STAFF',
      status: 'PUBLISHED',
      isPinned: false,
      authorId: principalUser.id,
    },
  });

  console.log('✅ Created Default Announcements (Targeted to ALL, HOD, and STAFF).');

  // 14. Audit Log
  await prisma.auditLog.create({
    data: {
      userId: principalUser.id,
      userName: principalUser.name,
      userEmail: principalUser.email,
      action: 'SYSTEM_INITIALIZED',
      category: 'SYSTEM',
      details: 'Hierarchical access framework and branch-wise data isolation initialized successfully.',
    },
  });

  console.log('🎉 Seed completed successfully!');
  console.log('----------------------------------------------------');
  console.log('🔑 LOGIN ACCOUNTS FOR TESTING ISOLATION:');
  console.log(' 1. Super Admin (Principal): admin@smit.edu.in / Admin@123456 (All Depts)');
  console.log(' 2. CSE HOD:                 hod.cse@smit.edu.in / Staff@123456 (CSE Dept Only)');
  console.log(' 3. ECE HOD:                 hod.ece@smit.edu.in / Staff@123456 (ECE Dept Only)');
  console.log(' 4. CSE Teacher:             suresh.n@smit.edu.in / Staff@123456 (CSE Dept Only)');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

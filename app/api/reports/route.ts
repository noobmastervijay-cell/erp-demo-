import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, PERMISSION_CODES, isSuperAdmin, isHOD } from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });

    if (!hasPermission(user, PERMISSION_CODES.REPORTS_VIEW) && !isSuperAdmin(user) && !isHOD(user)) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to view reports.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type') || 'staff-directory';
    const departmentId = searchParams.get('departmentId');
    const status = searchParams.get('status');

    // Strict Branch Isolation: If user is HOD, targetDeptId is strictly locked to their departmentId
    let targetDeptId = departmentId;
    if (isHOD(user) && user.departmentId) {
      targetDeptId = user.departmentId;
    }

    let reportData: any[] = [];
    let title = 'Report';

    if (reportType === 'staff-directory') {
      title = 'Staff Directory Report';
      const staff = await prisma.user.findMany({
        where: {
          ...(status ? { status } : {}),
          ...(targetDeptId ? { staffProfile: { departmentId: targetDeptId } } : {}),
        },
        include: {
          role: true,
          staffProfile: {
            include: { department: true, designation: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      reportData = staff.map((s) => ({
        'Employee ID': s.employeeId,
        'Full Name': s.name,
        'Email Address': s.email,
        'Phone Number': s.staffProfile?.phone || 'N/A',
        'Role': s.role.label,
        'Department': s.staffProfile?.department?.name || 'Unassigned',
        'Designation': s.staffProfile?.designation?.title || 'N/A',
        'Employment Status': s.staffProfile?.employmentStatus || 'N/A',
        'Account Status': s.status,
        'Date Joined': s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A',
      }));
    } else if (reportType === 'department-staff') {
      title = 'Department-wise Staff Allocation Report';
      const depts = await prisma.department.findMany({
        where: {
          ...(targetDeptId ? { id: targetDeptId } : {}),
        },
        include: {
          hodUser: true,
          staff: {
            include: {
              user: { include: { role: true } },
              designation: true,
            },
          },
        },
      });

      const rows: any[] = [];
      for (const d of depts) {
        for (const sp of d.staff) {
          rows.push({
            'Department Code': d.code,
            'Department Name': d.name,
            'HOD Name': d.hodUser?.name || 'Unassigned',
            'Staff Name': sp.user.name,
            'Employee ID': sp.user.employeeId,
            'Email': sp.user.email,
            'Role': sp.user.role.label,
            'Designation': sp.designation?.title || 'N/A',
            'Status': sp.user.status,
          });
        }
      }
      reportData = rows;
    } else if (reportType === 'students-roster') {
      title = 'Student Master Roster Report';
      const students = await prisma.student.findMany({
        where: {
          ...(targetDeptId ? { departmentId: targetDeptId } : {}),
        },
        include: {
          department: true,
          course: true,
        },
        orderBy: { rollNumber: 'asc' },
      });

      reportData = students.map((st) => ({
        'Roll Number': st.rollNumber,
        'Student Name': st.name,
        'Email': st.email || 'N/A',
        'Department': st.department.name,
        'Course': st.course.name,
        'Semester': `Sem ${st.semester}`,
        'Section': st.section,
        'Batch': st.batch,
        'Status': st.status,
      }));
    } else if (reportType === 'documents-summary') {
      title = 'Department Uploaded Reports Summary';
      const docs = await prisma.documentUpload.findMany({
        where: {
          ...(targetDeptId ? { departmentId: targetDeptId } : {}),
        },
        include: {
          department: true,
          uploadedByUser: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      reportData = docs.map((doc) => ({
        'Title': doc.title,
        'File Name': doc.fileName,
        'File Format': doc.fileType,
        'Department': doc.department.name,
        'Uploaded By': doc.uploadedByUser.name,
        'Upload Date': new Date(doc.createdAt).toLocaleDateString(),
      }));
    }

    return NextResponse.json({
      title,
      generatedAt: new Date().toISOString(),
      generatedBy: user.name,
      data: reportData,
    });
  } catch (err: any) {
    console.error('Reports API error:', err);
    return NextResponse.json({ error: 'Failed to generate report.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isSuperAdmin, isHOD, isStaff } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const departmentId = searchParams.get('departmentId');
    const fileType = searchParams.get('fileType'); // WORD, PDF, SPREADSHEET
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const skip = (page - 1) * limit;

    // Department Isolation: HOD and Staff are strictly restricted to user.departmentId
    let effectiveDeptId = departmentId;
    if ((isHOD(user) || isStaff(user)) && user.departmentId) {
      effectiveDeptId = user.departmentId;
    }

    const whereCondition: any = {
      ...(effectiveDeptId ? { departmentId: effectiveDeptId } : {}),
      ...(fileType ? { fileType } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { description: { contains: search } },
              { fileName: { contains: search } },
            ],
          }
        : {}),
    };

    const [documents, totalCount] = await Promise.all([
      prisma.documentUpload.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          department: { select: { id: true, code: true, name: true } },
          uploadedByUser: { select: { id: true, name: true, employeeId: true, role: { select: { label: true } } } },
          student: { select: { id: true, rollNumber: true, name: true } },
        },
      }),
      prisma.documentUpload.count({ where: whereCondition }),
    ]);

    return NextResponse.json({
      data: documents,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err: any) {
    console.error('Documents GET error:', err);
    return NextResponse.json({ error: 'Failed to retrieve uploaded documents.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, fileType, fileName, fileUrl, fileSize, departmentId, studentId } = body;

    if (!title || !fileName || !fileType) {
      return NextResponse.json(
        { error: 'Document Title, File Name, and File Type (Word/PDF/Spreadsheet) are required.' },
        { status: 400 }
      );
    }

    // Determine document fileType category if not specified
    let normalizedType = fileType.toUpperCase();
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      normalizedType = 'WORD';
    } else if (fileName.endsWith('.pdf')) {
      normalizedType = 'PDF';
    } else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx') || fileName.endsWith('.csv')) {
      normalizedType = 'SPREADSHEET';
    }

    // Branch Isolation: HOD/Staff uploads are automatically locked to their departmentId
    let targetDeptId = departmentId;
    if ((isHOD(currentUser) || isStaff(currentUser)) && currentUser.departmentId) {
      targetDeptId = currentUser.departmentId;
    }

    if (!targetDeptId) {
      return NextResponse.json({ error: 'Department ID is required to upload a document.' }, { status: 400 });
    }

    const newDoc = await prisma.documentUpload.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        fileType: normalizedType,
        fileName: fileName.trim(),
        fileUrl: fileUrl || `/uploads/documents/${fileName.trim()}`,
        fileSize: fileSize ? parseInt(fileSize, 10) : 1024 * 250,
        departmentId: targetDeptId,
        uploadedByUserId: currentUser.id,
        studentId: studentId || null,
      },
      include: {
        department: true,
        uploadedByUser: { select: { id: true, name: true, employeeId: true } },
        student: { select: { id: true, name: true, rollNumber: true } },
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      action: 'DOCUMENT_UPLOADED',
      category: 'DOCUMENTS',
      details: `Uploaded ${normalizedType} document "${newDoc.title}" (${newDoc.fileName}) for department ${newDoc.department.code}.`,
    });

    return NextResponse.json({ success: true, data: newDoc });
  } catch (err: any) {
    console.error('Document POST error:', err);
    return NextResponse.json({ error: 'Failed to upload document record.' }, { status: 500 });
  }
}

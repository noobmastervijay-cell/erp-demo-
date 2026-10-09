'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Building2,
  BookOpen,
  Plus,
  Edit,
  Archive,
  RotateCcw,
  CheckCircle2,
  Users,
  Search,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

export default function AcademicStructurePage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'departments' | 'courses' | 'subjects' | 'designations'>('departments');

  // State
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Modals
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isDesigModalOpen, setIsDesigModalOpen] = useState(false);

  // Active Selected Item
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form states
  const [deptForm, setDeptForm] = useState({ code: '', name: '', description: '', hodUserId: '' });
  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    departmentId: '',
    degreeType: 'UNDERGRADUATE',
    durationYears: '4',
    totalSemesters: '8',
  });
  const [subjectForm, setSubjectForm] = useState({
    code: '',
    name: '',
    departmentId: '',
    courseId: '',
    semester: '1',
    credits: '3',
    subjectType: 'THEORY',
  });
  const [desigForm, setDesigForm] = useState({ code: '', title: '', category: 'TEACHING' });

  const [formLoading, setFormLoading] = useState(false);

  // Load Data
  const loadAcademicData = useCallback(async () => {
    setLoading(true);
    try {
      const [deptRes, courseRes, subRes, desigRes, staffRes] = await Promise.all([
        fetch('/api/academic/departments?includeArchived=true'),
        fetch('/api/academic/courses?includeArchived=true'),
        fetch('/api/academic/subjects'),
        fetch('/api/academic/designations'),
        fetch('/api/staff?limit=100'),
      ]);

      const deptData = await deptRes.json();
      const courseData = await courseRes.json();
      const subData = await subRes.json();
      const desigData = await desigRes.json();
      const staffData = await staffRes.json();

      if (deptData.data) setDepartments(deptData.data);
      if (courseData.data) setCourses(courseData.data);
      if (subData.data) setSubjects(subData.data);
      if (desigData.data) setDesignations(desigData.data);
      if (staffData.data) setStaffUsers(staffData.data);
    } catch (e) {
      showToast('error', 'Error', 'Failed to fetch academic master data.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAcademicData();
  }, [loadAcademicData]);

  // Handle Department Add/Edit Submit
  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const url = '/api/academic/departments';
      const method = selectedItem ? 'PUT' : 'POST';
      const payload = selectedItem ? { id: selectedItem.id, ...deptForm } : deptForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('success', 'Department Saved', 'Department details updated successfully.');
        setIsDeptModalOpen(false);
        loadAcademicData();
      } else {
        const err = await res.json();
        showToast('error', 'Failed', err.error);
      }
    } catch (e) {
      showToast('error', 'Error', 'Failed to save department.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Department Archive / Restore Toggle
  const handleToggleDeptArchive = async (dept: any) => {
    const newStatus = dept.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
    try {
      const res = await fetch('/api/academic/departments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dept.id, status: newStatus }),
      });
      if (res.ok) {
        showToast('success', 'Status Updated', `Department ${dept.code} status set to ${newStatus}.`);
        loadAcademicData();
      }
    } catch (e) {
      showToast('error', 'Error', 'Failed to update department status.');
    }
  };

  // Handle Course Add/Edit Submit
  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const url = '/api/academic/courses';
      const method = selectedItem ? 'PUT' : 'POST';
      const payload = selectedItem ? { id: selectedItem.id, ...courseForm } : courseForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('success', 'Course Saved', 'Course structure saved.');
        setIsCourseModalOpen(false);
        loadAcademicData();
      } else {
        const err = await res.json();
        showToast('error', 'Failed', err.error);
      }
    } catch (e) {
      showToast('error', 'Error', 'Failed to save course.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Subject Add/Edit Submit
  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const url = '/api/academic/subjects';
      const method = selectedItem ? 'PUT' : 'POST';
      const payload = selectedItem ? { id: selectedItem.id, ...subjectForm } : subjectForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('success', 'Subject Saved', 'Academic subject details saved.');
        setIsSubjectModalOpen(false);
        loadAcademicData();
      } else {
        const err = await res.json();
        showToast('error', 'Failed', err.error);
      }
    } catch (e) {
      showToast('error', 'Error', 'Failed to save subject.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Designation Submit
  const handleDesigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch('/api/academic/designations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(desigForm),
      });
      if (res.ok) {
        showToast('success', 'Designation Created', 'New designation title added.');
        setIsDesigModalOpen(false);
        loadAcademicData();
      }
    } catch (e) {
      showToast('error', 'Error', 'Failed to add designation.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-smit-900" />
            <h1 className="text-xl font-bold text-smit-900">Academic Master Data Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sri Muthukumaran Institute of Technology departments, courses, subjects, and staff designations.
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'departments'
              ? 'border-smit-gold text-smit-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Departments ({departments.length})
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'courses'
              ? 'border-smit-gold text-smit-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Courses & Programs ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'subjects'
              ? 'border-smit-gold text-smit-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Subjects & Syllabus ({subjects.length})
        </button>
        <button
          onClick={() => setActiveTab('designations')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'designations'
              ? 'border-smit-gold text-smit-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          Designations ({designations.length})
        </button>
      </div>

      {/* TAB 1: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-700">Departments Directory</span>
            <Button
              variant="gold"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setSelectedItem(null);
                setDeptForm({ code: '', name: '', description: '', hodUserId: '' });
                setIsDeptModalOpen(true);
              }}
            >
              Add Department
            </Button>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 font-bold uppercase text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3">Dept Code</th>
                  <th className="px-4 py-3">Department Name</th>
                  <th className="px-4 py-3">Assigned HOD</th>
                  <th className="px-4 py-3">Staff / Courses</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-smit-900">{dept.code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{dept.name}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {dept.hodUser?.name ? (
                        <span className="text-amber-800 font-bold flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {dept.hodUser.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {dept._count?.staff || 0} Staff • {dept._count?.courses || 0} Courses
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={dept.status === 'ACTIVE' ? 'active' : 'inactive'}>{dept.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => {
                          setSelectedItem(dept);
                          setDeptForm({
                            code: dept.code,
                            name: dept.name,
                            description: dept.description || '',
                            hodUserId: dept.hodUserId || '',
                          });
                          setIsDeptModalOpen(true);
                        }}
                        className="p-1 text-slate-600 hover:text-smit-900 hover:bg-slate-100 rounded"
                        title="Edit Department"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleDeptArchive(dept)}
                        className={`p-1 rounded ${
                          dept.status === 'ACTIVE'
                            ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                            : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={dept.status === 'ACTIVE' ? 'Archive Department' : 'Restore Department'}
                      >
                        {dept.status === 'ACTIVE' ? <Archive className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: COURSES */}
      {activeTab === 'courses' && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-700">Offered Degree Programs & Courses</span>
            <Button
              variant="gold"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setSelectedItem(null);
                setCourseForm({
                  code: '',
                  name: '',
                  departmentId: departments[0]?.id || '',
                  degreeType: 'UNDERGRADUATE',
                  durationYears: '4',
                  totalSemesters: '8',
                });
                setIsCourseModalOpen(true);
              }}
            >
              Add Course
            </Button>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 font-bold uppercase text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3">Course Code</th>
                  <th className="px-4 py-3">Course Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Degree & Duration</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-smit-900">{c.code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{c.name}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{c.department?.name}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {c.degreeType} • {c.durationYears} Years ({c.totalSemesters} Sems)
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={c.status === 'ACTIVE' ? 'active' : 'inactive'}>{c.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedItem(c);
                          setCourseForm({
                            code: c.code,
                            name: c.name,
                            departmentId: c.departmentId,
                            degreeType: c.degreeType,
                            durationYears: String(c.durationYears),
                            totalSemesters: String(c.totalSemesters),
                          });
                          setIsCourseModalOpen(true);
                        }}
                        className="p-1 text-slate-600 hover:text-smit-900 hover:bg-slate-100 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: SUBJECTS */}
      {activeTab === 'subjects' && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-700">Subjects & Syllabus Master</span>
            <Button
              variant="gold"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setSelectedItem(null);
                setSubjectForm({
                  code: '',
                  name: '',
                  departmentId: departments[0]?.id || '',
                  courseId: courses[0]?.id || '',
                  semester: '1',
                  credits: '3',
                  subjectType: 'THEORY',
                });
                setIsSubjectModalOpen(true);
              }}
            >
              Add Subject
            </Button>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 font-bold uppercase text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3">Subject Code</th>
                  <th className="px-4 py-3">Subject Title</th>
                  <th className="px-4 py-3">Department & Course</th>
                  <th className="px-4 py-3">Sem & Credits</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-smit-gold font-mono">{sub.code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{sub.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {sub.department?.code} - {sub.course?.code}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      Semester {sub.semester} ({sub.credits} Credits)
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="purple">{sub.subjectType}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedItem(sub);
                          setSubjectForm({
                            code: sub.code,
                            name: sub.name,
                            departmentId: sub.departmentId,
                            courseId: sub.courseId,
                            semester: String(sub.semester),
                            credits: String(sub.credits),
                            subjectType: sub.subjectType,
                          });
                          setIsSubjectModalOpen(true);
                        }}
                        className="p-1 text-slate-600 hover:text-smit-900 hover:bg-slate-100 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: DESIGNATIONS */}
      {activeTab === 'designations' && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-700">Staff Designations</span>
            <Button
              variant="gold"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setDesigForm({ code: '', title: '', category: 'TEACHING' });
                setIsDesigModalOpen(true);
              }}
            >
              Add Designation
            </Button>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 font-bold uppercase text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Designation Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {designations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-smit-900">{d.code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{d.title}</td>
                    <td className="px-4 py-3">
                      <Badge variant="info">{d.category}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="active">{d.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL 1: DEPARTMENT MODAL */}
      <Modal isOpen={isDeptModalOpen} onClose={() => setIsDeptModalOpen(false)} title="Department Master Form" maxWidth="md">
        <form onSubmit={handleDeptSubmit} className="space-y-4 text-xs">
          <Input
            label="Department Code"
            required
            placeholder="e.g. CSE, ECE, MECH"
            value={deptForm.code}
            onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
            disabled={!!selectedItem}
          />
          <Input
            label="Department Name"
            required
            placeholder="e.g. Computer Science & Engineering"
            value={deptForm.name}
            onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
          />
          <Select
            label="Assign Head of Department (HOD)"
            options={[
              { value: '', label: 'Unassigned' },
              ...staffUsers.map((s) => ({ value: s.id, label: `${s.name} (${s.employeeId})` })),
            ]}
            value={deptForm.hodUserId}
            onChange={(e) => setDeptForm({ ...deptForm, hodUserId: e.target.value })}
          />
          <Input
            label="Description"
            placeholder="Brief overview..."
            value={deptForm.description}
            onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" type="button" onClick={() => setIsDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit" isLoading={formLoading}>
              Save Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: COURSE MODAL */}
      <Modal isOpen={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} title="Course Master Form" maxWidth="md">
        <form onSubmit={handleCourseSubmit} className="space-y-4 text-xs">
          <Input
            label="Course Code"
            required
            placeholder="e.g. BE-CSE, BTECH-AIDS"
            value={courseForm.code}
            onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
          />
          <Input
            label="Course Title / Degree"
            required
            placeholder="e.g. B.E. Computer Science and Engineering"
            value={courseForm.name}
            onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
          />
          <Select
            label="Department"
            options={departments.map((d) => ({ value: d.id, label: `${d.code} - ${d.name}` }))}
            value={courseForm.departmentId}
            onChange={(e) => setCourseForm({ ...courseForm, departmentId: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duration (Years)"
              type="number"
              value={courseForm.durationYears}
              onChange={(e) => setCourseForm({ ...courseForm, durationYears: e.target.value })}
            />
            <Input
              label="Total Semesters"
              type="number"
              value={courseForm.totalSemesters}
              onChange={(e) => setCourseForm({ ...courseForm, totalSemesters: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" type="button" onClick={() => setIsCourseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit" isLoading={formLoading}>
              Save Course
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: SUBJECT MODAL */}
      <Modal isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} title="Subject Master Form" maxWidth="md">
        <form onSubmit={handleSubjectSubmit} className="space-y-4 text-xs">
          <Input
            label="Subject Code"
            required
            placeholder="e.g. CS3501"
            value={subjectForm.code}
            onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
          />
          <Input
            label="Subject Title"
            required
            placeholder="e.g. Compiler Design"
            value={subjectForm.name}
            onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
          />
          <Select
            label="Department"
            options={departments.map((d) => ({ value: d.id, label: `${d.code} - ${d.name}` }))}
            value={subjectForm.departmentId}
            onChange={(e) => setSubjectForm({ ...subjectForm, departmentId: e.target.value })}
          />
          <Select
            label="Course Program"
            options={courses.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }))}
            value={subjectForm.courseId}
            onChange={(e) => setSubjectForm({ ...subjectForm, courseId: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Semester"
              type="number"
              value={subjectForm.semester}
              onChange={(e) => setSubjectForm({ ...subjectForm, semester: e.target.value })}
            />
            <Input
              label="Credits"
              type="number"
              value={subjectForm.credits}
              onChange={(e) => setSubjectForm({ ...subjectForm, credits: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" type="button" onClick={() => setIsSubjectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit" isLoading={formLoading}>
              Save Subject
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: DESIGNATION MODAL */}
      <Modal isOpen={isDesigModalOpen} onClose={() => setIsDesigModalOpen(false)} title="Add Designation" maxWidth="md">
        <form onSubmit={handleDesigSubmit} className="space-y-4 text-xs">
          <Input
            label="Designation Code"
            required
            placeholder="e.g. PROF, ASST_PROF"
            value={desigForm.code}
            onChange={(e) => setDesigForm({ ...desigForm, code: e.target.value })}
          />
          <Input
            label="Designation Title"
            required
            placeholder="e.g. Professor, Assistant Professor"
            value={desigForm.title}
            onChange={(e) => setDesigForm({ ...desigForm, title: e.target.value })}
          />
          <Select
            label="Category"
            options={[
              { value: 'TEACHING', label: 'Teaching Faculty' },
              { value: 'NON_TEACHING', label: 'Non-Teaching Technical' },
              { value: 'ADMINISTRATIVE', label: 'Administrative' },
            ]}
            value={desigForm.category}
            onChange={(e) => setDesigForm({ ...desigForm, category: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" type="button" onClick={() => setIsDesigModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit" isLoading={formLoading}>
              Save Designation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

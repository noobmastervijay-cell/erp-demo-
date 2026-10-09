'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Plus, GraduationCap, Building, Filter, UserCheck } from 'lucide-react';

interface Student {
  id: string;
  rollNumber: string;
  name: string;
  email: string | null;
  phone: string | null;
  semester: number;
  section: string;
  batch: string;
  status: string;
  department: { id: string; code: string; name: string };
  course: { id: string; code: string; name: string };
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for adding student
  const [rollNumber, setRollNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [courseId, setCourseId] = useState('');
  const [semester, setSemester] = useState('5');
  const [section, setSection] = useState('A');
  const [batch, setBatch] = useState('2021-2025');
  const [courses, setCourses] = useState<{ id: string; code: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, [search]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/students?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.data) {
        setStudents(data.data);
      }
    } catch (e) {
      console.error('Error fetching students:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/academic/courses');
      const data = await res.json();
      if (data.data) {
        setCourses(data.data);
        if (data.data.length > 0) setCourseId(data.data[0].id);
      }
    } catch (e) {
      console.error('Error fetching courses:', e);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNumber,
          name,
          email,
          phone,
          courseId,
          semester: parseInt(semester, 10),
          section,
          batch,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsModalOpen(false);
        setRollNumber('');
        setName('');
        setEmail('');
        setPhone('');
        fetchStudents();
      } else {
        alert(data.error || 'Failed to enroll student');
      }
    } catch (err) {
      alert('An error occurred while enrolling student.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#701111] to-[#900000] p-6 rounded-2xl text-white shadow-xl">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-400/30 mb-2">
            <GraduationCap className="h-3.5 w-3.5" />
            Branch-Wise Data Isolated Roster
          </span>
          <h1 className="text-2xl font-black tracking-tight">Student Directory & Profiles</h1>
          <p className="text-xs text-amber-100/80 mt-1">
            Department-scoped student roster management for Principal, HODs, and Teachers.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-lg"
        >
          <Plus className="mr-2 h-4 w-4" /> Enroll New Student
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#701111] focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Filter className="h-4 w-4 text-amber-600" />
            <span>Showing {students.length} Student Records</span>
          </div>
        </div>
      </Card>

      {/* Student List Table */}
      <Card className="overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <th className="p-4">Roll Number</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Department</th>
                <th className="p-4">Course</th>
                <th className="p-4">Sem & Section</th>
                <th className="p-4">Batch</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-slate-500">
                    Loading student directory...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-slate-500">
                    No student records found in your department scope.
                  </td>
                </tr>
              ) : (
                students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#701111]">{st.rollNumber}</td>
                    <td className="p-4 font-bold text-slate-900">
                      <div>{st.name}</div>
                      <div className="text-[11px] font-normal text-slate-500">{st.email || 'No Email'}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-[#701111] border border-red-200">
                        <Building className="h-3 w-3" />
                        {st.department.code}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 font-medium">{st.course.name}</td>
                    <td className="p-4 text-slate-700 font-semibold">
                      Sem {st.semester} - Sec {st.section}
                    </td>
                    <td className="p-4 font-mono text-slate-600">{st.batch}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                        <UserCheck className="h-3 w-3" />
                        {st.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal for Registering Student */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-extrabold text-[#701111] border-b pb-2">
              Enroll Student in Department Scope
            </h2>
            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Roll Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 211421104005"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#701111]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Dharshini"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#701111]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="priya.cse21@smit.edu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98400 99999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Degree Course *</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester & Section</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-1/2 p-2.5 rounded-lg border border-slate-300"
                    />
                    <input
                      type="text"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-1/2 p-2.5 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Academic Batch</label>
                <input
                  type="text"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#701111] hover:bg-[#500c0c] text-white font-bold"
                >
                  {submitting ? 'Enrolling...' : 'Confirm Student Enrollment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

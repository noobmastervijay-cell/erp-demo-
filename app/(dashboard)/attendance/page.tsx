'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserCheck, CheckCircle2, XCircle, Clock, Calendar, Search } from 'lucide-react';

interface Student {
  id: string;
  rollNumber: string;
  name: string;
  section: string;
  department: { code: string; name: string };
}

interface AttendanceItem {
  id: string;
  status: string;
  remarks: string | null;
  date: string;
  student: { rollNumber: string; name: string };
  department: { code: string; name: string };
  markedByUser: { name: string };
}

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [status, setStatus] = useState('PRESENT');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stRes, attRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/attendance'),
      ]);

      const stData = await stRes.json();
      const attData = await attRes.json();

      if (stData.data) {
        setStudents(stData.data);
        if (stData.data.length > 0) setSelectedStudentId(stData.data[0].id);
      }

      if (attData.data) {
        setAttendanceLogs(attData.data);
      }
    } catch (e) {
      console.error('Error loading attendance data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          status,
          remarks,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRemarks('');
        fetchData();
      } else {
        alert(data.error || 'Failed to mark attendance');
      }
    } catch (err) {
      alert('An error occurred while marking attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#701111] to-[#800000] p-6 rounded-2xl text-white shadow-xl">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-400/30 mb-2">
            <UserCheck className="h-3.5 w-3.5" />
            Teacher Attendance & HOD Review Center
          </span>
          <h1 className="text-2xl font-black tracking-tight">Student Attendance Tracker</h1>
          <p className="text-xs text-amber-100/80 mt-1">
            Mark present/absent statuses for students. Records are isolated by department and accessible by department HOD.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Marking Form */}
        <Card className="p-6 space-y-4 shadow-lg lg:col-span-1 border-t-4 border-t-[#701111]">
          <h2 className="text-sm font-extrabold text-[#701111] flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-600" />
            Mark Student Attendance
          </h2>
          <form onSubmit={handleMarkAttendance} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Student *</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-[#701111]"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.rollNumber} - {st.name} ({st.department.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Attendance Status *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('PRESENT')}
                  className={`p-2.5 rounded-xl font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                    status === 'PRESENT'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" /> Present
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('ABSENT')}
                  className={`p-2.5 rounded-xl font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                    status === 'ABSENT'
                      ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-400'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <XCircle className="h-4 w-4" /> Absent
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('LATE')}
                  className={`p-2.5 rounded-xl font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                    status === 'LATE'
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md ring-2 ring-amber-400'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="h-4 w-4" /> Late
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Remarks / Medical Leave Notes</label>
              <textarea
                rows={3}
                placeholder="Optional notes regarding student attendance..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#701111]"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || students.length === 0}
              className="w-full bg-[#701111] hover:bg-[#500c0c] text-white font-bold py-2.5 shadow-md"
            >
              {submitting ? 'Saving...' : 'Submit Attendance Entry'}
            </Button>
          </form>
        </Card>

        {/* Department Attendance Logs Table */}
        <Card className="p-6 space-y-4 shadow-lg lg:col-span-2">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[#701111]" />
              Department Attendance Logs
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {attendanceLogs.length} Records Logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Marked By</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center p-6 text-slate-500">
                      Loading attendance records...
                    </td>
                  </tr>
                ) : attendanceLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-6 text-slate-500">
                      No attendance entries recorded for your department.
                    </td>
                  </tr>
                ) : (
                  attendanceLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900">
                        <div>{log.student.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{log.student.rollNumber}</div>
                      </td>
                      <td className="p-3 font-bold text-[#701111]">{log.department.code}</td>
                      <td className="p-3">
                        {log.status === 'PRESENT' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" /> PRESENT
                          </span>
                        )}
                        {log.status === 'ABSENT' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-extrabold text-rose-800">
                            <XCircle className="h-3 w-3" /> ABSENT
                          </span>
                        )}
                        {log.status === 'LATE' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-800">
                            <Clock className="h-3 w-3" /> LATE
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 font-medium">{log.markedByUser.name}</td>
                      <td className="p-3 text-slate-500 font-mono">
                        {new Date(log.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

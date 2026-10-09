'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Filter,
  Users,
  Building2,
  BookOpen,
  ShieldCheck,
  History,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { convertToCSV, downloadCSV } from '@/lib/export';

export default function ReportsPage() {
  const { showToast } = useToast();
  const [reportType, setReportType] = useState('staff-directory');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [reportResult, setReportResult] = useState<any>(null);

  useEffect(() => {
    fetch('/api/academic/departments')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setDepartments(data.data);
      })
      .catch(() => {});
  }, []);

  const generateReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        ...(departmentId ? { departmentId } : {}),
        ...(status ? { status } : {}),
      });

      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setReportResult(data);
      } else {
        showToast('error', 'Error', data.error || 'Failed to generate report.');
      }
    } catch (e) {
      showToast('error', 'Error', 'Could not connect to reporting engine.');
    } finally {
      setLoading(false);
    }
  }, [reportType, departmentId, status, showToast]);

  useEffect(() => {
    generateReport();
  }, [generateReport]);

  const handleDownloadCSV = () => {
    if (!reportResult?.data || reportResult.data.length === 0) return;
    const csvContent = convertToCSV(reportResult.data);
    const filename = `SMIT_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(filename, csvContent);
    showToast('info', 'Download Started', 'Report downloaded as CSV file.');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-smit-900" />
            <h1 className="text-xl font-bold text-smit-900">Institutional Reporting Engine</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sri Muthukumaran Institute of Technology downloadable staff, academic, and security audit reports.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="gold" size="sm" icon={<Download className="h-4 w-4" />} onClick={handleDownloadCSV} disabled={!reportResult?.data?.length}>
            Download CSV
          </Button>
          <Button variant="secondary" size="sm" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Filter and Report Selection */}
      <Card>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Select Report Type"
              options={[
                { value: 'staff-directory', label: '1. Staff Directory Master Report' },
                { value: 'department-staff', label: '2. Department-wise Staff Allocation' },
                { value: 'course-subject', label: '3. Course and Subject Master List' },
                { value: 'roles-permissions', label: '4. User Roles and Access Matrix' },
                { value: 'audit-summary', label: '5. Admin Audit Activity Log' },
              ]}
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            />

            <Select
              label="Filter by Department"
              options={[
                { value: '', label: 'All Departments' },
                ...departments.map((d) => ({ value: d.id, label: `${d.code} - ${d.name}` })),
              ]}
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            />

            <Select
              label="Account Status"
              options={[
                { value: '', label: 'All Account Statuses' },
                { value: 'ACTIVE', label: 'Active Staff Only' },
                { value: 'INACTIVE', label: 'Inactive Staff Only' },
              ]}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      {/* Report Preview */}
      <Card>
        <CardHeader className="flex items-center justify-between border-b py-3">
          <div>
            <h3 className="text-sm font-bold text-smit-900">{reportResult?.title || 'Report Preview'}</h3>
            <p className="text-[11px] text-slate-500">
              Generated at {reportResult?.generatedAt ? new Date(reportResult.generatedAt).toLocaleString() : '—'} by {reportResult?.generatedBy || 'Admin'}
            </p>
          </div>
          <Badge variant="admin">{reportResult?.data?.length || 0} Records Found</Badge>
        </CardHeader>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Generating report data...</div>
        ) : !reportResult?.data || reportResult.data.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No records found matching filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 font-bold uppercase text-slate-600 border-b">
                <tr>
                  {Object.keys(reportResult.data[0]).map((key) => (
                    <th key={key} className="px-4 py-3 whitespace-nowrap">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportResult.data.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    {Object.values(row).map((val: any, valIdx: number) => (
                      <td key={valIdx} className="px-4 py-2.5 whitespace-nowrap max-w-xs truncate">
                        {String(val || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { History, Search, ShieldCheck, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

export default function AuditLogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(category ? { category } : {}),
        ...(search ? { search } : {}),
      });

      const res = await fetch(`/api/audit?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setLogs(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      } else {
        showToast('error', 'Error', data.error || 'Failed to fetch audit logs.');
      }
    } catch (e) {
      showToast('error', 'Error', 'Could not load audit log feed.');
    } finally {
      setLoading(false);
    }
  }, [page, category, search, showToast]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-smit-900" />
            <h1 className="text-xl font-bold text-smit-900">System Audit Trail & History</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sri Muthukumaran Institute of Technology immutable log of user creation, role changes, password resets, and settings updates.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <Card>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Action, User, or Email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-slate-900 focus:border-smit-900 focus:outline-none"
              />
            </div>

            <Select
              options={[
                { value: '', label: 'All Log Categories' },
                { value: 'USER', label: 'User Accounts' },
                { value: 'STAFF', label: 'Staff Directory' },
                { value: 'ACADEMIC', label: 'Academic Structure' },
                { value: 'SECURITY', label: 'Security & Auth' },
                { value: 'SETTINGS', label: 'Roles & Settings' },
              ]}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardBody>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader className="flex items-center justify-between py-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            System Events ({totalCount})
          </span>
          <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 font-bold uppercase text-slate-500 border-b">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User / Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No audit records found matching search filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{log.userName || 'System'}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{log.userEmail || '—'}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-smit-900">{log.action}</td>
                    <td className="px-4 py-3">
                      <Badge variant="info">{log.category}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-sans max-w-md">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

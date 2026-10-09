'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Printer,
  RotateCcw,
  Power,
  Edit,
  Eye,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { convertToCSV, downloadCSV } from '@/lib/export';

export default function StaffManagementPage() {
  const { showToast } = useToast();
  const [staff, setStaff] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStaffCount, setTotalStaffCount] = useState(0);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Active Selected Staff Member
  const [activeStaff, setActiveStaff] = useState<any>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    password: '',
    roleId: '',
    departmentId: '',
    designationId: '',
    phone: '',
    employmentStatus: 'FULL_TIME',
    qualification: '',
    experienceYears: '0',
    address: '',
  });

  const [formLoading, setFormLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Fetch Master Data (Depts, Roles, Designations)
  const fetchMasterData = useCallback(async () => {
    try {
      const [deptRes, rolesRes, desigRes] = await Promise.all([
        fetch('/api/academic/departments'),
        fetch('/api/roles'),
        fetch('/api/academic/designations'),
      ]);

      const deptData = await deptRes.json();
      const rolesData = await rolesRes.json();
      const desigData = await desigRes.json();

      if (deptData.data) setDepartments(deptData.data);
      if (rolesData.roles) setRoles(rolesData.roles);
      if (desigData.data) setDesignations(desigData.data);
    } catch (e) {
      console.error('Failed to load master data:', e);
    }
  }, []);

  // Fetch Staff Directory Data
  const fetchStaffList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search,
        ...(selectedDept ? { departmentId: selectedDept } : {}),
        ...(selectedRole ? { roleId: selectedRole } : {}),
        ...(selectedStatus ? { status: selectedStatus } : {}),
      });

      const res = await fetch(`/api/staff?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setStaff(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalStaffCount(data.pagination?.total || 0);
      } else {
        showToast('error', 'Error', data.error || 'Failed to fetch staff directory.');
      }
    } catch (e) {
      showToast('error', 'Network Error', 'Could not connect to staff database.');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedDept, selectedRole, selectedStatus, showToast]);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  useEffect(() => {
    fetchStaffList();
  }, [fetchStaffList]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormData({
      employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      email: '',
      password: 'Staff@123456',
      roleId: roles[0]?.id || '',
      departmentId: departments[0]?.id || '',
      designationId: designations[0]?.id || '',
      phone: '',
      employmentStatus: 'FULL_TIME',
      qualification: '',
      experienceYears: '0',
      address: '',
    });
    setIsAddModalOpen(true);
  };

  // Submit Add Staff
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        showToast('success', 'Staff Added', `Account for ${formData.name} created successfully.`);
        setIsAddModalOpen(false);
        fetchStaffList();
      } else {
        showToast('error', 'Creation Failed', data.error || 'Check input details.');
      }
    } catch (e) {
      showToast('error', 'Error', 'Failed to save staff record.');
    } finally {
      setFormLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (member: any) => {
    setActiveStaff(member);
    setFormData({
      employeeId: member.employeeId,
      name: member.name,
      email: member.email,
      password: '',
      roleId: member.role?.id || '',
      departmentId: member.staffProfile?.department?.id || '',
      designationId: member.staffProfile?.designation?.id || '',
      phone: member.staffProfile?.phone || '',
      employmentStatus: member.staffProfile?.employmentStatus || 'FULL_TIME',
      qualification: member.staffProfile?.qualification || '',
      experienceYears: String(member.staffProfile?.experienceYears || '0'),
      address: member.staffProfile?.address || '',
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit Staff
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStaff) return;
    setFormLoading(true);

    try {
      const res = await fetch(`/api/staff/${activeStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        showToast('success', 'Updated', `Staff details updated for ${formData.name}.`);
        setIsEditModalOpen(false);
        fetchStaffList();
      } else {
        showToast('error', 'Update Failed', data.error || 'Failed to edit staff.');
      }
    } catch (e) {
      showToast('error', 'Error', 'An error occurred while updating profile.');
    } finally {
      setFormLoading(false);
    }
  };

  // Submit Status Toggle (Activate/Deactivate)
  const handleStatusToggle = async () => {
    if (!activeStaff) return;
    const newStatus = activeStaff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setFormLoading(true);

    try {
      const res = await fetch(`/api/staff/${activeStaff.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (res.ok) {
        showToast('success', 'Status Changed', `Account status set to ${newStatus}.`);
        setIsStatusModalOpen(false);
        fetchStaffList();
      } else {
        showToast('error', 'Failed', data.error || 'Could not change status.');
      }
    } catch (e) {
      showToast('error', 'Error', 'Failed to toggle account status.');
    } finally {
      setFormLoading(false);
    }
  };

  // Submit Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStaff) return;
    setFormLoading(true);

    try {
      const res = await fetch(`/api/staff/${activeStaff.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPassword || 'Staff@123456' }),
      });
      const data = await res.json();

      if (res.ok) {
        showToast('success', 'Password Reset', `Temporary password is: ${data.tempPassword}`);
        setIsResetPasswordModalOpen(false);
      } else {
        showToast('error', 'Reset Failed', data.error || 'Could not reset password.');
      }
    } catch (e) {
      showToast('error', 'Error', 'Failed to reset password.');
    } finally {
      setFormLoading(false);
    }
  };

  // Export Staff Directory to CSV
  const handleExportCSV = () => {
    if (staff.length === 0) return;
    const csvData = staff.map((s) => ({
      'Employee ID': s.employeeId,
      'Full Name': s.name,
      'Email': s.email,
      'Phone': s.staffProfile?.phone || 'N/A',
      'Department': s.staffProfile?.department?.name || 'Unassigned',
      'Role': s.role.label,
      'Designation': s.staffProfile?.designation?.title || 'N/A',
      'Status': s.status,
    }));

    const csvStr = convertToCSV(csvData);
    downloadCSV(`SMIT_Staff_Directory_${new Date().toISOString().split('T')[0]}.csv`, csvStr);
    showToast('info', 'Export Completed', 'Staff directory downloaded as CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-smit-900" />
            <h1 className="text-xl font-bold text-smit-900">Staff Management Directory</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sri Muthukumaran Institute of Technology staff records, roles, HOD assignments, and status controls.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="gold" size="sm" icon={<UserPlus className="h-4 w-4" />} onClick={handleOpenAddModal}>
            Add New Staff
          </Button>
          <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button variant="secondary" size="sm" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
            Print Directory
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Name, ID, or Email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-slate-900 focus:border-smit-900 focus:outline-none"
              />
            </div>

            {/* Department Filter */}
            <Select
              options={[
                { value: '', label: 'All Departments' },
                ...departments.map((d) => ({ value: d.id, label: `${d.code} - ${d.name}` })),
              ]}
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setPage(1);
              }}
            />

            {/* Role Filter */}
            <Select
              options={[
                { value: '', label: 'All User Roles' },
                ...roles.map((r) => ({ value: r.id, label: r.label })),
              ]}
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setPage(1);
              }}
            />

            {/* Status Filter */}
            <Select
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active Only' },
                { value: 'INACTIVE', label: 'Inactive Only' },
                { value: 'SUSPENDED', label: 'Suspended Only' },
              ]}
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardBody>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader className="flex items-center justify-between py-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Staff Members ({totalStaffCount})
          </span>
          <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Designation / Role</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading staff directory...
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No staff records found matching criteria.
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-smit-900 text-white font-bold text-xs">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{member.name}</div>
                          <div className="text-[11px] font-mono text-smit-gold">{member.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {member.staffProfile?.department?.code || '—'}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                        {member.staffProfile?.department?.name || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {member.staffProfile?.designation?.title || 'Faculty Member'}
                      </div>
                      <Badge variant={member.role.name === 'SUPER_ADMIN' ? 'admin' : member.role.name === 'HOD' ? 'hod' : 'staff'}>
                        {member.role.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                        <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[160px]">{member.email}</span>
                      </div>
                      {member.staffProfile?.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                          <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{member.staffProfile.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={member.status === 'ACTIVE' ? 'active' : member.status === 'INACTIVE' ? 'inactive' : 'suspended'}>
                        {member.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setActiveStaff(member);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1 text-slate-500 hover:text-smit-900 hover:bg-slate-100 rounded"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(member)}
                          className="p-1 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded"
                          title="Edit Profile"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setActiveStaff(member);
                            setNewPassword('Staff@123456');
                            setIsResetPasswordModalOpen(true);
                          }}
                          className="p-1 text-slate-500 hover:text-amber-700 hover:bg-slate-100 rounded"
                          title="Reset Password"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setActiveStaff(member);
                            setIsStatusModalOpen(true);
                          }}
                          className={`p-1 rounded ${
                            member.status === 'ACTIVE'
                              ? 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                              : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={member.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            Showing Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              icon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              icon={<ChevronRight className="h-4 w-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* MODAL 1: ADD STAFF */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Staff Member" maxWidth="xl">
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Employee ID"
              required
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            />
            <Input
              label="Full Name"
              required
              placeholder="Dr. / Prof. / Mr. Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              required
              placeholder="name@smit.edu.in"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Initial Password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              helperText="Staff will be prompted to change password on first login"
            />
            <Select
              label="User Role"
              options={roles.map((r) => ({ value: r.id, label: r.label }))}
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
            />
            <Select
              label="Department"
              options={[
                { value: '', label: 'Unassigned / Administrative' },
                ...departments.map((d) => ({ value: d.id, label: `${d.code} - ${d.name}` })),
              ]}
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            />
            <Select
              label="Designation"
              options={[
                { value: '', label: 'Select Designation' },
                ...designations.map((d) => ({ value: d.id, label: d.title })),
              ]}
              value={formData.designationId}
              onChange={(e) => setFormData({ ...formData, designationId: e.target.value })}
            />
            <Input
              label="Phone Number"
              placeholder="+91 98400 00000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Select
              label="Employment Status"
              options={[
                { value: 'FULL_TIME', label: 'Full Time Permanent' },
                { value: 'PART_TIME', label: 'Part Time' },
                { value: 'CONTRACT', label: 'Contractual' },
                { value: 'VISITING', label: 'Visiting Faculty' },
              ]}
              value={formData.employmentStatus}
              onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
            />
            <Input
              label="Qualification"
              placeholder="e.g. Ph.D, M.E. CSE"
              value={formData.qualification}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
            />
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit" isLoading={formLoading}>
              Save Staff Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: EDIT STAFF */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Staff: ${activeStaff?.name}`} maxWidth="xl">
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Select
              label="User Role"
              options={roles.map((r) => ({ value: r.id, label: r.label }))}
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
            />
            <Select
              label="Department"
              options={[
                { value: '', label: 'Unassigned / Administrative' },
                ...departments.map((d) => ({ value: d.id, label: `${d.code} - ${d.name}` })),
              ]}
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            />
            <Select
              label="Designation"
              options={[
                { value: '', label: 'Select Designation' },
                ...designations.map((d) => ({ value: d.id, label: d.title })),
              ]}
              value={formData.designationId}
              onChange={(e) => setFormData({ ...formData, designationId: e.target.value })}
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Select
              label="Employment Status"
              options={[
                { value: 'FULL_TIME', label: 'Full Time Permanent' },
                { value: 'PART_TIME', label: 'Part Time' },
                { value: 'CONTRACT', label: 'Contractual' },
                { value: 'VISITING', label: 'Visiting Faculty' },
              ]}
              value={formData.employmentStatus}
              onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
            />
            <Input
              label="Qualification"
              value={formData.qualification}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
            />
            <Input
              label="Years of Experience"
              type="number"
              value={formData.experienceYears}
              onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
            />
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t">
            <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit" isLoading={formLoading}>
              Update Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: VIEW PROFILE */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Staff Details Profile" maxWidth="lg">
        {activeStaff && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-smit-900 text-white font-bold text-xl">
                {activeStaff.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{activeStaff.name}</h3>
                <p className="text-slate-500 font-mono">{activeStaff.employeeId} • {activeStaff.email}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="admin">{activeStaff.role?.label}</Badge>
                  <Badge variant="active">{activeStaff.status}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-white border rounded-xl">
              <div>
                <span className="text-slate-400 font-semibold block">Department:</span>
                <span className="font-bold text-slate-800">{activeStaff.staffProfile?.department?.name || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Designation:</span>
                <span className="font-bold text-slate-800">{activeStaff.staffProfile?.designation?.title || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Qualification:</span>
                <span className="font-bold text-slate-800">{activeStaff.staffProfile?.qualification || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Experience:</span>
                <span className="font-bold text-slate-800">{activeStaff.staffProfile?.experienceYears || 0} Years</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Phone:</span>
                <span className="font-bold text-slate-800">{activeStaff.staffProfile?.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Joined Date:</span>
                <span className="font-bold text-slate-800">
                  {activeStaff.createdAt ? new Date(activeStaff.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 4: RESET PASSWORD */}
      <Modal isOpen={isResetPasswordModalOpen} onClose={() => setIsResetPasswordModalOpen(false)} title="Reset Staff Password" maxWidth="md">
        <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Reset password for staff member <span className="font-bold text-slate-900">{activeStaff?.name}</span> ({activeStaff?.email}). The staff user will be required to change password upon next login.
          </p>

          <Input
            label="Temporary Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Default: Staff@123456"
          />

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" type="button" onClick={() => setIsResetPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit" isLoading={formLoading}>
              Confirm Password Reset
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: STATUS CONFIRMATION */}
      <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Toggle Account Activation Status" maxWidth="md">
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to change the status of <span className="font-bold text-slate-900">{activeStaff?.name}</span> from{' '}
            <span className="font-bold">{activeStaff?.status}</span> to{' '}
            <span className="font-bold text-smit-gold">{activeStaff?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'}</span>?
          </p>
          <p className="text-[11px] text-slate-500 bg-amber-50 p-2.5 rounded border border-amber-200">
            Note: Historical academic data and audit logs for this staff member will be preserved.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleStatusToggle} isLoading={formLoading}>
              Confirm Status Change
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

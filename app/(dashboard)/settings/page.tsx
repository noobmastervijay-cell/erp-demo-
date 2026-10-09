'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Settings, ShieldCheck, Palette, Building2, Check, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'branding' | 'roles'>('branding');

  // App Settings state
  const [settings, setSettings] = useState({
    college_name: 'Sri Muthukumaran Institute of Technology',
    college_short_name: 'SMIT',
    college_tagline: 'Approved by AICTE, Affiliated to Anna University, Chennai',
    primary_color: '#102a43',
    secondary_color: '#d97706',
    contact_email: 'principal@smit.edu.in',
    contact_phone: '+91 44 2478 0005',
    college_address: 'Chikkarayapuram, Near Mangadu, Chennai, Tamil Nadu 600069',
    academic_year: '2026-2027',
    current_semester: 'Odd Semester',
  });

  const [savingSettings, setSavingSettings] = useState(false);

  // Role Permission Matrix state
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<string, string[]>>({});
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Fetch Settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.data) {
        setSettings((prev) => ({ ...prev, ...data.data }));
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }, []);

  // Fetch Roles & Permissions Matrix
  const fetchRolesMatrix = useCallback(async () => {
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      if (data.roles && data.permissions) {
        setRoles(data.roles);
        setPermissions(data.permissions);

        const map: Record<string, string[]> = {};
        data.roles.forEach((r: any) => {
          map[r.id] = r.permissionIds || [];
        });
        setRolePermissionsMap(map);

        if (!selectedRole && data.roles.length > 0) {
          setSelectedRole(data.roles[1] || data.roles[0]); // default to HOD or Staff for editing
        }
      }
    } catch (e) {
      console.error('Failed to load roles matrix:', e);
    }
  }, [selectedRole]);

  useEffect(() => {
    fetchSettings();
    fetchRolesMatrix();
  }, [fetchSettings, fetchRolesMatrix]);

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        showToast('success', 'Settings Saved', 'SMIT Branding and General College settings updated.');
      } else {
        showToast('error', 'Save Failed', 'Could not update settings.');
      }
    } catch (e) {
      showToast('error', 'Error', 'Failed to connect to settings server.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Toggle Permission Checkbox
  const handlePermissionToggle = (roleId: string, permissionId: string) => {
    setRolePermissionsMap((prev) => {
      const currentList = prev[roleId] || [];
      const exists = currentList.includes(permissionId);
      const updated = exists
        ? currentList.filter((id) => id !== permissionId)
        : [...currentList, permissionId];

      return { ...prev, [roleId]: updated };
    });
  };

  // Save Role Permissions Matrix
  const handleSavePermissions = async (roleId: string) => {
    setSavingPermissions(true);
    try {
      const permissionIds = rolePermissionsMap[roleId] || [];
      const res = await fetch('/api/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId, permissionIds }),
      });

      if (res.ok) {
        showToast('success', 'Permissions Matrix Saved', 'Role permissions updated dynamically.');
        fetchRolesMatrix();
      } else {
        showToast('error', 'Save Failed', 'Failed to update permissions.');
      }
    } catch (e) {
      showToast('error', 'Error', 'An error occurred while saving role permissions.');
    } finally {
      setSavingPermissions(false);
    }
  };

  // Group permissions by category
  const permissionCategories = Array.from(new Set(permissions.map((p) => p.category)));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-smit-900" />
            <h1 className="text-xl font-bold text-smit-900">College Settings & Role Permissions</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure central college branding, colors, academic year, and configure dynamic permissions matrix.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveTab('branding')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'branding'
              ? 'border-smit-gold text-smit-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="h-4 w-4" />
          College Branding & Info
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'roles'
              ? 'border-smit-gold text-smit-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Dynamic Role & Permission Matrix
        </button>
      </div>

      {/* TAB 1: BRANDING & GENERAL SETTINGS */}
      {activeTab === 'branding' && (
        <Card>
          <CardHeader>
            <span className="text-xs font-bold uppercase text-slate-700">Sri Muthukumaran Institute Details</span>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full College Name"
                  value={settings.college_name}
                  onChange={(e) => setSettings({ ...settings, college_name: e.target.value })}
                />
                <Input
                  label="College Short Code"
                  value={settings.college_short_name}
                  onChange={(e) => setSettings({ ...settings, college_short_name: e.target.value })}
                />
                <Input
                  label="Primary Branding Color (Hex)"
                  value={settings.primary_color}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  helperText="Default: #102a43 (SMIT Navy Blue)"
                />
                <Input
                  label="Secondary Accent Color (Hex)"
                  value={settings.secondary_color}
                  onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                  helperText="Default: #d97706 (SMIT Gold Accent)"
                />
                <Input
                  label="Contact Email"
                  value={settings.contact_email}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                />
                <Input
                  label="Contact Phone"
                  value={settings.contact_phone}
                  onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                />
                <Input
                  label="Current Academic Year"
                  value={settings.academic_year}
                  onChange={(e) => setSettings({ ...settings, academic_year: e.target.value })}
                />
                <Input
                  label="Current Semester Period"
                  value={settings.current_semester}
                  onChange={(e) => setSettings({ ...settings, current_semester: e.target.value })}
                />
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button variant="gold" type="submit" isLoading={savingSettings} icon={<Save className="h-4 w-4" />}>
                  Save College Settings
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* TAB 2: DYNAMIC ROLE PERMISSION MATRIX */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Roles Selector Side Panel */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">System User Roles</p>
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`w-full text-left p-4 rounded-xl border transition-all text-xs ${
                  selectedRole?.id === role.id
                    ? 'border-smit-900 bg-smit-900 text-white shadow-md'
                    : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{role.label}</span>
                  <Badge variant={role.name === 'SUPER_ADMIN' ? 'admin' : role.name === 'HOD' ? 'hod' : 'staff'}>
                    {role.userCount} Users
                  </Badge>
                </div>
                <p
                  className={`mt-1 text-[11px] ${
                    selectedRole?.id === role.id ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {role.description}
                </p>
              </button>
            ))}
          </div>

          {/* Permissions Matrix Panel */}
          <div className="lg:col-span-3">
            {selectedRole && (
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-smit-900">
                      Configure Permissions for {selectedRole.label}
                    </span>
                    {selectedRole.name === 'SUPER_ADMIN' && (
                      <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                        * Super Admin automatically inherits full system access.
                      </p>
                    )}
                  </div>
                  {selectedRole.name !== 'SUPER_ADMIN' && (
                    <Button
                      variant="gold"
                      size="sm"
                      isLoading={savingPermissions}
                      icon={<Save className="h-4 w-4" />}
                      onClick={() => handleSavePermissions(selectedRole.id)}
                    >
                      Save {selectedRole.label} Matrix
                    </Button>
                  )}
                </CardHeader>
                <CardBody className="space-y-6">
                  {permissionCategories.map((cat) => (
                    <div key={cat} className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-smit-900 border-b pb-1">
                        {cat} Modules & Actions
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {permissions
                          .filter((p) => p.category === cat)
                          .map((perm) => {
                            const isChecked =
                              selectedRole.name === 'SUPER_ADMIN' ||
                              (rolePermissionsMap[selectedRole.id] || []).includes(perm.id);

                            return (
                              <label
                                key={perm.id}
                                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                  isChecked
                                    ? 'bg-amber-50/50 border-amber-300 text-slate-900'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  disabled={selectedRole.name === 'SUPER_ADMIN'}
                                  checked={isChecked}
                                  onChange={() => handlePermissionToggle(selectedRole.id, perm.id)}
                                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-smit-900 focus:ring-smit-900"
                                />
                                <div>
                                  <div className="font-bold text-xs text-slate-900">{perm.name}</div>
                                  <p className="text-[11px] text-slate-500 font-normal">{perm.description}</p>
                                  <span className="text-[10px] font-mono text-slate-400">{perm.code}</span>
                                </div>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

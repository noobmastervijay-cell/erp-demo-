'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User as UserIcon, KeyRound, Mail, Phone, Building2, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

export default function ProfilePage() {
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState('');
  const [address, setAddress] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchSessionUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setName(data.user.name || '');

        // Fetch full profile info
        const profileRes = await fetch(`/api/staff/${data.user.id}`);
        const profileData = await profileRes.json();
        if (profileData.data?.staffProfile) {
          const sp = profileData.data.staffProfile;
          setPhone(sp.phone || '');
          setQualification(sp.qualification || '');
          setAddress(sp.address || '');
        }
      }
    } catch (e) {
      showToast('error', 'Error', 'Failed to load user profile.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSessionUser();
  }, [fetchSessionUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdatingProfile(true);

    try {
      const res = await fetch(`/api/staff/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, qualification, address }),
      });

      if (res.ok) {
        showToast('success', 'Profile Updated', 'Your profile details have been saved.');
        fetchSessionUser();
      } else {
        showToast('error', 'Update Failed', 'Could not save profile changes.');
      }
    } catch (e) {
      showToast('error', 'Error', 'Network error while updating profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('error', 'Weak Password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Mismatch', 'New passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        showToast('success', 'Password Changed', 'Your account password has been updated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast('error', 'Error', data.error || 'Failed to change password.');
      }
    } catch (e) {
      showToast('error', 'Error', 'Failed to update password.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs text-slate-400">Loading profile...</div>;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <UserIcon className="h-6 w-6 text-smit-900" />
        <div>
          <h1 className="text-xl font-bold text-smit-900">Personal Account & Profile</h1>
          <p className="text-xs text-slate-500">Manage your profile details and security settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Card */}
        <Card className="lg:col-span-1">
          <CardBody className="text-center space-y-4">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-smit-900 text-white font-bold text-3xl shadow-lg border-2 border-smit-gold">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{user?.name}</h3>
              <p className="text-xs font-mono text-smit-gold font-bold">{user?.employeeId}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              <Badge variant={user?.roleName === 'SUPER_ADMIN' ? 'admin' : user?.roleName === 'HOD' ? 'hod' : 'staff'}>
                {user?.roleLabel}
              </Badge>
            </div>
          </CardBody>
        </Card>

        {/* Profile Info Form & Password Change */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <span className="text-xs font-bold uppercase text-slate-700">Update Profile Details</span>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98400 00000"
                />
                <Input
                  label="Academic Qualification"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g. Ph.D, M.E. CSE"
                />
                <Input
                  label="Residential Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, State"
                />

                <div className="pt-2 flex justify-end">
                  <Button variant="gold" type="submit" isLoading={updatingProfile} icon={<Save className="h-4 w-4" />}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <span className="text-xs font-bold uppercase text-slate-700">Change Account Password</span>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <Input
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  helperText="Minimum 6 characters"
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <div className="pt-2 flex justify-end">
                  <Button variant="danger" type="submit" isLoading={changingPassword} icon={<KeyRound className="h-4 w-4" />}>
                    Update Password
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

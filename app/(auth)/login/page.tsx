'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('IT123@123');
  const [password, setPassword] = useState('!@#%5321');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Force password change modal state if user logs in for the first time
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      if (data.user?.mustChangePassword) {
        setShowPasswordChangeModal(true);
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError('An unexpected network error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || 'Failed to update password.');
        setChangingPassword(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setPasswordError('Failed to change password. Please try again.');
      setChangingPassword(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between text-slate-100 overflow-hidden font-sans">
      {/* Real Campus Building Background Photo with Dark Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0 scale-105 transform transition-transform duration-1000"
        style={{ backgroundImage: "url('/smit-building.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#4a0e17]/90 via-[#701111]/85 to-black/90 z-0 backdrop-blur-[2px]" />

      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-red-600/20 blur-3xl pointer-events-none" />

      {/* Top Banner Header */}
      <header className="z-10 border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1 shadow-lg ring-2 ring-amber-400/40">
              <img
                src="/smit-logo.png"
                alt="SMIT Logo"
                className="max-h-9 max-w-9 object-contain"
              />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-wide">
                Sri Muthukumaran Institute of Technology
              </h1>
              <p className="text-xs text-amber-200/90 font-medium">
                Approved by AICTE, Affiliated to Anna University, Chennai • Since 1996
              </p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <span className="inline-flex items-center rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-500/30">
              Official Staff ERP Portal
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6">
          {/* Card Container */}
          <div className="rounded-3xl border border-white/20 bg-slate-950/85 p-8 shadow-2xl backdrop-blur-2xl">
            {/* Header Text & Prominent Logo */}
            <div className="text-center mb-6">
              <div className="inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-white p-2 shadow-xl ring-4 ring-amber-400/50 mb-3 transform transition-transform hover:scale-105">
                <img
                  src="/smit-logo.png"
                  alt="Sri Muthukumaran Institute of Technology Logo"
                  className="max-h-20 max-w-20 object-contain"
                />
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Admin & Staff Portal Sign In</h2>
              <p className="mt-1 text-xs text-slate-300">
                Enter your SMIT Employee ID or Email to access your portal
              </p>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/20 p-3.5 text-xs text-red-200 animate-fadeIn">
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email or Employee ID
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. IT123@123"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-400 transition-colors focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-400 transition-colors focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="gold"
                size="lg"
                isLoading={loading}
                className="w-full font-bold shadow-xl mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 border border-amber-400/30"
                icon={<ArrowRight className="h-4 w-4" />}
              >
                Sign In to ERP Portal
              </Button>
            </form>

            {/* Demo Credentials Box */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-2 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5" />
                Admin Credentials (Configured):
              </p>
              <div className="space-y-1.5 text-[11px] text-slate-300 font-mono">
                <div className="flex justify-between border-b border-white/10 pb-1 bg-amber-500/10 p-1.5 rounded text-amber-200">
                  <span className="font-bold">Super Admin:</span>
                  <span className="font-extrabold text-white">IT123@123 / !@#%5321</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1">
                  <span className="text-slate-400">HOD (CSE):</span>
                  <span className="text-white font-bold">hod.cse@smit.edu.in / Staff@123456</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Staff Faculty:</span>
                  <span className="text-white font-bold">suresh.n@smit.edu.in / Staff@123456</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Force Password Change Modal */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl text-slate-100 animate-fadeIn">
            <div className="flex items-center gap-3 mb-4 text-amber-400">
              <KeyRound className="h-6 w-6" />
              <h3 className="text-lg font-bold text-white">First Login: Change Password</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              For security compliance, set a new strong password for your SMIT account before proceeding.
            </p>

            {passwordError && (
              <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500/30 p-3 text-xs text-red-300">
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                />
              </div>

              <Button
                type="submit"
                variant="gold"
                isLoading={changingPassword}
                className="w-full font-bold mt-2"
              >
                Update Password & Login
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="z-10 border-t border-white/10 py-4 text-center text-xs text-slate-300 bg-black/40 backdrop-blur-md">
        © {new Date().getFullYear()} Sri Muthukumaran Institute of Technology • All Rights Reserved.
      </footer>
    </div>
  );
}

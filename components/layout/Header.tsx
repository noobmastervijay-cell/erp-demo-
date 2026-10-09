'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User as UserIcon, Menu, Bell, Shield, ChevronDown, Megaphone, Sparkles, ExternalLink } from 'lucide-react';
import { AuthenticatedUser } from '@/lib/permissions';
import { SMIT_THEME } from '@/lib/theme-config';
import { Badge } from '@/components/ui/Badge';

interface HeaderProps {
  user: AuthenticatedUser;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onToggleSidebar }) => {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // Quick fetch for notifications preview
    fetch('/api/announcements')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.announcements)) {
          setAnnouncements(data.announcements.slice(0, 4));
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout failed:', e);
      setLoggingOut(false);
    }
  };

  const getRoleBadgeVariant = (roleName: string) => {
    if (roleName === 'SUPER_ADMIN') return 'admin';
    if (roleName === 'HOD') return 'hod';
    return 'staff';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md lg:px-6 shadow-xs">
      {/* Left: Mobile Menu button & College Header info with Official Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none lg:hidden transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-0.5 border border-slate-200 shadow-xs">
            <img
              src="/smit-logo.png"
              alt="SMIT Logo"
              className="max-h-9 max-w-9 object-contain"
            />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-smit-900 leading-tight hidden sm:block">
              {SMIT_THEME.collegeName}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              College Staff ERP Portal • <span className="text-smit-gold font-bold">{SMIT_THEME.academicYear}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Right: Notifications & User Profile Menu */}
      <div className="flex items-center gap-3">
        {/* Animated Announcements Bell */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setNotifOpen(!notifOpen);
              setDropdownOpen(false);
            }}
            className="relative rounded-lg p-2 text-slate-600 hover:bg-amber-50 hover:text-amber-800 transition-colors focus:outline-none"
            title="Campus Bulletins & Announcements"
          >
            <Bell className="h-5 w-5 text-amber-600" />
            {announcements.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 ring-2 ring-white"></span>
              </span>
            )}
          </motion.button>

          {/* Announcement Popover */}
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white py-3 shadow-2xl z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-amber-600" />
                    <h3 className="text-xs font-bold text-slate-900">Campus Circulars</h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {announcements.length} Recent
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {announcements.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No active announcements.
                    </div>
                  ) : (
                    announcements.map((item) => (
                      <div key={item.id} className="p-3 hover:bg-amber-50/50 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.title}</h4>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                              item.priority === 'URGENT'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : item.priority === 'HIGH'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {item.content}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Target: {item.targetAudience}</span>
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                  <Link
                    href="/announcements"
                    onClick={() => setNotifOpen(false)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-smit-900 hover:text-amber-700 transition-colors"
                  >
                    <span>View All Announcements & Bulletins</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Account Dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2.5 rounded-lg p-1.5 text-left hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-smit-900 text-white font-bold text-xs border border-smit-800 shadow-xs">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">{user.name}</span>
                <Badge variant={getRoleBadgeVariant(user.roleName)}>
                  {user.roleLabel || user.roleName}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500">{user.email}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
          </motion.button>

          {/* Animated Dropdown Menu */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 bg-white py-1.5 shadow-2xl z-50"
              >
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-900">{user.name}</p>
                  <p className="text-[11px] text-slate-500">{user.employeeId}</p>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-700 font-bold">
                    <Sparkles className="h-3 w-3" />
                    <span>{user.roleLabel || user.roleName}</span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                  >
                    <UserIcon className="h-4 w-4 text-slate-500" />
                    My Profile & Account
                  </Link>

                  <Link
                    href="/announcements"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                  >
                    <Megaphone className="h-4 w-4 text-slate-500" />
                    Campus Announcements
                  </Link>

                  {user.roleName === 'SUPER_ADMIN' && (
                    <Link
                      href="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                    >
                      <Shield className="h-4 w-4 text-slate-500" />
                      Admin System Settings
                    </Link>
                  )}
                </div>

                <div className="border-t border-slate-100 my-1"></div>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4 text-red-600" />
                  {loggingOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

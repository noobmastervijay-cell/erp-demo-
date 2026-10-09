'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Pin,
  Edit2,
  Trash2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Shield,
  Eye,
  X,
  Sparkles,
  Info,
  Calendar,
  Send,
} from 'lucide-react';
import { AuthenticatedUser } from '@/lib/permissions';

interface AnnouncementAuthor {
  id: string;
  name: string;
  email: string;
  role?: {
    label: string;
    name: string;
  };
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  targetAudience: 'ALL' | 'HOD' | 'STAFF';
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  author: AnnouncementAuthor;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('STAFF');
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ROLE' | 'URGENT'>('ALL');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [viewingItem, setViewingItem] = useState<Announcement | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'NORMAL' as 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW',
    targetAudience: 'ALL' as 'ALL' | 'HOD' | 'STAFF',
    status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT' | 'ARCHIVED',
    isPinned: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/announcements');
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements);
        setUserRole(data.userRole);
        setIsSuperAdmin(data.isSuperAdmin);
      }
    } catch (e) {
      console.error('Failed to fetch announcements:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      content: '',
      priority: 'NORMAL',
      targetAudience: 'ALL',
      status: 'PUBLISHED',
      isPinned: false,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Announcement) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      content: item.content,
      priority: item.priority,
      targetAudience: item.targetAudience,
      status: item.status,
      isPinned: item.isPinned,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const url = editingItem ? `/api/announcements/${editingItem.id}` : '/api/announcements';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save announcement.');
      }

      setSuccessMsg(editingItem ? 'Announcement updated successfully!' : 'Announcement published successfully!');
      setIsModalOpen(false);
      fetchAnnouncements();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete announcement.');
      }
      setDeletingId(null);
      setSuccessMsg('Announcement deleted successfully.');
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Delete failed.');
    }
  };

  // Filtered List
  const filteredAnnouncements = announcements.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'URGENT') {
      return item.priority === 'URGENT' || item.priority === 'HIGH';
    }

    if (activeTab === 'ROLE') {
      return item.targetAudience === userRole || item.targetAudience === 'ALL';
    }

    return true;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200 flex items-center gap-1 animate-pulse">
            <AlertTriangle className="h-3 w-3" />
            Urgent
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            High Priority
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
            Notice
          </span>
        );
      case 'NORMAL':
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
            Standard
          </span>
        );
    }
  };

  const getTargetBadge = (target: string) => {
    switch (target) {
      case 'HOD':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
            HODs Only
          </span>
        );
      case 'STAFF':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            Faculty Staff Only
          </span>
        );
      case 'ALL':
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            All Institution Staff
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-smit-900 via-smit-800 to-amber-950 p-6 text-white shadow-xl border border-amber-500/20"
      >
        <div className="absolute right-0 top-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-smit-900 text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                Official Bulletins
              </span>
              {isSuperAdmin ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1 border border-emerald-400/30">
                  <Shield className="h-3 w-3" />
                  Super Admin Admin Console
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-amber-200 text-[10px] font-bold flex items-center gap-1 border border-white/10">
                  <Lock className="h-3 w-3 text-amber-400" />
                  View-Only Mode ({userRole})
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Campus Announcements & Notices
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-200 max-w-2xl">
              Official circulars, urgent institution alerts, and targeted departmental communications from the Principal&apos;s Office.
            </p>
          </div>

          {/* Super Admin Action Button */}
          {isSuperAdmin && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-3 text-xs font-extrabold text-smit-950 shadow-lg hover:from-amber-300 hover:to-amber-400 transition-all border border-amber-200/50 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Create Announcement</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Access Privilege Notice for Non-Admins */}
      {!isSuperAdmin && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-amber-900 flex items-start gap-3 shadow-xs"
        >
          <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">Role-Restricted Module Access</p>
            <p className="text-amber-800 leading-relaxed mt-0.5">
              Only Super Administrators (Principal) hold privileges to draft, publish, edit, or remove announcements. As a{' '}
              <strong className="font-bold underline">{userRole === 'HOD' ? 'Head of Department (HOD)' : 'Faculty Staff Member'}</strong>,
              you have view-only access to circulars targeted to your role or the entire institution.
            </p>
          </div>
        </motion.div>
      )}

      {/* Success Notification Alert */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 flex items-center justify-between text-xs font-bold"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ALL'
                ? 'bg-white text-smit-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Circulars ({announcements.length})
          </button>
          <button
            onClick={() => setActiveTab('ROLE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ROLE'
                ? 'bg-white text-smit-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            For {userRole === 'HOD' ? 'HODs' : 'Staff'}
          </button>
          <button
            onClick={() => setActiveTab('URGENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'URGENT'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Urgent & High
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search circulars by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Announcements Stream List */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-smit-900 border-t-transparent" />
          <p className="mt-3 text-xs font-medium text-slate-500">Loading campus announcements...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Megaphone className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-800">No Announcements Found</h3>
          <p className="mt-1 text-xs text-slate-500">
            No circulars match your current search query or active filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {filteredAnnouncements.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                whileHover={{ y: -2 }}
                className={`relative rounded-2xl bg-white p-5 border transition-all shadow-xs hover:shadow-md ${
                  item.isPinned
                    ? 'border-amber-300 ring-2 ring-amber-400/20 bg-gradient-to-r from-amber-50/30 to-white'
                    : 'border-slate-200'
                }`}
              >
                {/* Pinned Ribbon Badge */}
                {item.isPinned && (
                  <div className="absolute top-0 right-6 -translate-y-1/2 flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[9px] font-extrabold text-smit-950 uppercase tracking-wider shadow-sm">
                    <Pin className="h-3 w-3 fill-smit-950" />
                    <span>Pinned Announcement</span>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    {/* Badges & Meta */}
                    <div className="flex flex-wrap items-center gap-2">
                      {getPriorityBadge(item.priority)}
                      {getTargetBadge(item.targetAudience)}

                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(item.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Announcement Title */}
                    <h2 className="text-base font-bold text-slate-900 leading-snug hover:text-smit-900 transition-colors">
                      {item.title}
                    </h2>

                    {/* Content Snippet */}
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {item.content}
                    </p>

                    {/* Author Footnote */}
                    <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500 border-t border-slate-100">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-smit-900 text-white text-[9px] font-bold">
                        {item.author?.name ? item.author.name.charAt(0) : 'P'}
                      </div>
                      <span className="font-semibold text-slate-700">{item.author?.name || 'Principal'}</span>
                      <span>•</span>
                      <span className="text-slate-400">{item.author?.role?.label || 'Super Admin'}</span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                    <button
                      onClick={() => setViewingItem(item)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                      <span>Read Full Notice</span>
                    </button>

                    {/* Super Admin Control Buttons */}
                    {isSuperAdmin && (
                      <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="rounded-xl p-2 text-amber-700 hover:bg-amber-50 transition-colors"
                          title="Edit Announcement (Super Admin)"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(item.id)}
                          className="rounded-xl p-2 text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Announcement (Super Admin)"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Read Full Notice Modal */}
      <AnimatePresence>
        {viewingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(viewingItem.priority)}
                    {getTargetBadge(viewingItem.targetAudience)}
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900 mt-2">{viewingItem.title}</h2>
                </div>
                <button
                  onClick={() => setViewingItem(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap py-2 max-h-96 overflow-y-auto font-medium">
                {viewingItem.content}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-smit-900" />
                  <span>Author: {viewingItem.author?.name} ({viewingItem.author?.role?.label || 'Super Admin'})</span>
                </div>
                <span>Published: {new Date(viewingItem.createdAt).toLocaleString()}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal (Super Admin) */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-center space-y-4"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Delete Announcement?</h3>
                <p className="mt-1 text-xs text-slate-500">
                  This action cannot be undone. The circular will be permanently removed from all staff dashboards.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setDeletingId(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deletingId)}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-md"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create / Edit Modal (Super Admin Exclusive) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 my-8 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-smit-950 font-bold">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      {editingItem ? 'Edit Circular' : 'Create Campus Announcement'}
                    </h2>
                    <p className="text-[11px] text-slate-500">Super Admin Privilege Console</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Announcement Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. End-Semester Examination Schedule & Guidelines"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {/* Target Audience & Priority Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Target Audience <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.targetAudience}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          targetAudience: e.target.value as 'ALL' | 'HOD' | 'STAFF',
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
                    >
                      <option value="ALL">All Staff & HODs (Institution Wide)</option>
                      <option value="HOD">Heads of Department Only (HODs)</option>
                      <option value="STAFF">Faculty Staff Members Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Priority Level
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: e.target.value as 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW',
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
                    >
                      <option value="NORMAL">Normal Standard</option>
                      <option value="HIGH">High Priority</option>
                      <option value="URGENT">URGENT (Pulsing Red Alert)</option>
                      <option value="LOW">Low / Information</option>
                    </select>
                  </div>
                </div>

                {/* Content / Body */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Announcement Body / Circular Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Enter detailed notice content, dates, guidelines, or instructions..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {/* Checkboxes */}
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPinned}
                      onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>Pin to Top of Dashboard</span>
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-smit-900 to-smit-800 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:from-smit-800 hover:to-smit-900 transition-all disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5 text-amber-400" />
                    <span>{submitting ? 'Publishing...' : editingItem ? 'Update Circular' : 'Publish Circular'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

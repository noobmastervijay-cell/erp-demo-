'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  FolderOpen,
  FileText,
  FileSpreadsheet,
  FileCode,
  Upload,
  Search,
  Plus,
  Building,
  User,
  Calendar,
  Download,
} from 'lucide-react';

interface DocItem {
  id: string;
  title: string;
  description: string | null;
  fileType: 'WORD' | 'PDF' | 'SPREADSHEET' | string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  createdAt: string;
  department: { code: string; name: string };
  uploadedByUser: { name: string; role: { label: string } };
  student: { rollNumber: string; name: string } | null;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileType, setFileType] = useState('WORD');
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [search, activeFilter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const fileTypeParam = activeFilter !== 'ALL' ? activeFilter : '';
      const res = await fetch(
        `/api/documents?search=${encodeURIComponent(search)}&fileType=${fileTypeParam}`
      );
      const data = await res.json();
      if (data.data) {
        setDocuments(data.data);
      }
    } catch (e) {
      console.error('Error fetching documents:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          fileType,
          fileName: fileName || `${title.replace(/\s+/g, '_')}.${fileType === 'WORD' ? 'docx' : fileType === 'PDF' ? 'pdf' : 'xlsx'}`,
          fileSize: 1024 * 450,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
        setFileName('');
        fetchDocuments();
      } else {
        alert(data.error || 'Failed to upload document');
      }
    } catch (err) {
      alert('An error occurred while uploading document.');
    } finally {
      setSubmitting(false);
    }
  };

  const getFormatBadge = (type: string) => {
    switch (type) {
      case 'WORD':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
            <FileText className="h-3.5 w-3.5" /> Word Document (.docx)
          </span>
        );
      case 'PDF':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200">
            <FileCode className="h-3.5 w-3.5" /> PDF Marksheet (.pdf)
          </span>
        );
      case 'SPREADSHEET':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel Spreadsheet (.xlsx)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200">
            <FolderOpen className="h-3.5 w-3.5" /> Document File
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#701111] to-[#800000] p-6 rounded-2xl text-white shadow-xl">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-400/30 mb-2">
            <Upload className="h-3.5 w-3.5" />
            Teacher Uploads & HOD Document Control
          </span>
          <h1 className="text-2xl font-black tracking-tight">Student Reports & Uploads Hub</h1>
          <p className="text-xs text-amber-100/80 mt-1">
            Upload and manage Word documents, PDF marksheets, and Excel spreadsheets. Uploads are visible to department HOD & Principal.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-lg"
        >
          <Plus className="mr-2 h-4 w-4" /> Upload New Report / File
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Format Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'WORD', 'PDF', 'SPREADSHEET'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeFilter === tab
                    ? 'bg-[#701111] text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab === 'ALL'
                  ? '📁 All Files'
                  : tab === 'WORD'
                  ? '📄 Word (.docx)'
                  : tab === 'PDF'
                  ? '📕 PDF (.pdf)'
                  : '📊 Spreadsheets (.xlsx)'}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports or filenames..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#701111] focus:outline-none"
            />
          </div>
        </div>
      </Card>

      {/* Documents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center p-8 text-slate-500">
            Loading document repository...
          </div>
        ) : documents.length === 0 ? (
          <div className="col-span-2 text-center p-8 text-slate-500 bg-white rounded-2xl border">
            No uploaded reports found in your department scope.
          </div>
        ) : (
          documents.map((doc) => (
            <Card
              key={doc.id}
              className="p-5 space-y-3 hover:shadow-xl transition-all border-l-4 border-l-[#701111]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  {getFormatBadge(doc.fileType)}
                  <h3 className="text-sm font-extrabold text-slate-900 leading-snug pt-1">
                    {doc.title}
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-[#701111] border border-red-200 shrink-0">
                  <Building className="h-3 w-3" /> {doc.department.code}
                </span>
              </div>

              {doc.description && (
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {doc.description}
                </p>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-amber-600" />
                  <span className="font-semibold text-slate-700">{doc.uploadedByUser.name}</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {new Date(doc.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-mono text-slate-400 truncate max-w-[200px]">
                  {doc.fileName}
                </span>
                <a
                  href={doc.fileUrl}
                  download
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Simulated Download: Starting download of ${doc.fileName}`);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#701111] hover:text-amber-600 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" /> Download File
                </a>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Upload Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-extrabold text-[#701111] border-b pb-2 flex items-center gap-2">
              <Upload className="h-5 w-5 text-amber-600" />
              Upload Student Report / Document
            </h2>
            <form onSubmit={handleUploadDocument} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE V Sem Compiler Design Attendance & Marks Sheet"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#701111]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">File Format / Type *</label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-bold text-slate-800"
                >
                  <option value="WORD">📄 Word Document (.docx / .doc)</option>
                  <option value="PDF">📕 PDF Document (.pdf)</option>
                  <option value="SPREADSHEET">📊 Excel Spreadsheet (.xlsx / .csv)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">File Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Compiler_Design_Report_2026.docx"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of report contents for HOD review..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                💡 <strong>Branch Isolation Notice:</strong> Uploaded documents will be automatically assigned to your department scope and immediately accessible by your HOD & Principal.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
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
                  {submitting ? 'Uploading...' : 'Confirm Upload'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

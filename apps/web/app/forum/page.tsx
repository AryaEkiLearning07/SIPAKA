'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  ThumbsUp,
  Award,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Tag,
  ArrowRight,
  ShieldCheck,
  User,
  Scale,
  X,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface Thread {
  id: string;
  title: string;
  content: string;
  category: string;
  type: string;
  canonicalPath?: string;
  pasalLabel?: string;
  tags?: string;
  upvotesCount: number;
  commentsCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: string;
    institution?: string;
    reputationPoints: number;
    userBadges?: Array<{ badgeName: string; icon?: string }>;
  };
}

const CATEGORIES = [
  { id: 'SEMUA', label: 'Semua Kategori' },
  { id: 'ITE', label: 'Hukum Siber & ITE' },
  { id: 'PIDANA', label: 'Hukum Pidana & KUHP' },
  { id: 'PERDATA', label: 'Hukum Perdata & Kontrak' },
  { id: 'TATA_NEGARA', label: 'Tata Negara & MK' },
  { id: 'KETENAGAKERJAAN', label: 'Ketenagakerjaan' },
  { id: 'UMUM', label: 'Filsafat & Doktrin Umum' },
];

export default function ForumPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('SEMUA');
  const [sort, setSort] = useState<'latest' | 'top' | 'commented'>('latest');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'ITE',
    type: 'KASUS',
    pasalLabel: '',
    content: '',
    tags: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set('search', search);
      if (category && category !== 'SEMUA') q.set('category', category);
      q.set('sort', sort);

      const res = await fetch(`${API_BASE}/api/v1/forum/threads?${q.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setThreads(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load threads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchThreads, 200);
    return () => clearTimeout(timer);
  }, [search, category, sort]);

  const handleUpvote = async (threadId: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/v1/forum/threads/${threadId}/upvote`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        setThreads((prev) =>
          prev.map((t) => (t.id === threadId ? { ...t, upvotesCount: json.upvotesCount } : t))
        );
      }
    } catch (err) {
      console.error('Failed to upvote:', err);
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch(`${API_BASE}/api/v1/forum/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ title: '', category: 'ITE', type: 'KASUS', pasalLabel: '', content: '', tags: '' });
        fetchThreads();
      } else {
        setSubmitError(json.message || 'Gagal menerbitkan diskusi.');
      }
    } catch {
      setSubmitError('Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* ── Banner Atas ── */}
      <section className="bg-gradient-to-b from-[#861619] via-[#94191C] to-[#6A2225] text-white pt-10 pb-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-amber-300 text-xs font-mono font-bold tracking-wide mb-3">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>FORUM DISKUSI KASUS HUKUM &amp; PERADILAN SEMU</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-serif tracking-tight text-white">
              Dialektika &amp; Studi Kasus Yuridis
            </h1>
            <p className="text-white/80 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Ruang bedah kasus hukum, telaah pasal multitafsir, dan verifikasi argumen hukum perundang-undangan
              bersama sivitas akademika dan kurator hukum.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-102"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Mulai Diskusi Kasus</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-5xl mx-auto mt-8 relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari topik diskusi, nomor pasal, atau kasus posisi (contoh: Pasal 27A, pencemaran nama baik, lex favor reo)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white text-slate-900 pl-12 pr-4 py-3.5 rounded-2xl shadow-lg border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </section>

      {/* ── Filter Kategori & Sort ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-5">
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-[#94191C] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3 shrink-0 text-xs">
            <span className="text-slate-500 font-medium">Urutkan:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="bg-slate-100 font-semibold text-slate-800 rounded-lg px-2.5 py-1 border border-slate-200 focus:outline-none"
            >
              <option value="latest">Terbaru</option>
              <option value="top">Upvotes Terbanyak</option>
              <option value="commented">Paling Aktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Thread List ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
            <div className="w-8 h-8 border-4 border-[#94191C] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Memuat diskusi kasus...</p>
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Belum ada diskusi untuk kriteria ini</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Jadilah yang pertama membuka dialektika yuridis atas kasus ini!
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#94191C] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#861619]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Mulai Diskusi Baru</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <div
                key={thread.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-[#94191C]/40 p-5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 group"
              >
                <div className="flex-1">
                  {/* Meta User & Kategori */}
                  <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-[#94191C] border border-red-100">
                      {thread.category}
                    </span>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {thread.type}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {thread.user.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                      {thread.user.reputationPoints} Pts
                    </span>
                    {thread.user.role === 'DOSEN' && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Dosen Pengajar
                      </span>
                    )}
                  </div>

                  {/* Judul & Isi */}
                  <Link href={`/forum/${thread.id}`} className="block group-hover:text-[#94191C] transition-colors">
                    <h2 className="text-base sm:text-lg font-bold font-serif text-slate-900 leading-snug">
                      {thread.title}
                    </h2>
                  </Link>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
                    {thread.content}
                  </p>

                  {/* Rujukan Pasal Jika Ada */}
                  {thread.pasalLabel && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 text-xs font-serif italic border border-amber-200">
                      <Scale className="w-3 h-3 text-amber-700" />
                      <span>Rujukan: {thread.pasalLabel}</span>
                    </div>
                  )}
                </div>

                {/* Tombol Interaksi di Kanan */}
                <div className="flex sm:flex-col items-center justify-between sm:justify-start gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    onClick={(e) => handleUpvote(thread.id, e)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-[#94191C] text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                    title="Beri Upvote"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{thread.upvotesCount}</span>
                  </button>

                  <Link
                    href={`/forum/${thread.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    <span>{thread.commentsCount} Komentar</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Modal Buat Thread Baru ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#94191C] text-white flex items-center justify-center font-bold text-sm">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Mulai Diskusi Kasus Baru</h3>
                  <span className="text-[11px] text-emerald-600 font-semibold">+5 Poin Reputasi Akun</span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Diskusi Kasus</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kualifikasi Unsur Kesengajaan pada Pasal 27A UU ITE..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#94191C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Hukum</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#94191C]"
                  >
                    <option value="ITE">Hukum Siber &amp; ITE</option>
                    <option value="PIDANA">Hukum Pidana &amp; KUHP</option>
                    <option value="PERDATA">Hukum Perdata &amp; Bisnis</option>
                    <option value="TATA_NEGARA">Hukum Tata Negara &amp; MK</option>
                    <option value="KETENAGAKERJAAN">Ketenagakerjaan</option>
                    <option value="UMUM">Teori &amp; Doktrin Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Diskusi</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#94191C]"
                  >
                    <option value="KASUS">Studi Kasus Posisi</option>
                    <option value="TANYA_PASAL">Tanya Makna Pasal</option>
                    <option value="ANALISIS">Analisis Doktrin &amp; Asas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rujukan Pasal / Peraturan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pasal 27A UU 1/2024 atau Putusan MK No. 50/PUU-VI/2008"
                  value={formData.pasalLabel}
                  onChange={(e) => setFormData({ ...formData, pasalLabel: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#94191C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Duduk Perkara &amp; Pokok Masalah Hukum
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Uraikan fakta kasus, kronologi peristiwa, atau dalil pertentangan norma hukum yang ingin didiskusikan..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#94191C]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Menerbitkan...' : 'Terbitkan Diskusi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

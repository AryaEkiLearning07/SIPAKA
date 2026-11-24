'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderGit2,
  FileText,
  Plus,
  Search,
  Filter,
  Lock,
  Globe,
  Scale,
  Calendar,
  User,
  ArrowRight,
  X,
  Share2,
  Check,
} from 'lucide-react';
import { LatinTermBadge } from '@/app/components/LatinTermPopup';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface RepositoryEntry {
  id: string;
  title: string;
  category: string;
  caseFact?: string;
  legalAnalysis: string;
  attachedProvisions?: Array<{ canonicalPath?: string; label?: string }>;
  visibility: string;
  tags?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: string;
    institution?: string;
  };
}

const CATEGORIES = [
  { id: 'SEMUA', label: 'Semua Kategori' },
  { id: 'STUDI_KASUS', label: 'Studi Kasus Posisi' },
  { id: 'ANALISIS_DOKTRIN', label: 'Analisis Doktrin & Asas' },
  { id: 'MEMORANDUM_HUKUM', label: 'Legal Memorandum' },
  { id: 'TELAAH_AMANDEMEN', label: 'Telaah Amandemen' },
];

export default function RepositoriPage() {
  const [entries, setEntries] = useState<RepositoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('SEMUA');
  const [onlyMine, setOnlyMine] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<RepositoryEntry | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'STUDI_KASUS',
    caseFact: '',
    legalAnalysis: '',
    pasalLabel: '',
    canonicalPath: '',
    visibility: 'PUBLIK',
    tags: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set('search', search);
      if (category && category !== 'SEMUA') q.set('category', category);
      if (onlyMine) q.set('onlyMine', 'true');

      const res = await fetch(`${API_BASE}/api/v1/repository?${q.toString()}`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setEntries(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load repository:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchEntries, 200);
    return () => clearTimeout(timer);
  }, [search, category, onlyMine]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        title: formData.title,
        category: formData.category,
        caseFact: formData.caseFact,
        legalAnalysis: formData.legalAnalysis,
        visibility: formData.visibility,
        tags: formData.tags,
      };
      if (formData.pasalLabel) {
        payload.attachedProvisions = [{ label: formData.pasalLabel, canonicalPath: formData.canonicalPath }];
      }

      const res = await fetch(`${API_BASE}/api/v1/repository`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          title: '',
          category: 'STUDI_KASUS',
          caseFact: '',
          legalAnalysis: '',
          pasalLabel: '',
          canonicalPath: '',
          visibility: 'PUBLIK',
          tags: '',
        });
        fetchEntries();
      }
    } catch (err) {
      console.error('Failed to create entry:', err);
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
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>REPOSITORI DIGITAL RISET &amp; KASUS HUKUM</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-serif tracking-tight text-white">
              Repositori Studi Kasus Yuridis
            </h1>
            <p className="text-white/80 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Arsip terstruktur telaah fakta perkara, analisis doktrin perundang-undangan, dan memorandum hukum yang
              dihasilkan oleh mahasiswa, dosen, serta asisten riset AI.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-102"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tambah Entri Repositori</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-5xl mx-auto mt-8 relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari riset kasus, kata kunci analisis hukum, atau judul memorandum..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white text-slate-900 pl-12 pr-4 py-3.5 rounded-2xl shadow-lg border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </section>

      {/* ── Kategori & Filter Bar ── */}
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

          <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3 shrink-0">
            <button
              onClick={() => setOnlyMine(!onlyMine)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                onlyMine
                  ? 'bg-slate-900 text-white border-slate-800'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              Hanya Milik Saya
            </button>
          </div>
        </div>
      </div>

      {/* ── Daftar Entri Repositori ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
            <div className="w-8 h-8 border-4 border-[#94191C] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Memuat entri repositori...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <FolderGit2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Belum ada karya repositori</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Mulai arsipkan analisis hukum Anda atau simpan hasil penalaran asisten AI langsung ke repositori ini.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#94191C] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#861619]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Entri Pertama</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-[#94191C]/40 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-[#94191C] border border-red-100">
                      {entry.category.replace('_', ' ')}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                      {entry.visibility === 'PUBLIK' ? (
                        <>
                          <Globe className="w-3 h-3 text-emerald-600" />
                          <span>Publik</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>Privat</span>
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="text-base font-bold font-serif text-slate-900 group-hover:text-[#94191C] transition-colors leading-snug">
                    {entry.title}
                  </h3>

                  {entry.caseFact && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                      <strong className="text-slate-800">Kasus Posisi:</strong> {entry.caseFact}
                    </p>
                  )}

                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    <strong className="text-slate-800">Analisis:</strong> {entry.legalAnalysis}
                  </p>

                  <LatinTermBadge text={entry.legalAnalysis} />

                  {/* Rujukan Pasal */}
                  {entry.attachedProvisions && Array.isArray(entry.attachedProvisions) && entry.attachedProvisions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {entry.attachedProvisions.map((p, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200"
                        >
                          <Scale className="w-2.5 h-2.5 text-amber-700" />
                          {p.label || 'Rujukan Pasal'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-700">{entry.user.name}</span>
                  <span className="text-[#94191C] font-semibold flex items-center gap-1 group-hover:underline">
                    Lihat Analisis Lengkap &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Modal Detail Entri ── */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-red-50 text-[#94191C]">
                {selectedEntry.category.replace('_', ' ')}
              </span>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-xl font-bold font-serif text-slate-900 leading-snug">{selectedEntry.title}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 mb-5">
              <span>Penulis: <strong>{selectedEntry.user.name}</strong> ({selectedEntry.user.institution || 'Fakultas Hukum'})</span>
              <span>·</span>
              <span>{new Date(selectedEntry.createdAt).toLocaleDateString('id-ID')}</span>
            </div>

            {selectedEntry.caseFact && (
              <div className="mb-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-800">
                <strong className="block text-slate-900 font-bold mb-1">Duduk Perkara (Kasus Posisi):</strong>
                <p className="leading-relaxed whitespace-pre-line">{selectedEntry.caseFact}</p>
              </div>
            )}

            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line mb-4">
              <strong className="block text-slate-900 font-bold mb-1 text-sm">Telaah &amp; Analisis Hukum Yuridis:</strong>
              {selectedEntry.legalAnalysis}
            </div>

            <LatinTermBadge text={selectedEntry.legalAnalysis} />

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Tambah Entri ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#94191C] text-white flex items-center justify-center font-bold text-sm">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Tambah Entri Repositori Hukum</h3>
                  <span className="text-[11px] text-emerald-600 font-semibold">+5 Poin Reputasi Akun</span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Riset / Kasus</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Analisis Kepatuhan Transmisi Data Elektronik..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-[#94191C] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Riset</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#94191C] focus:outline-none"
                  >
                    <option value="STUDI_KASUS">Studi Kasus Posisi</option>
                    <option value="ANALISIS_DOKTRIN">Analisis Doktrin &amp; Asas</option>
                    <option value="MEMORANDUM_HUKUM">Legal Memorandum</option>
                    <option value="TELAAH_AMANDEMEN">Telaah Amandemen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Visibilitas</label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#94191C] focus:outline-none"
                  >
                    <option value="PUBLIK">Publik (Terbuka untuk Sivitas)</option>
                    <option value="PRIVAT">Privat (Hanya Saya)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rujukan Pasal Terkait (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pasal 27A UU ITE"
                  value={formData.pasalLabel}
                  onChange={(e) => setFormData({ ...formData, pasalLabel: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-[#94191C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Duduk Perkara / Fakta Kasus (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ringkasan fakta kronologis peristiwa hukum..."
                  value={formData.caseFact}
                  onChange={(e) => setFormData({ ...formData, caseFact: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-[#94191C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Analisis &amp; Pertimbangan Hukum Yuridis
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Uraikan subsumsi fakta ke dalam norma perundang-undangan, asas hukum yang berlaku, dan kesimpulan hukum..."
                  value={formData.legalAnalysis}
                  onChange={(e) => setFormData({ ...formData, legalAnalysis: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-[#94191C] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#94191C] hover:bg-[#861619] text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan ke Repositori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

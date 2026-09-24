'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, BookOpen, Filter, ArrowRight, Scale, Network,
  CheckCircle2, AlertTriangle, Layers, Calendar, FileText,
  RotateCcw, Sparkles
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface LawItem {
  id: string;
  slug: string;
  type: string;
  number: number;
  year: number;
  title: string;
  shortTitle?: string;
  status: string;
  promulgatedAt: string;
  description?: string;
  amendments: string[];
  totalArticles?: number;
}

const FALLBACK_CATALOG: LawItem[] = [
  {
    id: 'uu-11-2008',
    slug: 'ite',
    type: 'Undang-Undang',
    number: 11,
    year: 2008,
    title: 'Informasi dan Transaksi Elektronik',
    shortTitle: 'UU ITE',
    status: 'DIUBAH',
    promulgatedAt: '2008-04-21',
    description: 'Pondasi hukum siber nasional yang mengatur alat bukti elektronik, tanda tangan digital, penyelenggaraan transaksi daring, dan perbuatan yang dilarang di ruang digital.',
    amendments: ['UU No. 19 Tahun 2016', 'UU No. 1 Tahun 2024'],
    totalArticles: 54,
  },
  {
    id: 'uu-1-2024',
    slug: 'ite',
    type: 'Undang-Undang',
    number: 1,
    year: 2024,
    title: 'Perubahan Kedua Atas UU Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik',
    shortTitle: 'Amandemen II UU ITE',
    status: 'BERLAKU',
    promulgatedAt: '2024-01-02',
    description: 'Restrukturisasi pasal delik pencemaran nama baik, penyisipan Pasal 27A & 27B, pengetatan delik kerusuhan, dan kewajiban pelindungan anak di ruang siber.',
    amendments: [],
    totalArticles: 14,
  },
  {
    id: 'pp-71-2019',
    slug: 'ite',
    type: 'Peraturan Pemerintah',
    number: 71,
    year: 2019,
    title: 'Penyelenggaraan Sistem dan Transaksi Elektronik',
    shortTitle: 'PP PSTE',
    status: 'TERDAMPAK',
    promulgatedAt: '2019-10-10',
    description: 'Aturan turunan pelaksanaan UU ITE mengenai pendaftaran PSE, tata kelola data pribadi, dan moderasi konten.',
    amendments: [],
    totalArticles: 104,
  },
];

export default function KatalogJdihPage() {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('SEMUA');
  const [selectedStatus, setSelectedStatus] = useState<string>('SEMUA');
  const [laws, setLaws] = useState<LawItem[]>(FALLBACK_CATALOG);
  const [loading, setLoading] = useState(false);

  // Ambil data peraturan dari API Fastify
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/v1/instruments`);
        if (res.ok) {
          const json = await res.json();
          if (!cancelled && Array.isArray(json?.data) && json.data.length > 0) {
            setLaws(
              json.data.map((item: any) => ({
                id: `${item.type}-${item.number}-${item.year}`,
                slug: item.slug || 'ite',
                type: item.type === 'UU' ? 'Undang-Undang' : item.type,
                number: item.number,
                year: item.year,
                title: item.title,
                shortTitle: item.shortTitle || `${item.type} ${item.number}/${item.year}`,
                status: item.status,
                promulgatedAt: item.promulgatedAt,
                description: item.description,
                amendments: item.amendingInstruments || [],
                totalArticles: 54,
              }))
            );
          }
        }
      } catch {
        /* gunakan fallback catalog */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter logika
  const filteredLaws = useMemo(() => {
    const q = query.trim().toLowerCase();
    return laws.filter((item) => {
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.shortTitle && item.shortTitle.toLowerCase().includes(q)) ||
        `${item.number}`.includes(q) ||
        `${item.year}`.includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));

      const matchType =
        selectedType === 'SEMUA' ||
        item.type.toLowerCase().includes(selectedType.toLowerCase());

      const matchStatus =
        selectedStatus === 'SEMUA' ||
        item.status.toUpperCase() === selectedStatus.toUpperCase();

      return matchQuery && matchType && matchStatus;
    });
  }, [laws, query, selectedType, selectedStatus]);

  const quickKeywords = ['UU ITE', 'Pencemaran Nama Baik', 'Sistem Elektronik', 'Alat Bukti', 'Pasal 27'];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      {/* ── Top Header Modern ─────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#94191C] flex items-center justify-center text-white font-bold text-sm shadow-xs">
                S
              </div>
              <span className="font-sans font-bold text-lg text-slate-900 tracking-tight">
                SIPAKA<span className="text-[#94191C]">.</span>
              </span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-600 font-mono uppercase tracking-wide">
              Katalog Regulasi JDIH
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 hidden sm:inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Akses Terbuka Publik
            </span>
            <Link
              href="/masuk"
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              Masuk Kurator / Dosen
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Catalog Workspace ─────────────────────────────── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {/* Banner Pencarian Terpadu (ala JDIH Modern) */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden mb-8">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-semibold border border-indigo-400/30 mb-3">
              <Scale className="w-3.5 h-3.5" />
              Pusat Data Peraturan Terkonsolidasi
            </span>
            <h1 className="font-sans text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Cari &amp; Telusuri Peraturan Perundang-undangan
            </h1>
            <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
              Ketik judul undang-undang, nomor, tahun, atau kata kunci delik hukum untuk membuka naskah konsolidasi deterministik.
            </p>

            {/* Input Pencarian Besar */}
            <div className="mt-6 relative flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari misalnya: ITE, pencemaran nama baik, 11 2008, 1 2024…"
                className="w-full pl-12 pr-12 py-3.5 bg-white text-slate-900 placeholder:text-slate-400 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-400/30 shadow-lg"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-4 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-md"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Keyword Pills */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium">Kata Kunci Populer:</span>
              {quickKeywords.map((kw) => (
                <button
                  key={kw}
                  onClick={() => setQuery(kw)}
                  className="text-xs px-2.5 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-colors cursor-pointer"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Toolbar Filter & Indikator Hasil ──────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase font-mono mr-1">
              Filter Jenis:
            </span>
            {['SEMUA', 'Undang-Undang', 'Peraturan Pemerintah'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  selectedType === t
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span>Ditemukan: <strong className="text-slate-900 font-mono">{filteredLaws.length}</strong> Peraturan</span>
            {(query || selectedType !== 'SEMUA') && (
              <button
                onClick={() => {
                  setQuery('');
                  setSelectedType('SEMUA');
                  setSelectedStatus('SEMUA');
                }}
                className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* ── Daftar Hasil Peraturan (List of Laws) ─────────────── */}
        {filteredLaws.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-sans font-bold text-base text-slate-900">
              Tidak ada peraturan yang cocok dengan &quot;{query}&quot;
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Coba gunakan kata kunci nomor undang-undang atau topik hukum yang lebih umum.
            </p>
            <button
              onClick={() => { setQuery(''); setSelectedType('SEMUA'); }}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
            >
              Lihat Semua Peraturan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLaws.map((law) => {
              const isAmended = law.amendments && law.amendments.length > 0;
              return (
                <div
                  key={law.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {law.type} No. {law.number} Tahun {law.year}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                            law.status === 'BERLAKU'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : law.status === 'DIUBAH'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {law.status === 'DIUBAH' ? 'KONSOLIDASI AKTIF' : law.status}
                        </span>
                        {isAmended && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                            {law.amendments.length} Tahap Amandemen
                          </span>
                        )}
                      </div>

                      <h2 className="font-sans font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {law.title}
                      </h2>

                      {law.description && (
                        <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-2">
                          {law.description}
                        </p>
                      )}

                      {/* Silsilah Amandemen Badge */}
                      {isAmended && (
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] text-slate-400 font-medium">Silsilah Pengubah:</span>
                          {law.amendments.map((am, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {am}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Tombol Aksi Masuk Mode Baca */}
                    <div className="flex sm:flex-col items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <Link
                        href={`/uu/${law.slug}`}
                        className="w-full py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs group-hover:shadow-md group-hover:shadow-indigo-500/20"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Buka Mode Baca Asli</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      <Link
                        href={`/neuron?id=${law.slug}`}
                        className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Network className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Peta Silsilah Regulasi</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            SIPAKA · Sistem Informasi Pelacakan Amandemen, Kodifikasi, dan Advokasi
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-[#94191C]">Beranda</Link>
            <Link href="/tentang" className="hover:text-[#94191C]">Metodologi</Link>
            <Link href="/neuron" className="hover:text-[#94191C]">Peta Silsilah</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

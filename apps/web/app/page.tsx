'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, BookOpen, GitBranch, Network, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface LawCard {
  id: string;
  title: string;
  officialNumber: string;
  amendments: string[];
  lastAmended: string;
  status: string;
  category?: string;
  summary: string;
  slug: string;
}

/** Fallback saat API/database belum siap — demo tetap bisa dibuka. */
const FALLBACK_LAWS: LawCard[] = [
  {
    id: 'uu-ite',
    title: 'Undang-Undang Informasi dan Transaksi Elektronik',
    officialNumber: 'UU No. 11 Tahun 2008',
    amendments: ['UU No. 19 Tahun 2016', 'UU No. 1 Tahun 2024'],
    lastAmended: '2 Januari 2024',
    status: 'KONSOLIDASI AKTIF',
    category: 'Teknologi & Pidana Khusus',
    summary: 'Mengatur transaksi elektronik, tanda tangan digital, perbuatan yang dilarang, fitnah online, dan alat bukti elektronik.',
    slug: 'ite'
  },
  {
    id: 'kuhp-nasional',
    title: 'Kitab Undang-Undang Hukum Pidana (KUHP Nasional)',
    officialNumber: 'UU No. 1 Tahun 2023',
    amendments: [],
    lastAmended: '2 Januari 2023',
    status: 'MASA TRANSISI 3 TAHUN',
    category: 'Hukum Pidana Umum',
    summary: 'Menggantikan WvS kolonial Belanda, memuat living law, hukum adat, dan modernisasi pidana materiel.',
    slug: 'kuhp'
  }
];

const formatDateId = (iso: string): string => {
  try {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
  } catch {
    return iso;
  }
};

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [laws, setLaws] = useState<LawCard[]>(FALLBACK_LAWS);
  const [dataSource, setDataSource] = useState<'database' | 'demo'>('demo');

  // Daftar peraturan dari API/database — fallback ke data demo bila API belum siap
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/instruments`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled || !Array.isArray(json?.data) || json.data.length === 0) return;
        setLaws(json.data.map((inst: {
          slug: string | null;
          type: string;
          number: number;
          year: number;
          title: string;
          shortTitle?: string | null;
          description?: string | null;
          status: string;
          promulgatedAt: string;
          amendingInstruments: string[];
        }) => ({
          id: `${inst.type}-${inst.number}-${inst.year}`,
          title: inst.title,
          officialNumber: `${inst.type} No. ${inst.number} Tahun ${inst.year}`,
          amendments: inst.amendingInstruments ?? [],
          lastAmended: formatDateId(inst.promulgatedAt),
          status: inst.status === 'DIUBAH' ? 'KONSOLIDASI AKTIF' : inst.status,
          summary: inst.description || 'Naskah konsolidasi deterministik beserta silsilah amandemen.',
          slug: inst.slug ?? `uu-${inst.number}-${inst.year}`,
        })));
        setDataSource('database');
      } catch {
        // API belum siap — biarkan data demo
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = laws.filter(law =>
    law.title.toLowerCase().includes(query.toLowerCase()) ||
    law.officialNumber.toLowerCase().includes(query.toLowerCase()) ||
    law.summary.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              L
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">LexVera</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                Core Engine v0.1
              </span>
              <span className={`ml-1.5 inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded border ${
                dataSource === 'database'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${dataSource === 'database' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {dataSource === 'database' ? 'Database' : 'Data Demo'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/neuron"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
            >
              <Network className="w-4 h-4 text-indigo-500" />
              Peta Neuron Hukum
            </Link>
            <span className="text-xs font-medium text-slate-400">|</span>
            <span className="text-xs text-slate-500">Sivitas Akademika & Praktisi</span>
          </div>
        </div>
      </header>

      {/* Main Search Hero */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-16 pb-24 flex flex-col items-center">
        <div className="text-center max-w-2xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Naskah Terkonsolidasi Otentik & Deterministik
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
            Sistem Version Control Perundang-Undangan
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Temukan naskah undang-undang konsolidasi utuh beserta silsilah amandemen, perbandingan kata (diff), dan aturan pelaksana yang terdampak.
          </p>
        </div>

        {/* Search Engine Input */}
        <div className="w-full max-w-2xl relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base placeholder:text-slate-400 transition-all"
            placeholder="Ketik nomor UU, topik, atau pasal (contoh: UU ITE, pencemaran nama baik, KUHP)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 mb-12">
          <span>Kueri cepat:</span>
          {['UU ITE', 'Pasal 27 ayat 3', 'UU 1/2024', 'KUHP Nasional'].map((chip) => (
            <button
              key={chip}
              onClick={() => setQuery(chip === 'UU ITE' ? 'ITE' : chip)}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-all cursor-pointer shadow-2xs"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="w-full max-w-3xl space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            <span>Daftar Peraturan Tersedia</span>
            <span>{filtered.length} Peraturan Ditemukan</span>
          </div>

          {filtered.map((law) => (
            <div
              key={law.id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {law.officialNumber}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {law.status}
                    </span>
                    {law.category && <span className="text-xs text-slate-400">• {law.category}</span>}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {law.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                    {law.summary}
                  </p>
                </div>
              </div>

              {law.amendments.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="font-semibold flex items-center gap-1 text-slate-700">
                    <GitBranch className="w-3.5 h-3.5 text-indigo-500" />
                    Amandemen:
                  </span>
                  {law.amendments.map((am) => (
                    <span key={am} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {am}
                    </span>
                  ))}
                  <span className="text-slate-400 ml-auto flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Diperbarui {law.lastAmended}
                  </span>
                </div>
              )}

              <div className="mt-5 flex items-center justify-end gap-3 pt-2">
                <Link
                  href={`/neuron?id=${law.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Network className="w-3.5 h-3.5 text-indigo-500" />
                  Lihat Peta Silsilah
                </Link>
                <Link
                  href={`/uu/${law.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-xs transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Buka Ruang Kerja Naskah
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, BookOpen, Scale, Sparkles, Filter, Copy, Check, ArrowLeft } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface LatinTerm {
  id: string;
  term: string;
  literalTranslation: string;
  legalDefinition: string;
  contextExample?: string;
  category?: string;
}

const CATEGORIES = [
  { id: 'SEMUA', label: 'Semua Kategori' },
  { id: 'ASAS_HUKUM', label: 'Asas & Doktrin Fundamental' },
  { id: 'HUKUM_ACARA', label: 'Hukum Acara & Pembuktian' },
  { id: 'HUKUM_PIDANA', label: 'Hukum Pidana & Pemidanaan' },
  { id: 'HUKUM_PERDATA', label: 'Hukum Perdata & Kontrak' },
];

export default function GlosariumPage() {
  const [terms, setTerms] = useState<LatinTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('SEMUA');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTerms() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (selectedCategory && selectedCategory !== 'SEMUA') queryParams.set('category', selectedCategory);

        const res = await fetch(`${API_BASE}/api/v1/glossary?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setTerms(json.data || []);
        }
      } catch (err) {
        console.error('Failed to load glossary:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchTerms, 250);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  const copyToClipboard = (term: LatinTerm) => {
    const text = `"${term.term}" (${term.literalTranslation}): ${term.legalDefinition}`;
    navigator.clipboard.writeText(text);
    setCopiedId(term.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* ── Banner Atas ── */}
      <section className="bg-gradient-to-b from-[#861619] via-[#94191C] to-[#6A2225] text-white pt-10 pb-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-xs font-semibold mb-6 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-amber-300 text-xs font-mono font-bold tracking-wide mb-3">
                <BookOpen className="w-3.5 h-3.5" />
                <span>KAMUS DOKTRIN &amp; MAKSIMA YURIDIS</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black font-serif tracking-tight text-white">
                Glosarium Istilah Latin Hukum
              </h1>
              <p className="text-white/80 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
                Referensi komprehensif asas-asas hukum Romawi, maksima yuridis, doktrin perundang-undangan, dan
                penerapannya dalam peradilan serta peraturan perundang-undangan Indonesia.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center shrink-0">
              <span className="block text-3xl font-black text-amber-300 font-mono">
                {terms.length}
              </span>
              <span className="text-xs text-white/90 font-medium">Istilah Terkodifikasi</span>
            </div>
          </div>

          {/* Search Box */}
          <div className="mt-8 relative max-w-3xl">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari asas, maksima latin, atau kata kunci (contoh: lex specialis, ultimum remedium)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white text-slate-900 pl-12 pr-4 py-3.5 rounded-2xl shadow-lg border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Kategori Pills ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-5">
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-[#94191C] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Daftar Istilah ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
            <div className="w-8 h-8 border-4 border-[#94191C] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Memuat kamus istilah latin...</p>
          </div>
        ) : terms.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <Scale className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Tidak ada istilah latin yang cocok</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Coba gunakan kata kunci pencarian lain atau pilih kategori &quot;Semua Kategori&quot;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {terms.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-[#94191C]/40 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      {item.category?.replace('_', ' ') || 'ASAS HUKUM'}
                    </span>
                    <button
                      onClick={() => copyToClipboard(item)}
                      title="Salin sitasi istilah"
                      className="text-slate-400 hover:text-[#94191C] p-1 rounded-md hover:bg-slate-100 transition-colors"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <h2 className="text-lg font-serif font-black text-slate-900 group-hover:text-[#94191C] transition-colors italic">
                    {item.term}
                  </h2>
                  <p className="text-xs font-semibold text-slate-600 mt-1 mb-3">
                    Arti harfiah: <span className="font-normal text-slate-700 italic">&ldquo;{item.literalTranslation}&rdquo;</span>
                  </p>

                  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 leading-relaxed border border-slate-100">
                    <strong className="text-slate-900 block font-semibold mb-1">Makna Doktrin Yuridis:</strong>
                    {item.legalDefinition}
                  </div>

                  {item.contextExample && (
                    <div className="mt-3 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">Contoh Penerapan di RI:</span>{' '}
                      <span className="text-slate-600">{item.contextExample}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">Rujukan Standard LNRI</span>
                  <Link
                    href={`/katalog?q=${encodeURIComponent(item.term)}`}
                    className="text-[#94191C] font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <span>Cari UU Terkait</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

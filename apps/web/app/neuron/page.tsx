'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, GitGraph, Table2, Cpu, BookOpen, AlertTriangle, Loader2 } from 'lucide-react';
import MatriksHarmonisasi from './MatriksHarmonisasi';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface InstrumentNode {
  id: string;
  slug: string;
  type: string;
  number: number;
  year: number;
  title: string;
  shortTitle?: string;
  status: string;
  promulgatedAt: string;
  availableTimelines: { year: string }[];
  amendingInstruments: string[];
}

function SilsilahTreeLive({ instruments }: { instruments: InstrumentNode[] }) {
  if (instruments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Belum ada data silsilah di database.
      </div>
    );
  }

  // Pisahkan: induk (yang tidak mengubah siapa pun) vs amandemen
  const targetSlugs = new Set(instruments.map((i) => i.slug));
  const amenders = instruments.filter((i) => i.amendingInstruments.length > 0 || i.type === 'UU' && i.title.toLowerCase().includes('perubahan'));
  const roots = instruments.filter((i) => !i.title.toLowerCase().includes('perubahan'));

  return (
    <div className="space-y-6">
      {roots.map((root) => {
        const children = instruments.filter(
          (i) => i.amendingInstruments.includes(`UU No. ${root.number} Tahun ${root.year}`)
            || i.title.toLowerCase().includes(`${root.number} tahun ${root.year}`)
        );
        return (
          <div key={root.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Node Induk */}
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Induk: {root.type} No. {root.number} Tahun {root.year}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      root.status === 'BERLAKU' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : root.status === 'DIUBAH' ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {root.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{root.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tersedia: {root.availableTimelines.map((t) => t.year).join(', ')} · {root.availableTimelines.length} versi konsolidasi
                  </p>
                </div>
                <Link href={`/uu/${root.slug}`}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white text-xs font-bold transition-all">
                  <BookOpen className="w-3.5 h-3.5" />
                  Buka
                </Link>
              </div>
            </div>

            {/* Node Amandemen */}
            {root.amendingInstruments.length > 0 && (
              <div className="p-4 space-y-2 bg-slate-50/50">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Riwayat Amandemen:</p>
                {root.amendingInstruments.map((amender, idx) => (
                  <div key={idx} className="flex items-center gap-2 pl-4 text-xs text-slate-700">
                    <span className="w-0.5 h-4 bg-amber-400 rounded shrink-0" />
                    <span className="font-mono bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-amber-800 font-semibold">
                      {amender}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function LegalNeuronPage() {
  const [instruments, setInstruments] = useState<InstrumentNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiDown, setApiDown] = useState(false);
  const [activeTab, setActiveTab] = useState<'TREE' | 'MATRIX'>('TREE');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/instruments`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setInstruments(Array.isArray(json?.data) ? json.data : []);
          setApiDown(false);
        }
      } catch {
        if (!cancelled) setApiDown(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 font-sans text-slate-800">
      {/* Banner API down */}
      {apiDown && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-[11px] font-semibold px-4 py-2 text-center flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          API tidak terjangkau — pastikan server berjalan dan database sudah di-seed.
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Link href="/katalog"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
              title="Kembali ke Katalog">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-base text-slate-900 tracking-tight">
                  Peta Silsilah Regulasi &amp; Dampak Yuridis
                </span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-[#94191C] border border-indigo-200/60">
                  {isLoading ? '…' : `${instruments.length} instrumen`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemetaan hierarki norma berbasis Teori <em>Stufenbau</em> (Hans Kelsen) &amp; UU No. 12/2011
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button onClick={() => setActiveTab('TREE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'TREE' ? 'bg-white text-[#94191C] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
                <GitGraph className="w-3.5 h-3.5" />Pohon Silsilah
              </button>
              <button onClick={() => setActiveTab('MATRIX')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'MATRIX' ? 'bg-white text-[#94191C] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
                <Table2 className="w-3.5 h-3.5" />Matriks Harmonisasi
              </button>
            </div>
            <Link href="/pipeline"
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs">
              <Cpu className="w-3.5 h-3.5 text-[#94191C]" />Simulasi Pipeline
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Memuat data silsilah dari database…</span>
          </div>
        ) : activeTab === 'TREE' ? (
          <SilsilahTreeLive instruments={instruments} />
        ) : (
          <MatriksHarmonisasi />
        )}
      </main>
    </div>
  );
}

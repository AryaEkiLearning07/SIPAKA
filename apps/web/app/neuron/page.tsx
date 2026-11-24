'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, GitGraph, Table2, Cpu, BookOpen, AlertTriangle, Loader2, GitBranch } from 'lucide-react';
import MatriksHarmonisasi from './MatriksHarmonisasi';
import VisualLineageTree from '../components/VisualLineageTree';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

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

function NeuronContent() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get('id') || 'ite';

  const [instruments, setInstruments] = useState<InstrumentNode[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>(initialSlug);
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
          const list = Array.isArray(json?.data) ? json.data : [];
          setInstruments(list);
          setApiDown(false);
        }
      } catch {
        if (!cancelled) setApiDown(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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
            <Link
              href="/katalog"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
              title="Kembali ke Katalog"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-base text-slate-900 tracking-tight">
                  Peta Silsilah Regulasi &amp; Dampak Yuridis
                </span>
                <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Visual Tree Live
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemetaan visual hierarki norma berbasis Teori <em>Stufenbau</em> (Hans Kelsen) &amp; UU No. 12/2011
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('TREE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'TREE' ? 'bg-white text-[#94191C] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GitGraph className="w-3.5 h-3.5" />
                Pohon Silsilah Visual
              </button>
              <button
                onClick={() => setActiveTab('MATRIX')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'MATRIX' ? 'bg-white text-[#94191C] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
                Matriks Harmonisasi
              </button>
            </div>
            <Link
              href="/admin?tab=PIPELINE"
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Cpu className="w-3.5 h-3.5 text-[#94191C]" />
              Pabrik Pipeline
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        {/* Dynamic Contextual Guide Banner */}
        {activeTab === 'TREE' ? (
          <div className="bg-gradient-to-r from-red-50/80 via-white to-slate-50 border border-red-100/80 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider text-[#94191C] bg-red-100/70 px-2 py-0.5 rounded">
                    Visualisasi Silsilah &amp; Pohon Amandemen
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Teori Jenjang Norma (Stufenbau)</span>
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Pelacakan Garis Keturunan Hukum &amp; Putusan MK
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Peta Silsilah memvisualisasikan <strong>garis keturunan hukum</strong> dari undang-undang pokok hingga
                  setiap rangkaian perubahannya (Amandemen I, II, dst.) serta keterkaitannya dengan amar putusan Mahkamah
                  Konstitusi.
                </p>
              </div>

              {/* Selector Undang-Undang */}
              <div className="shrink-0 flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs text-xs">
                <span className="text-slate-500 font-semibold">Pilih Keluarga UU:</span>
                <select
                  value={selectedSlug}
                  onChange={(e) => setSelectedSlug(e.target.value)}
                  className="font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="ite">UU ITE (11/2008 &rarr; 19/2016 &rarr; 1/2024)</option>
                  <option value="uu-1-2023">KUHP Nasional (UU 1/2023)</option>
                  <option value="uu-27-2022">UU Perlindungan Data Pribadi (27/2022)</option>
                  <option value="uu-8-1999">UU Perlindungan Konsumen (8/1999)</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 border border-indigo-100/80 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded">
                    Audit Harmonisasi Regulasi
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Sinkronisasi Vertikal &amp; Horizontal</span>
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Deteksi Benturan Aturan (Disharmoni Norma)
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mengaudit pasal-pasal rawan pasca-amandemen agar praktisi hukum dan pembentuk kebijakan terhindar dari
                  penerapan peraturan turunan yang telah kedaluwarsa atau bertentangan dengan norma induk yang baru.
                </p>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Memuat data silsilah dari database…</span>
          </div>
        ) : activeTab === 'TREE' ? (
          <VisualLineageTree slug={selectedSlug} />
        ) : (
          <MatriksHarmonisasi />
        )}
      </main>
    </div>
  );
}

export default function LegalNeuronPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs">
          Memuat visualisasi silsilah...
        </div>
      }
    >
      <NeuronContent />
    </Suspense>
  );
}

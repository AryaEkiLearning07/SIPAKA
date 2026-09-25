'use client';
import React from 'react';
import { Scale, ChevronRight, BookOpen, ExternalLink, ShieldAlert, FileText, GitBranch, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { LegalNode, NODES_DATA } from './neuron-data';
interface SilsilahTreeProps {
  selectedNode: LegalNode;
  setSelectedNode: (n: LegalNode) => void;
}
/** Tab Pohon Silsilah: grid kolom kiri (hierarki Stufenbau) + kolom kanan (detail dampak). */
export default function SilsilahTree({ selectedNode, setSelectedNode }: SilsilahTreeProps) {
  return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Kolom Kiri: Pohon Hierarki Terstruktur (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Info Bar */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                <Scale className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-slate-700">
                  <span className="font-bold text-slate-900">Prinsip Hirarki Peraturan Perundang-undangan:</span> Aturan pada tingkat lebih rendah (PP dan Permen) tidak boleh bertentangan dengan norma induknya (UU). Klik kartu regulasi di bawah untuk menginspeksi dampak perubahan terhadap pasal terkait.
                </div>
              </div>
              {/* Tingkat I: Putusan Mahkamah Konstitusi */}
              <div className="relative">
                <div className="text-2xs font-mono font-bold uppercase tracking-wider text-rose-700 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Tingkat I · Uji Materiil Mahkamah Konstitusi
                </div>
                <div
                  onClick={() => setSelectedNode(NODES_DATA[0])}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedNode.id === NODES_DATA[0].id
                      ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                        {NODES_DATA[0].statusLabel}
                      </span>
                      <h3 className="font-sans font-bold text-sm text-slate-900 mt-1.5">
                        {NODES_DATA[0].label}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {NODES_DATA[0].title}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                  </div>
                </div>
                {/* Connector Line ke UU */}
                <div className="w-0.5 h-6 bg-slate-300 mx-auto my-2" />
              </div>
              {/* Tingkat II: Rantai Undang-Undang Pokok & Amandemen */}
              <div className="relative bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                <div className="text-2xs font-mono font-bold uppercase tracking-wider text-[#94191C] mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  Tingkat II · Garis Silsilah Amandemen Undang-Undang
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* UU 11/2008 Pokok */}
                  <div
                    onClick={() => setSelectedNode(NODES_DATA[1])}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedNode.id === NODES_DATA[1].id
                        ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        Naskah Pokok
                      </span>
                      <h4 className="font-sans font-bold text-xs text-slate-900 mt-2">
                        UU 11/2008
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        UU Pokok ITE
                      </p>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-semibold mt-3 block">
                      Tahun 2008
                    </span>
                  </div>
                  {/* UU 19/2016 Amandemen I */}
                  <div
                    onClick={() => setSelectedNode(NODES_DATA[2])}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedNode.id === NODES_DATA[2].id
                        ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-[#94191C]">
                        Amandemen I
                      </span>
                      <h4 className="font-sans font-bold text-xs text-slate-900 mt-2">
                        UU 19/2016
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Penurunan Pidana Delik
                      </p>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-semibold mt-3 block">
                      Tahun 2016
                    </span>
                  </div>
                  {/* UU 1/2024 Amandemen II */}
                  <div
                    onClick={() => setSelectedNode(NODES_DATA[3])}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedNode.id === NODES_DATA[3].id
                        ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                        Amandemen II (Positif)
                      </span>
                      <h4 className="font-sans font-bold text-xs text-slate-900 mt-2">
                        UU 1/2024
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Restrukturisasi Delik
                      </p>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold mt-3 block">
                      Tahun 2024
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Alur Silsilah: 2008 ➔ 2016 ➔ 2024</span>
                  <Link href="/uu/ite" className="text-indigo-600 font-semibold hover:underline">
                    Lihat Naskah Konsolidasi →
                  </Link>
                </div>
              </div>
              {/* Connector Line ke PP */}
              <div className="w-0.5 h-6 bg-slate-300 mx-auto my-2" />
              {/* Tingkat III: Peraturan Pemerintah (PP) */}
              <div className="relative">
                <div className="text-2xs font-mono font-bold uppercase tracking-wider text-emerald-700 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Tingkat III · Peraturan Pelaksana (Peraturan Pemerintah)
                </div>
                <div
                  onClick={() => setSelectedNode(NODES_DATA[4])}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedNode.id === NODES_DATA[4].id
                      ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          ⚠️ Terdampak Revisi UU 1/2024
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Tahun 2019</span>
                      </div>
                      <h3 className="font-sans font-bold text-sm text-slate-900 mt-1.5">
                        {NODES_DATA[4].label} (PSTE)
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {NODES_DATA[4].title}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                  </div>
                </div>
                {/* Connector Line ke Permen */}
                <div className="w-0.5 h-6 bg-slate-300 mx-auto my-2" />
              </div>
              {/* Tingkat IV: Peraturan Menteri (Permen) */}
              <div className="relative">
                <div className="text-2xs font-mono font-bold uppercase tracking-wider text-amber-700 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  Tingkat IV · Peraturan Pelaksana Teknis (Peraturan Menteri)
                </div>
                <div
                  onClick={() => setSelectedNode(NODES_DATA[5])}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedNode.id === NODES_DATA[5].id
                      ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          ⚠️ Terdampak Harmonisasi
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Tahun 2020</span>
                      </div>
                      <h3 className="font-sans font-bold text-sm text-slate-900 mt-1.5">
                        {NODES_DATA[5].label}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {NODES_DATA[5].title}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                  </div>
                </div>
              </div>
            </div>
            {/* Kolom Kanan: Panel Detail & Dampak Yuridis (5 cols) */}
            <div className="lg:col-span-5 lg:sticky lg:top-20">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-h-[calc(100vh-6rem)] overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-500 font-mono">
                      Analisis Yuridis Dokumen
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#94191C] bg-indigo-50 px-2 py-0.5 rounded">
                    {selectedNode.type}
                  </span>
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="font-sans font-bold text-lg text-slate-900">
                      {selectedNode.label}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedNode.title}
                    </p>
                  </div>
                  {/* Status Banner */}
                  <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                    selectedNode.status === 'TERDAMPAK'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : selectedNode.status === 'BATAL_BERSYARAT'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5 mb-1">
                      {selectedNode.status === 'TERDAMPAK' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                      {selectedNode.status === 'BATAL_BERSYARAT' && <ShieldAlert className="w-4 h-4 text-rose-600" />}
                      {selectedNode.status === 'STABIL' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      Status: {selectedNode.statusLabel}
                    </div>
                    {selectedNode.delegasiBasis && (
                      <div className="text-[11px] opacity-90 mt-1 font-mono">
                        Dasar Legalitas: {selectedNode.delegasiBasis}
                      </div>
                    )}
                  </div>
                  {/* Deskripsi */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block mb-1.5">
                      Ruang Lingkup &amp; Ratio Legis:
                    </span>
                    <p className="text-xs leading-relaxed text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {selectedNode.description}
                    </p>
                  </div>
                  {/* Rekomendasi Harmonisasi */}
                  {selectedNode.harmonisasiRekomendasi && (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 font-mono block mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Catatan Kesenjangan / Harmonisasi:
                      </span>
                      <p className="text-xs leading-relaxed text-slate-700 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/70">
                        {selectedNode.harmonisasiRekomendasi}
                      </p>
                    </div>
                  )}
                  {/* Action Link */}
                  <div className="pt-2">
                    <Link
                      href={selectedNode.linkSlug ? `/uu/${selectedNode.linkSlug}` : '/uu/ite'}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-[#94191C] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                    >
                      <BookOpen className="w-4 h-4" />
                      Buka Naskah Konsolidasi Terkait
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
  );
}
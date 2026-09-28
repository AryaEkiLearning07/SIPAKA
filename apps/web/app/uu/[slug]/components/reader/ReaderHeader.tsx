'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Network, Cpu, Download
} from 'lucide-react';
import { InstrumentMeta } from '../../reader-types';
import { timelineTitle, eventTimelineLabel } from '../../reader-utils';

interface ReaderHeaderProps {
  meta: InstrumentMeta | null;
  slug: string;
  currentUser: { name: string; role: string } | null;
  selectedTimeline: string | null;
  setSelectedTimeline: (year: string) => void;
  years: string[];
  showRiwayat: boolean;
  isCompareMode: boolean;
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  setFontSize: React.Dispatch<React.SetStateAction<'sm' | 'base' | 'lg' | 'xl'>>;
  fontType: 'serif' | 'sans';
  setFontType: React.Dispatch<React.SetStateAction<'serif' | 'sans'>>;
  showAnnotations: boolean;
  setShowAnnotations: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ReaderHeader(p: ReaderHeaderProps) {
  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-5 flex items-center justify-between z-20 shrink-0 shadow-2xs">
      <div className="flex items-center gap-3.5">
        <Link
          href="/katalog"
          title="Kembali ke Katalog JDIH"
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Katalog</span>
        </Link>
        <div>
          <h1 className="font-sans font-bold text-sm text-slate-900 leading-tight flex items-center gap-2">
            {p.meta ? `UU No. ${p.meta.number} Tahun ${p.meta.year}` : 'Memuat Peraturan…'}
            {p.meta?.shortTitle && (
              <span className="text-slate-500 font-normal">({p.meta.shortTitle})</span>
            )}
          </h1>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
            <span className={`inline-block w-2 h-2 rounded-full ${p.meta?.status === 'BERLAKU' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="font-medium text-slate-600">
              {p.selectedTimeline ? timelineTitle(p.meta, p.selectedTimeline) : 'Menghubungkan ke API…'}
            </span>
            {p.meta?.amendments && p.meta.amendments.length > 0 && (
              <span className="hidden xl:inline text-[11px] font-mono font-medium text-slate-400 border-l border-slate-200 pl-2">
                Telah diubah {p.meta.amendments.length} kali
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Timeline Switcher Titik Waktu Berbasis Peristiwa Regulasi */}
      {!p.showRiwayat && !p.isCompareMode && (
        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-medium">
          <span className="text-slate-500 px-2 text-[10px] font-mono font-bold tracking-wider uppercase">Titik Perubahan:</span>
          {p.years.map((year, idx) => {
            const isSelected = p.selectedTimeline === year;
            const btnLabel = eventTimelineLabel(p.meta, year, idx);
            return (
              <button
                key={year}
                onClick={() => p.setSelectedTimeline(year)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#94191C] text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title={`Beralih ke naskah hukum positif ${btnLabel}`}
              >
                {btnLabel}
              </button>
            );
          })}
        </div>
      )}

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* Format & Tipografi Naskah */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs">
          <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200 shadow-2xs">
            <button
              onClick={() => p.setFontSize((prev) => (prev === 'xl' ? 'lg' : prev === 'lg' ? 'base' : 'sm'))}
              disabled={p.fontSize === 'sm'}
              className="px-2 py-0.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 font-bold text-xs cursor-pointer"
              title="Perkecil Ukuran Huruf (A-)"
            >
              A-
            </button>
            <span className="text-[10px] font-mono font-bold px-1.5 text-slate-500 select-none">
              {p.fontSize === 'sm' ? '85%' : p.fontSize === 'base' ? '100%' : p.fontSize === 'lg' ? '115%' : '130%'}
            </span>
            <button
              onClick={() => p.setFontSize((prev) => (prev === 'sm' ? 'base' : prev === 'base' ? 'lg' : 'xl'))}
              disabled={p.fontSize === 'xl'}
              className="px-2 py-0.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 font-bold text-xs cursor-pointer"
              title="Perbesar Ukuran Huruf (A+)"
            >
              A+
            </button>
          </div>

          <button
            onClick={() => p.setFontType((prev) => (prev === 'serif' ? 'sans' : 'serif'))}
            className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors cursor-pointer shadow-2xs"
            title="Ganti Tipografi Serif / Sans"
          >
            {p.fontType === 'serif' ? 'Serif' : 'Sans'}
          </button>

          <button
            onClick={() => p.setShowAnnotations(!p.showAnnotations)}
            className={`px-2 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer shadow-2xs ${
              p.showAnnotations
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle garis penanda perubahan"
          >
            {p.showAnnotations ? 'Anotasi ON' : 'Anotasi OFF'}
          </button>
        </div>

        {p.meta?.pdfUrl && (
          <a
            href={p.meta.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-100 text-[#94191C] text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Unduh berkas PDF resmi Lembaran Negara RI (sumber JDIH BPK)"
          >
            <Download className="w-3.5 h-3.5 text-[#94191C]" />
            <span className="hidden xl:inline">Unduh PDF LNRI</span>
          </a>
        )}

        <Link
          href="/pipeline"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs"
          title="Buka Simulasi Pipeline Ingestion & AST Parsing"
        >
          <Cpu className="w-3.5 h-3.5 text-[#94191C]" />
          <span className="hidden sm:inline">Pipeline ETL</span>
        </Link>

        <Link
          href={`/neuron?id=${p.slug}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 text-xs font-semibold transition-all shadow-xs"
        >
          <Network className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Peta Silsilah</span>
        </Link>

        {p.currentUser ? (
          <Link
            href="/masuk"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 text-[#94191C] font-semibold text-xs border border-red-200 hover:bg-red-100 transition-colors shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
            <span className="max-w-[100px] truncate">{p.currentUser.name}</span>
          </Link>
        ) : (
          <Link
            href="/masuk"
            className="px-3 py-1.5 rounded-xl bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold border border-slate-200 transition-colors shadow-2xs"
          >
            Masuk
          </Link>
        )}
      </div>
    </header>
  );
}

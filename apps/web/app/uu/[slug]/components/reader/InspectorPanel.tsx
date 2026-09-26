'use client';

import React from 'react';
import Link from 'next/link';
import {
  Scale, X, FileText, ExternalLink, ArrowRight, Printer
} from 'lucide-react';
import { InspectorState, InspectorTab } from '../../reader-types';
import InspectorTabs from './InspectorTabs';

interface InspectorPanelProps {
  inspectorNode: InspectorState;
  setInspectorNode: React.Dispatch<React.SetStateAction<InspectorState | null>>;
  setActiveNodePath: (path: string) => void;
  inspectorTab: InspectorTab;
  setInspectorTab: (t: InspectorTab) => void;
  handleOpenInspector: (node: import('@lexvera/types').ProvisionNode, parentLabel?: string) => void;
  scrollToNode: (path: string) => void;
  setSelectedImpact: (r: import('../../impact-data').ImpactedRegulation) => void;
  copiedCitation: boolean;
  salinSitasi: (node: { label: string }) => void;
  currentUser: { name: string; role: string } | null;
  setShowLoginPrompt: (v: boolean) => void;
  setShowAiModal: (v: boolean) => void;
}

export default function InspectorPanel(p: InspectorPanelProps) {
  const node = p.inspectorNode;
  const detail = node.amendmentDetail;

  return (
    <aside className="w-84 lg:w-96 bg-white border-l border-slate-200/80 flex flex-col shrink-0 z-10 overflow-hidden shadow-xl animate-in slide-in-from-right duration-200">
      {/* Header Atas Panel */}
      <div className="h-14 px-4 border-b border-slate-200/70 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#94191C]" />
          <span className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900">
            Inspeksi Amandemen Norma
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              p.setInspectorNode(null);
              p.setActiveNodePath('');
            }}
            className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1 transition-colors cursor-pointer"
            title="Tutup Panel Inspeksi"
          >
            <X className="w-3.5 h-3.5" />
            <span>Tutup</span>
          </button>
          <button
            onClick={() => window.print()}
            title="Cetak Naskah Dokumen"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Isi Panel Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* 1. KETERANGAN STATUS PERUBahan PALING ATAS */}
          <div className="space-y-2 pb-2 border-b border-slate-100">
            {detail?.statusPerubahan === 'SISIPAN_BARU' ? (
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-sm border border-emerald-500">
                <div className="flex items-center justify-between gap-1 text-[10px] font-mono tracking-wider uppercase font-bold text-emerald-100 mb-1">
                  <span>TINDAKAN HUKUM (UU 12/2011)</span>
                  <span className="bg-emerald-800/80 px-1.5 py-0.5 rounded border border-emerald-400/40">SISIPAN</span>
                </div>
                <h4 className="font-sans font-black text-sm tracking-wide flex items-center gap-1.5">
                  <span>🟢</span>
                  <span>DISISIPKAN (NORMA SISIPAN BARU)</span>
                </h4>
                <p className="text-[11px] text-emerald-50/90 leading-relaxed mt-1 font-medium">
                  Ketentuan norma baru yang disisipkan di antara pasal yang ada tanpa merombak nomor urut pasal lainnya.
                </p>
              </div>
            ) : detail?.statusPerubahan === 'DICABUT' ? (
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-rose-600 to-rose-700 text-white shadow-sm border border-rose-500">
                <div className="flex items-center justify-between gap-1 text-[10px] font-mono tracking-wider uppercase font-bold text-rose-100 mb-1">
                  <span>TINDAKAN HUKUM (UU 12/2011)</span>
                  <span className="bg-rose-800/80 px-1.5 py-0.5 rounded border border-rose-400/40">DICABUT</span>
                </div>
                <h4 className="font-sans font-black text-sm tracking-wide flex items-center gap-1.5">
                  <span>🔴</span>
                  <span>DIHAPUS / DICABUT DARI HUKUM POSITIF</span>
                </h4>
                <p className="text-[11px] text-rose-50/90 leading-relaxed mt-1 font-medium">
                  Ketentuan norma ditiadakan secara permanen dan tidak lagi memiliki daya laku atau kekuatan hukum mengikat.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm border border-amber-400">
                <div className="flex items-center justify-between gap-1 text-[10px] font-mono tracking-wider uppercase font-bold text-amber-100 mb-1">
                  <span>TINDAKAN HUKUM (UU 12/2011)</span>
                  <span className="bg-amber-700/80 px-1.5 py-0.5 rounded border border-amber-300/40">DIUBAH</span>
                </div>
                <h4 className="font-sans font-black text-sm tracking-wide flex items-center gap-1.5">
                  <span>🟡</span>
                  <span>DIUBAH (REDAKSI &amp; SUBSTANSI DIPERBARUI)</span>
                </h4>
                <p className="text-[11px] text-amber-50/90 leading-relaxed mt-1 font-medium">
                  Rumusan teks kalimat dan materi muatan norma diperbaiki, disesuaikan, atau digantikan dengan konstruksi hukum baru.
                </p>
              </div>
            )}

            {/* Anotasi Tambahan Mahkamah Konstitusi jika ada */}
            {detail?.putusanMk && (
              <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 flex items-start gap-2 shadow-2xs">
                <Scale className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div className="text-[11px]">
                  <span className="font-bold text-purple-900 block">Terikat Putusan Mahkamah Konstitusi:</span>
                  <span className="font-medium text-purple-800">{detail.putusanMk.nomor}</span>
                </div>
              </div>
            )}

            {/* Label Nama Pasal Aktif */}
            <div className="pt-1 flex items-baseline justify-between gap-2">
              <h3 className="font-sans font-extrabold text-lg text-slate-900 leading-snug">
                {node.label}
                {node.parentLabel && (
                  <span className="text-slate-400 text-xs font-normal ml-2">({node.parentLabel})</span>
                )}
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {node.canonicalPath}
              </span>
            </div>
          </div>

          {/* 2. KARTU ATURAN PENGUBAH DETAIL & BISA DIKLIK */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-[#94191C]" />
                <span>Instrumen Regulasi Pengubah:</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Hukum Positif Berlaku
              </span>
            </div>

            <div>
              <h5 className="font-sans font-extrabold text-xs text-slate-900 leading-snug">
                {detail?.diubahOleh ? detail.diubahOleh.split(' (')[0] : 'UU Pengubah'}
              </h5>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {detail?.diubahOleh?.includes('19')
                  ? 'Perubahan Pertama atas UU No. 11/2008 tentang Informasi dan Transaksi Elektronik'
                  : 'Perubahan atas UU pokok — identitas lengkap pada kartu di atas'}
              </p>
            </div>

            <div className="space-y-1 pt-1.5 border-t border-slate-200/70 text-[11px]">
              <div className="flex items-start gap-1.5 text-slate-600">
                <span className="text-slate-400 shrink-0 min-w-[75px]">Dasar Pasal:</span>
                <span className="text-slate-900 font-semibold">
                  {(() => {
                    const o = detail?.diubahOleh ?? '';
                    const m = o.match(/Pasal\s+[IVX]+(\s+angka\s+\d+[a-z]?)?/i);
                    return m ? m[0] : 'Lihat naskah pengubah';
                  })()}
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-slate-600">
                <span className="text-slate-400 shrink-0 min-w-[75px]">Pengesahan:</span>
                <span className="text-slate-800 font-medium">
                  {detail?.tanggalPengundangan || '2 Januari 2024'}
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-slate-600">
                <span className="text-slate-400 shrink-0 min-w-[75px]">Pengesah:</span>
                <span className="text-slate-800 font-medium">
                  {detail?.disahkanOleh || 'Presiden RI Joko Widodo & Mensesneg Pratikno'}
                </span>
              </div>
              {detail?.lembaranNegara && (
                <div className="flex items-start gap-1.5 text-slate-600">
                  <span className="text-slate-400 shrink-0 min-w-[75px]">Publikasi:</span>
                  <span className="text-slate-800 font-mono text-[10px] leading-tight">
                    {detail.lembaranNegara}
                  </span>
                </div>
              )}
            </div>

            {/* Tombol Tautan Klikable ke Aturan Pengubah */}
            <Link
              href={`/uu/${detail?.diubahOleh?.includes('19') ? 'uu-19-2016' : 'uu-1-2024'}`}
              className="w-full py-2 px-3 rounded-lg bg-white border border-slate-200 hover:border-[#94191C] hover:bg-red-50/60 text-[#94191C] font-bold text-xs flex items-center justify-between transition-all group shadow-2xs mt-2 cursor-pointer"
              title="Buka naskah undang-undang pengubah di platform ini"
            >
              <span className="flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>Buka Naskah Lengkap Aturan Pengubah</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* 3. TAB SWITCHER SEGMENTED CONTROL */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => p.setInspectorTab('diff')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                p.inspectorTab === 'diff'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Komparasi Teks
            </button>
            <button
              onClick={() => p.setInspectorTab('affected_list')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                p.inspectorTab === 'affected_list'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Pasal Terdampak</span>
              <span className="w-4 h-4 rounded-full bg-red-100 text-[#94191C] text-[10px] flex items-center justify-center font-bold">
                {detail?.peraturanTerdampak ? detail.peraturanTerdampak.length + 4 : 4}
              </span>
            </button>
            <button
              onClick={() => p.setInspectorTab('impact')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                p.inspectorTab === 'impact'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Turunan</span>
              {detail?.peraturanTerdampak?.length ? (
                <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">
                  {detail.peraturanTerdampak.length}
                </span>
              ) : null}
            </button>
            {detail?.putusanMk && (
              <button
                onClick={() => p.setInspectorTab('mk')}
                className={`py-1.5 px-2.5 rounded-lg text-center transition-all cursor-pointer ${
                  p.inspectorTab === 'mk'
                    ? 'bg-white text-purple-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Putusan MK
              </button>
            )}
          </div>

          <p className="text-[10px] leading-relaxed text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
            Sumber data panel ini: <strong className="text-slate-700">Komparasi &amp; Riwayat</strong> dihitung dari database (operasi amandemen tersimpan); tab <strong className="text-slate-700">Pasal Terdampak / Turunan / Putusan MK</strong> saat ini masih data pilot keluarga UU ITE yang dikurasi manual.
          </p>

          {/* Isi Tab */}
          <InspectorTabs
            inspectorNode={node}
            inspectorTab={p.inspectorTab}
            setInspectorTab={p.setInspectorTab}
            handleOpenInspector={p.handleOpenInspector}
            scrollToNode={p.scrollToNode}
            setSelectedImpact={p.setSelectedImpact}
            copiedCitation={p.copiedCitation}
            salinSitasi={p.salinSitasi}
            currentUser={p.currentUser}
            setShowLoginPrompt={p.setShowLoginPrompt}
            setShowAiModal={p.setShowAiModal}
          />
        </div>
      </div>
    </aside>
  );
}

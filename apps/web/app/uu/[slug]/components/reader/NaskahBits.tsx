'use client';

import React from 'react';
import { History } from 'lucide-react';
import { ProvisionNode } from '@lexvera/types';
import { OpsRow } from '../../reader-types';
import { formatProvisionLabel, cleanLegalText, fontSizeClass } from '../../reader-utils';

/** Banner arsip versi lama (tampil saat user memilih "Lihat Naskah Sebelumnya"). */
export default function VersiLamaBanner({
  teksSebelum,
  fontSizeCls,
  onKembali,
}: {
  teksSebelum: string;
  fontSizeCls: string;
  onKembali: () => void;
}) {
  return (
    <div className="p-3 sm:p-3.5 rounded-xl bg-amber-100/70 border-2 border-dashed border-amber-400 text-amber-950 font-serif shadow-xs ring-1 ring-amber-300/80">
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-amber-300 text-[10.5px] font-mono font-bold text-amber-900">
        <span className="flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-amber-700" />
          <span>ARSIP MASA LALU (NASKAH ASLI UU 11/2008) — TIDAK BERLAKU</span>
        </span>
        <button
          onClick={onKembali}
          className="text-amber-800 hover:text-amber-950 font-sans font-bold underline cursor-pointer text-[10px]"
        >
          Tampilkan Naskah Berlaku Terkini →
        </button>
      </div>
      <p className={`text-slate-900 text-justify leading-relaxed italic ${fontSizeCls}`}>
        {cleanLegalText(teksSebelum || '(Naskah versi sebelumnya tidak tercatat)')}
      </p>
    </div>
  );
}


/** Satu baris ayat dengan penanda status & tombol arsip versi lama. */
export function AyatRow({
  ayat, pasalLabel, ops: opsPasal, showAnnotations, activeNodePath, provisionVersions, setProvisionVersions, fontSizeCls, fontFamilyCls, handleOpenInspector,
}: {
  ayat: ProvisionNode;
  pasalLabel: string;
  ops: OpsRow[];
  showAnnotations: boolean;
  activeNodePath: string;
  provisionVersions: Record<string, 'CURRENT' | 'PREVIOUS'>;
  setProvisionVersions: React.Dispatch<React.SetStateAction<Record<string, 'CURRENT' | 'PREVIOUS'>>>;
  fontSizeCls: string;
  fontFamilyCls: string;
  handleOpenInspector: (node: ProvisionNode, parentLabel?: string) => void;
}) {
  const op = opsPasal.find((o) => o.targetCanonicalPath === ayat.canonicalPath);
  const ayatIsNew = op?.operationType === 'ADD_PROVISION';
  const ayatIsAmended = op?.operationType === 'REPLACE_PROVISION' || op?.operationType === 'PARTIAL_REPEAL';
  const ayatIsRepealed = ayat.isRepealed || op?.operationType === 'REPEAL_PROVISION';
  const ayatHasMk = false; // anotasi putusan MK: belum ada data terdigitasi
  const isAyatActive = activeNodePath === ayat.canonicalPath;
  const hasAyatAmendment = Boolean(op);
  const isAyatPreviousSelected = provisionVersions[ayat.canonicalPath] === 'PREVIOUS';

  const ayatColorStyle = !showAnnotations
    ? ''
    : isAyatPreviousSelected
      ? 'bg-amber-50/90 border-l-4 border-amber-500'
      : ayatIsRepealed
        ? 'line-through text-rose-800 bg-rose-50/70 border-l-4 border-rose-500 font-medium'
        : ayatIsNew
          ? 'bg-emerald-50/70 border-l-4 border-emerald-500 font-medium text-slate-900'
          : ayatIsAmended
            ? 'bg-amber-50/70 border-l-4 border-amber-400 font-medium text-slate-900'
            : '';

  return (
    <div
      key={ayat.canonicalPath}
      id={`node-${ayat.canonicalPath}`}
      onClick={() => handleOpenInspector(ayat, pasalLabel)}
      className={`flex items-start gap-3 py-2 px-2.5 rounded-lg transition-colors cursor-pointer group ${ayatColorStyle} ${
        isAyatActive
          ? 'bg-red-50/90 text-slate-900 ring-2 ring-[#94191C]/80 font-medium shadow-2xs'
          : 'hover:bg-slate-100/70'
      }`}
    >
      <span className="font-mono font-bold text-slate-600 shrink-0 min-w-[36px] sm:min-w-[42px] text-right text-xs pt-1 select-none">
        {formatProvisionLabel(ayat.label)}
      </span>
      <div className="flex-1 min-w-0 space-y-1.5">
        {isAyatPreviousSelected ? (
          <VersiLamaBanner
            teksSebelum={op?.previousContent || ''}
            fontSizeCls={fontSizeCls}
            onKembali={() => setProvisionVersions((prev) => ({ ...prev, [ayat.canonicalPath]: 'CURRENT' }))}
          />
        ) : (
          <p className={`text-slate-800 text-justify ${fontSizeCls} ${fontFamilyCls}`}>
            {cleanLegalText(ayat.content)}
          </p>
        )}

        {/* Penanda status ayat & Tombol pemilih versi sebelumnya */}
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          {showAnnotations && ayatIsNew && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              🟢 Sisipan Baru
            </span>
          )}
          {showAnnotations && ayatIsAmended && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
              🟡 Redaksi Diubah
            </span>
          )}
          {showAnnotations && ayatIsRepealed && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
              🔴 Dicabut / Dihapus: {ayat.repealBasis || 'UU pengubah'}
            </span>
          )}
          {showAnnotations && ayatHasMk && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300">
              ⚖️ Terikat Putusan MK
            </span>
          )}

          {hasAyatAmendment && op?.previousContent && !isAyatPreviousSelected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setProvisionVersions((prev) => ({ ...prev, [ayat.canonicalPath]: 'PREVIOUS' }));
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-colors shadow-2xs cursor-pointer ml-auto"
              title="Bandingkan langsung: Klik untuk menampilkan teks naskah sebelum amandemen"
            >
              <History className="w-3 h-3 text-amber-700" />
              <span>Lihat Naskah Sebelumnya</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Pasal satu-paragraf (tanpa ayat) — sejajar dengan margin ayat. */
export function PasalParagraf({
  pasal, ops, activeNodePath, provisionVersions, setProvisionVersions, fontSizeCls, fontFamilyCls, handleOpenInspector,
}: {
  pasal: ProvisionNode;
  ops: OpsRow[];
  activeNodePath: string;
  provisionVersions: Record<string, 'CURRENT' | 'PREVIOUS'>;
  setProvisionVersions: React.Dispatch<React.SetStateAction<Record<string, 'CURRENT' | 'PREVIOUS'>>>;
  fontSizeCls: string;
  fontFamilyCls: string;
  handleOpenInspector: (node: ProvisionNode, parentLabel?: string) => void;
}) {
  const isPasalPreviousSelected = provisionVersions[pasal.canonicalPath] === 'PREVIOUS';
  const opLama = ops.find((o) => o.previousContent);
  const hasPasalAmendment = ops.length > 0;

  return (
    <div
      onClick={() => handleOpenInspector(pasal)}
      className={`flex items-start gap-3 py-2 px-2.5 rounded-lg transition-colors cursor-pointer ${
        activeNodePath === pasal.canonicalPath
          ? 'bg-red-50/90 text-slate-900 ring-2 ring-[#94191C]/80 font-medium shadow-2xs'
          : 'hover:bg-slate-100/70'
      }`}
    >
      <div className="min-w-[36px] sm:min-w-[42px] shrink-0 select-none text-right font-sans font-bold text-xs text-slate-400 pt-1">
        •
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        {isPasalPreviousSelected ? (
          <VersiLamaBanner
            teksSebelum={opLama?.previousContent || ''}
            fontSizeCls={fontSizeCls}
            onKembali={() => setProvisionVersions((prev) => ({ ...prev, [pasal.canonicalPath]: 'CURRENT' }))}
          />
        ) : (
          <p className={`flex-1 text-justify ${fontSizeCls} ${fontFamilyCls} text-slate-800`}>
            {cleanLegalText(pasal.content)}
          </p>
        )}

        {hasPasalAmendment && opLama?.previousContent && !isPasalPreviousSelected && (
          <div className="pt-1 flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setProvisionVersions((prev) => ({ ...prev, [pasal.canonicalPath]: 'PREVIOUS' }));
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-colors shadow-2xs cursor-pointer"
              title="Klik untuk melihat teks naskah sebelum amandemen"
            >
              <History className="w-3 h-3 text-amber-700" />
              <span>Lihat Naskah Sebelumnya</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

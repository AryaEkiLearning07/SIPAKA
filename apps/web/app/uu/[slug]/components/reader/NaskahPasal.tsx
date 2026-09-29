'use client';

import React from 'react';
import { ConsolidatedLawDocument, ProvisionNode } from '@sipaka/types';
import { OpsRow } from '../../reader-types';
import { fontSizeClass } from '../../reader-utils';
import { AyatRow, PasalParagraf } from './NaskahBits';

interface NaskahPasalProps {
  currentDoc: ConsolidatedLawDocument;
  showAnnotations: boolean;
  activeNodePath: string;
  operations: OpsRow[];
  selectedTimeline: string | null;
  baseYear?: number;
  provisionVersions: Record<string, 'CURRENT' | 'PREVIOUS'>;
  setProvisionVersions: React.Dispatch<React.SetStateAction<Record<string, 'CURRENT' | 'PREVIOUS'>>>;
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  fontType: 'serif' | 'sans';
  handleOpenInspector: (node: ProvisionNode, parentLabel?: string) => void;
}

/**
 * Filter operasi yang HANYA terjadi pada peristiwa regulasi yang sedang aktif dipilih.
 * Jika pengguna membuka naskah pokok awal (baseYear), tidak ada badge amandemen yang ditampilkan.
 */
function opsUntuk(ops: OpsRow[] | undefined, path: string, selectedTimeline: string | null, baseYear?: number): OpsRow[] {
  if (!ops || !selectedTimeline) return [];
  if (baseYear && String(baseYear) === selectedTimeline) return [];

  return ops.filter((o) => {
    const matchesPath = o.targetCanonicalPath === path || o.targetCanonicalPath.startsWith(path + '/');
    if (!matchesPath) return false;
    const opYear = o.amenderYear ? String(o.amenderYear) : String(new Date(o.effectiveFrom).getUTCFullYear());
    return opYear === selectedTimeline;
  });
}

/** Ambil nama hukum pengubah dari daftar operasi pasal ini. */
function hukumPengubah(ops: OpsRow[]): string | null {
  const o = ops.find((x) => x.amender)?.amender ?? '';
  const m = o.match(/UU(?:\s+No\.?)?\s*\d+\s+Tahun\s+\d{4}/);
  return m ? m[0] : null;
}

export default function NaskahPasal(p: NaskahPasalProps) {
  const fsCls = fontSizeClass(p.fontSize);
  const ffCls = p.fontType === 'serif' ? 'font-serif' : 'font-sans';

  return (
    <div className="space-y-10">
      {p.currentDoc.nodes.map((chapter) => (
        <div key={chapter.canonicalPath} className="space-y-5">
          {/* Judul BAB Resmi */}
          <div className="my-10 pt-8 border-t border-slate-200 text-center space-y-1">
            <span className="font-sans font-bold text-xs uppercase tracking-widest text-[#94191C] block">
              {chapter.label}
            </span>
            {chapter.title && (
              <h3 className="font-sans font-extrabold text-base sm:text-lg text-slate-900 uppercase tracking-wide">
                {chapter.title}
              </h3>
            )}
          </div>

          {/* Pasal-Pasal */}
          {chapter.children?.map((pasal) => {
            const pasalOps = opsUntuk(p.operations, pasal.canonicalPath, p.selectedTimeline, p.baseYear);
            const isNewInsert = pasalOps.some((o) => o.operationType === 'ADD_PROVISION');
            const isAmended = pasalOps.some((o) => o.operationType === 'REPLACE_PROVISION' || o.operationType === 'PARTIAL_REPEAL');
            const isRepealed = pasal.isRepealed || pasalOps.some((o) => o.operationType === 'REPEAL_PROVISION');
            const hasMk = false; // anotasi putusan MK: data belum ada (belum terdigitasi)
            const hasAnyMutation = isNewInsert || isAmended || isRepealed;
            const isSelected = p.activeNodePath === pasal.canonicalPath || p.activeNodePath.startsWith(pasal.canonicalPath + '/');

            // Penanda visual: Hanya disematkan jika pasal tersebut memiliki riwayat perubahan/amandemen
            const borderClass = !p.showAnnotations || !hasAnyMutation
              ? 'pl-3 sm:pl-4 pr-2 py-2 border-l-4 border-transparent'
              : isRepealed
                ? (isSelected
                    ? 'border-l-4 border-rose-500 bg-rose-50/50 pl-3 sm:pl-4 pr-2 py-2.5 rounded-r-xl'
                    : 'border-l-4 border-rose-400 bg-rose-50/30 pl-3 sm:pl-4 pr-2 py-2.5 rounded-r-xl')
                : isNewInsert
                  ? (isSelected
                      ? 'border-l-4 border-emerald-600 bg-emerald-50/60 pl-3 sm:pl-4 pr-2 py-2.5 rounded-r-xl'
                      : 'border-l-4 border-emerald-400 bg-emerald-50/30 pl-3 sm:pl-4 pr-2 py-2.5 rounded-r-xl')
                  : isAmended
                    ? (isSelected
                        ? 'border-l-4 border-amber-500 bg-amber-50/60 pl-3 sm:pl-4 pr-2 py-2.5 rounded-r-xl'
                        : 'border-l-4 border-amber-400 bg-amber-50/30 pl-3 sm:pl-4 pr-2 py-2.5 rounded-r-xl')
                    : 'pl-3 sm:pl-4 pr-2 py-2 border-l-4 border-transparent';

            // Efek seleksi: Untuk pasal tanpa perubahan, TIDAK PERLU kotak/ring merah sama sekali
            const activeClass = isSelected
              ? (hasAnyMutation
                  ? 'shadow-xs'
                  : 'bg-slate-50/60 rounded-xl')
              : 'hover:bg-slate-50/40';

            return (
              <div
                key={pasal.canonicalPath}
                id={`node-${pasal.canonicalPath}`}
                className={`my-5 transition-all ${borderClass} ${activeClass}`}
              >
                {/* Header Pasal ala Format UU Resmi (Centered) */}
                <div className="text-center mb-3 cursor-pointer select-none" onClick={() => p.handleOpenInspector(pasal, chapter.label)}>
                  <div className="inline-flex items-center gap-2 flex-wrap justify-center">
                    <span className="font-sans font-extrabold text-slate-900 text-sm sm:text-base">
                      {pasal.label}
                    </span>
                    {p.showAnnotations && isNewInsert && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                        🟢 Sisipan Baru {hukumPengubah(pasalOps) ? `(${hukumPengubah(pasalOps)})` : ''}
                      </span>
                    )}
                    {p.showAnnotations && isAmended && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                        🟡 Diubah {hukumPengubah(pasalOps) ? `(${hukumPengubah(pasalOps)})` : ''}
                      </span>
                    )}
                    {p.showAnnotations && isRepealed && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                        🔴 Dicabut / Dihapus {hukumPengubah(pasalOps) ? `(${hukumPengubah(pasalOps)})` : ''}
                      </span>
                    )}
                    {p.showAnnotations && hasMk && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-300 shadow-2xs">
                        ⚖️ Putusan MK
                      </span>
                    )}
                  </div>
                  {pasal.title && (
                    <div className="text-xs font-sans text-slate-500 font-medium mt-0.5">
                      ({pasal.title})
                    </div>
                  )}
                </div>

                {/* Isi Ayat atau Paragraf Dokumen (Presisi Indentasi Vertikal) */}
                {pasal.children && pasal.children.length > 0 ? (
                  <div className="space-y-2.5">
                    {pasal.children.map((ayat) => (
                      <AyatRow
                        key={ayat.canonicalPath}
                        ayat={ayat}
                        pasalLabel={pasal.label}
                        ops={opsUntuk(p.operations, ayat.canonicalPath, p.selectedTimeline, p.baseYear)}
                        showAnnotations={p.showAnnotations}
                        activeNodePath={p.activeNodePath}
                        provisionVersions={p.provisionVersions}
                        setProvisionVersions={p.setProvisionVersions}
                        fontSizeCls={fsCls}
                        fontFamilyCls={ffCls}
                        handleOpenInspector={p.handleOpenInspector}
                      />
                    ))}
                  </div>
                ) : (
                  <PasalParagraf
                    pasal={pasal}
                    ops={opsUntuk(p.operations, pasal.canonicalPath, p.selectedTimeline, p.baseYear)}
                    activeNodePath={p.activeNodePath}
                    provisionVersions={p.provisionVersions}
                    setProvisionVersions={p.setProvisionVersions}
                    fontSizeCls={fsCls}
                    fontFamilyCls={ffCls}
                    handleOpenInspector={p.handleOpenInspector}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

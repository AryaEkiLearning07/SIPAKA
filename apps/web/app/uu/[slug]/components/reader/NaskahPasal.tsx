'use client';

import React from 'react';
import { ConsolidatedLawDocument, ProvisionNode } from '@lexvera/types';
import { PROVISION_AMENDMENT_MAP, ProvisionAmendmentDetail } from '../../impact-data';
import { fontSizeClass } from '../../reader-utils';
import { AyatRow, PasalParagraf } from './NaskahBits';

interface NaskahPasalProps {
  currentDoc: ConsolidatedLawDocument;
  showAnnotations: boolean;
  activeNodePath: string;
  provisionVersions: Record<string, 'CURRENT' | 'PREVIOUS'>;
  setProvisionVersions: React.Dispatch<React.SetStateAction<Record<string, 'CURRENT' | 'PREVIOUS'>>>;
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  fontType: 'serif' | 'sans';
  handleOpenInspector: (node: ProvisionNode, parentLabel?: string) => void;
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
            const pasalDetail = PROVISION_AMENDMENT_MAP[pasal.canonicalPath];
            const isNewInsert = pasal.versionTag.startsWith('AMENDMENT_2024') || pasalDetail?.statusPerubahan === 'SISIPAN_BARU';
            const isAmended = pasal.versionTag.startsWith('AMENDED') || (pasal.versionTag.startsWith('AMENDMENT') && !isNewInsert) || pasalDetail?.statusPerubahan === 'DIUBAH';
            const isRepealed = pasal.isRepealed || pasalDetail?.statusPerubahan === 'DICABUT';
            const hasMk = Boolean(pasalDetail?.putusanMk);
            const isSelected = p.activeNodePath === pasal.canonicalPath || p.activeNodePath.startsWith(pasal.canonicalPath + '/');

            const borderClass = !p.showAnnotations
              ? 'pl-3 sm:pl-4 pr-2 py-2 border-l-4 border-transparent'
              : isRepealed
              ? 'border-l-4 border-rose-500 bg-rose-50/50 pl-3 sm:pl-4 pr-2 py-3 rounded-r-xl shadow-xs'
              : isNewInsert
                ? 'border-l-4 border-emerald-500 bg-emerald-50/50 pl-3 sm:pl-4 pr-2 py-3 rounded-r-xl shadow-xs'
                : isAmended
                  ? 'border-l-4 border-amber-400 bg-amber-50/50 pl-3 sm:pl-4 pr-2 py-3 rounded-r-xl shadow-xs'
                  : 'pl-3 sm:pl-4 pr-2 py-2 border-l-4 border-transparent';

            const activeClass = isSelected
              ? 'ring-2 ring-[#94191C] bg-red-50/70 rounded-xl shadow-xs'
              : 'hover:bg-slate-50/70';

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
                        🟢 Sisipan Baru (UU 1/2024)
                      </span>
                    )}
                    {p.showAnnotations && isAmended && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                        🟡 Diubah (UU 1/2024)
                      </span>
                    )}
                    {p.showAnnotations && isRepealed && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                        🔴 Dicabut / Dihapus (UU 1/2024)
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
                        pasalHasMk={hasMk}
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
                    pasalDetail={pasalDetail as ProvisionAmendmentDetail | undefined}
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

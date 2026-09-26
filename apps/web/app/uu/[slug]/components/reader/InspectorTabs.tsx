'use client';

import React from 'react';
import { ChevronRight, Check, Copy, Sparkles } from 'lucide-react';
import { ProvisionNode } from '@lexvera/types';
import { InspectorState, InspectorTab, OpsRow } from '../../reader-types';

export interface InspectorTabsProps {
  inspectorNode: InspectorState;
  inspectorTab: InspectorTab;
  setInspectorTab: (t: InspectorTab) => void;
  handleOpenInspector: (node: ProvisionNode, parentLabel?: string) => void;
  scrollToNode: (path: string) => void;
  operations: OpsRow[];
  copiedCitation: boolean;
  salinSitasi: (node: { label: string }) => void;
  currentUser: { name: string; role: string } | null;
  setShowLoginPrompt: (v: boolean) => void;
  setShowAiModal: (v: boolean) => void;
}

export default function InspectorTabs(p: InspectorTabsProps) {
  const node = p.inspectorNode;
  return (
    <>
      {/* Tab 1: Komparasi Teks (Before vs After) */}
      {p.inspectorTab === 'diff' && (
        <div className="space-y-3 pt-1">
          {/* Teks Sebelum */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-rose-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Sebelumnya (Naskah Asli/Lama):
              </span>
            </div>
            <p className="text-xs font-serif text-slate-700 italic leading-relaxed pt-1 text-justify">
              {node.fromText || '(Belum diatur pada naskah awal)'}
            </p>
          </div>

          {/* Teks Sesudah */}
          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Setelahnya (Hukum Positif Terkini):
              </span>
            </div>
            <p className="text-xs font-sans text-slate-900 font-medium leading-relaxed pt-1 text-justify">
              {node.toText || 'Norma berlaku sesuai naskah dokumen.'}
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Seluruh Operasi Perubahan Instrumen Ini (dari database) */}
      {p.inspectorTab === 'affected_list' && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 pb-0.5">
            <span>Seluruh operasi perubahan yang tersimpan di database:</span>
            <span className="font-mono font-bold text-slate-700">{p.operations.length} Operasi</span>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {p.operations.map((op) => {
              const isCurrentActive = node.canonicalPath === op.targetCanonicalPath;
              const jenis = op.operationType.replace('_PROVISION', '');
              return (
                <div
                  key={op.id}
                  onClick={() => {
                    p.scrollToNode(op.targetCanonicalPath);
                    p.handleOpenInspector(
                      {
                        canonicalPath: op.targetCanonicalPath,
                        type: 'PASAL',
                        orderIndex: 0,
                        label: op.targetLabel,
                        content: op.newContent ?? '',
                        versionTag: 'AMENDED',
                        children: [],
                      } as ProvisionNode
                    );
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer group shadow-2xs ${
                    isCurrentActive
                      ? 'bg-red-50/90 border-[#94191C] ring-2 ring-[#94191C]/50'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-xs text-slate-900 group-hover:text-[#94191C] transition-colors">
                      {op.targetLabel}
                    </span>
                    <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      op.operationType === 'ADD_PROVISION'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : op.operationType === 'REPEAL_PROVISION'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-amber-50 text-amber-900 border-amber-300'
                    }`}>
                      {jenis}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {(op.previousContent ? '[Lama→] ' + op.previousContent.slice(0, 80) + ' — ' : '') +
                     (op.newContent ? '[Baru→] ' + op.newContent.slice(0, 80) : '')}
                  </p>

                  <div className="pt-1.5 mt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="truncate max-w-[190px]">{op.amender} · {op.sourceReference}</span>
                    <span className="text-[#94191C] font-semibold flex items-center group-hover:translate-x-0.5 transition-transform">
                      Inspeksi <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Relasi: jujur — data belum ada */}
      {p.inspectorTab === 'relasi' && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-[11px] leading-relaxed text-slate-600">
          <span className="font-bold text-slate-800 block mb-1">Belum ada data relasi.</span>
          Mesin relasi antar-aturan (dasar hukum, melaksanakan, merujuk) akan mengisinya
          seiring bertambahnya dokumen yang terdigitasi.
        </div>
      )}

      {/* Clean Bottom Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
        <button
          onClick={() => p.salinSitasi(node)}
          className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
        >
          {p.copiedCitation ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-bold">Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Salin Sitasi</span>
            </>
          )}
        </button>

        <button
          onClick={() => {
            if (!p.currentUser) p.setShowLoginPrompt(true);
            else p.setShowAiModal(true);
          }}
          className="flex-1 py-2 px-3 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-red-200" />
          <span>Analisis AI</span>
        </button>
      </div>
    </>
  );
}

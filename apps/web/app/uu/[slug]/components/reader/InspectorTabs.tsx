'use client';

import React from 'react';
import {
  Scale, X, FileText, ExternalLink, ArrowRight, ChevronRight,
  Check, Copy, Sparkles
} from 'lucide-react';
import { ProvisionNode } from '@lexvera/types';
import { ALL_AMENDED_PROVISIONS, ImpactedRegulation } from '../../impact-data';
import { InspectorState, InspectorTab } from '../../reader-types';

export interface InspectorTabsProps {
  inspectorNode: InspectorState;
  inspectorTab: InspectorTab;
  setInspectorTab: (t: InspectorTab) => void;
  handleOpenInspector: (node: ProvisionNode, parentLabel?: string) => void;
  scrollToNode: (path: string) => void;
  setSelectedImpact: (r: ImpactedRegulation) => void;
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
              <span className="text-[10px] font-mono text-slate-400">
                UU 11/2008
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
              <span className="text-[10px] font-mono text-emerald-800 font-semibold">
                UU 1/2024
              </span>
            </div>
            <p className="text-xs font-sans text-slate-900 font-medium leading-relaxed pt-1 text-justify">
              {node.toText || 'Norma berlaku sesuai naskah dokumen.'}
            </p>
          </div>

          {/* Rasional Perubahan */}
          {node.amendmentDetail?.latarBelakangPerubahan && (
            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 text-[11px] text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">Latar Belakang Perubahan: </span>
              {node.amendmentDetail.latarBelakangPerubahan}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Daftar Seluruh Pasal yang Terdampak Amandemen */}
      {p.inspectorTab === 'affected_list' && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 pb-0.5">
            <span>Daftar pasal yang disentuh oleh UU 1/2024:</span>
            <span className="font-mono font-bold text-slate-700">{ALL_AMENDED_PROVISIONS.length} Ketentuan</span>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {ALL_AMENDED_PROVISIONS.map((item) => {
              const isCurrentActive = node.canonicalPath === item.canonicalPath;
              return (
                <div
                  key={item.canonicalPath}
                  onClick={() => {
                    p.scrollToNode(item.canonicalPath);
                    const dummyNode: ProvisionNode = {
                      canonicalPath: item.canonicalPath,
                      type: 'PASAL',
                      orderIndex: 0,
                      label: item.label,
                      title: '',
                      content: '',
                      versionTag: item.status === 'SISIPAN_BARU' ? 'AMENDMENT_2024' : 'AMENDED',
                      children: [],
                    };
                    p.handleOpenInspector(dummyNode);
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer group shadow-2xs ${
                    isCurrentActive
                      ? 'bg-red-50/90 border-[#94191C] ring-2 ring-[#94191C]/50'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-xs text-slate-900 group-hover:text-[#94191C] transition-colors">
                      {item.label}
                    </span>
                    <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      item.status === 'SISIPAN_BARU'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : item.status === 'DICABUT'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-amber-50 text-amber-900 border-amber-300'
                    }`}>
                      {item.statusLabel}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>

                  <div className="pt-1.5 mt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="truncate max-w-[190px]">{item.amendingLaw}</span>
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

      {/* Tab 3: Dampak Regulasi Turunan */}
      {p.inspectorTab === 'impact' && (
        <div className="space-y-3 pt-1">
          <p className="text-[11px] text-slate-500 leading-snug">
            Peraturan turunan yang terdampak langsung oleh amandemen pasal ini:
          </p>

          <div className="space-y-2">
            {node.amendmentDetail?.peraturanTerdampak?.map((reg) => (
              <div
                key={reg.id}
                onClick={() => p.setSelectedImpact(reg)}
                className="p-3 rounded-xl border border-slate-200 hover:border-[#94191C]/50 hover:bg-slate-50 transition-all cursor-pointer group bg-white shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between gap-1 text-[11px]">
                  <span className="font-bold text-slate-900 group-hover:text-[#94191C] transition-colors">
                    {reg.number}
                  </span>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    {reg.statusLabel}
                  </span>
                </div>

                <h5 className="font-sans font-medium text-xs text-slate-700 leading-snug">
                  {reg.title}
                </h5>

                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {reg.ringkasanDampak}
                </p>

                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-[#94191C]">
                  <span>Pasal: {reg.pasalTurunan}</span>
                  <span className="flex items-center group-hover:translate-x-0.5 transition-transform">
                    Rincian Pertentangan <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Putusan Mahkamah Konstitusi */}
      {p.inspectorTab === 'mk' && node.amendmentDetail?.putusanMk && (
        <div className="space-y-3 pt-1">
          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2">
            <div className="flex items-center gap-1.5 text-purple-950 font-bold text-xs">
              <Scale className="w-3.5 h-3.5 text-purple-700 shrink-0" />
              <span>{node.amendmentDetail.putusanMk.nomor}</span>
            </div>
            <p className="text-xs text-purple-950 font-serif italic leading-relaxed">
              &ldquo;{node.amendmentDetail.putusanMk.amarPutusan}&rdquo;
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-900 block mb-1">Pertimbangan Hukum (Ratio Decidendi):</span>
            {node.amendmentDetail.putusanMk.ratioDecidendi}
          </div>
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

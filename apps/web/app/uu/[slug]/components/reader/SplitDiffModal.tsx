'use client';

import React, { useRef } from 'react';
import { X, Columns2, Check, Copy, FileText, ArrowRight } from 'lucide-react';
import { InspectorState, OpsRow } from '../../reader-types';

interface SplitDiffModalProps {
  node: InspectorState;
  operations: OpsRow[];
  copiedCitation: boolean;
  salinSitasi: (node: { label: string }) => void;
  onClose: () => void;
}

export default function SplitDiffModal({
  node,
  operations,
  copiedCitation,
  salinSitasi,
  onClose,
}: SplitDiffModalProps) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  const handleScroll = (source: 'left' | 'right') => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    const fromEl = source === 'left' ? leftRef.current : rightRef.current;
    const toEl = source === 'left' ? rightRef.current : leftRef.current;

    if (fromEl && toEl) {
      const percentage = fromEl.scrollTop / (fromEl.scrollHeight - fromEl.clientHeight || 1);
      toEl.scrollTop = percentage * (toEl.scrollHeight - toEl.clientHeight);
    }

    setTimeout(() => {
      isSyncing.current = false;
    }, 50);
  };

  const ops = node.ops ?? operations.filter(
    (o) => o.targetCanonicalPath === node.canonicalPath || o.targetCanonicalPath.startsWith(node.canonicalPath + '/')
  );
  const opUtama = ops[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-5xl w-full h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <header className="h-16 px-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#94191C]/10 border border-[#94191C]/20 flex items-center justify-center text-[#94191C]">
              <Columns2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-extrabold text-base text-slate-900">
                  Komparasi Berdampingan: {node.label}
                </h3>
                {node.parentLabel && (
                  <span className="text-xs font-normal text-slate-500">({node.parentLabel})</span>
                )}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>Membandingkan naskah sebelum vs sesudah amandemen</span>
                {opUtama?.amender && (
                  <>
                    <span>·</span>
                    <strong className="text-slate-700">{opUtama.amender}</strong>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Info Strip Atas */}
        {opUtama && (
          <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 text-xs flex items-center justify-between flex-wrap gap-2 text-slate-600">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#94191C]" />
              <span className="font-semibold text-slate-800">{opUtama.changeSetTitle}</span>
              <span className="text-slate-400">·</span>
              <span className="font-mono text-slate-700 font-medium">Dasar: {opUtama.sourceReference}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Sinkronisasi Gulir: <strong className="text-emerald-700">Aktif</strong>
            </div>
          </div>
        )}

        {/* Split Screen 2 Kolom */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-hidden bg-slate-50/30">
          {/* Kolom Kiri: Sebelum Perubahan (Lama) */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="px-5 py-3 bg-rose-50/60 border-b border-rose-200 flex items-center justify-between shrink-0">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Sebelum Perubahan (Naskah Asli/Terdahulu)
              </span>
            </div>
            <div
              ref={leftRef}
              onScroll={() => handleScroll('left')}
              className="flex-1 overflow-y-auto p-6 font-serif text-sm leading-[1.85] text-slate-800 text-justify bg-white selection:bg-rose-100"
            >
              {node.fromText ? (
                <div className="p-4 rounded-2xl bg-rose-50/30 border border-rose-100/80">
                  <p className="whitespace-pre-wrap">{node.fromText}</p>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic font-sans text-xs">
                  (Ketentuan belum diatur pada naskah awal dokumen ini)
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Setelah Perubahan (Hukum Positif Berlaku) */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="px-5 py-3 bg-emerald-50/60 border-b border-emerald-200 flex items-center justify-between shrink-0">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Setelah Perubahan (Hukum Positif Terkini)
              </span>
            </div>
            <div
              ref={rightRef}
              onScroll={() => handleScroll('right')}
              className="flex-1 overflow-y-auto p-6 font-serif text-sm leading-[1.85] text-slate-900 text-justify bg-white selection:bg-emerald-100"
            >
              {node.toText ? (
                <div className="p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100/80">
                  <p className="whitespace-pre-wrap">{node.toText}</p>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic font-sans text-xs">
                  (Norma telah dihapus atau ditiadakan dari hukum positif)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <footer className="h-16 px-6 border-t border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div className="text-xs text-slate-500 font-mono">
            {node.canonicalPath}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => salinSitasi(node)}
              className="py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedCitation ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Sitasi Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Salin Sitasi Resmi</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="py-2 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Selesai Membaca
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

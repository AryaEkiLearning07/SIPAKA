'use client';

import React from 'react';
import Link from 'next/link';
import {
  Scale, X, FileText, ExternalLink, ArrowRight, Printer, Columns2,
  Bookmark, BookmarkCheck, MessageSquare
} from 'lucide-react';
import { ProvisionNode } from '@lexvera/types';
import { InspectorState, InspectorTab, OpsRow, InstrumentRelationsData, API_BASE } from '../../reader-types';
import InspectorTabs from './InspectorTabs';

interface InspectorPanelProps {
  inspectorNode: InspectorState;
  setInspectorNode: React.Dispatch<React.SetStateAction<InspectorState | null>>;
  setActiveNodePath: (path: string) => void;
  inspectorTab: InspectorTab;
  setInspectorTab: (t: InspectorTab) => void;
  handleOpenInspector: (node: ProvisionNode, parentLabel?: string) => void;
  scrollToNode: (path: string) => void;
  operations: OpsRow[];
  relations?: InstrumentRelationsData | null;
  copiedCitation: boolean;
  salinSitasi: (node: { label: string }) => void;
  currentUser: { name: string; role: string } | null;
  setShowLoginPrompt: (v: boolean) => void;
  setShowAiModal: (v: boolean) => void;
  setShowSplitDiffModal: (v: boolean) => void;
}

/** Kartu tindakan hukum atas node (taksonomi UU 12/2011). */
function KartuTindakan({ ops }: { ops: OpsRow[] }) {
  const dicabut = ops.some((o) => o.operationType === 'REPEAL_PROVISION');
  const disisipkan = ops.some((o) => o.operationType === 'ADD_PROVISION') && !dicabut;
  const tema = dicabut
    ? { cls: 'from-rose-600 to-rose-700 border-rose-500', badge: 'bg-rose-800/80 border-rose-400/40 text-rose-100', badgeT: 'DICABUT', emoji: '🔴', judul: 'DIHAPUS / DICABUT DARI HUKUM POSITIF', ket: 'Ketentuan norma ditiadakan secara permanen dan tidak lagi memiliki daya laku atau kekuatan hukum mengikat.' }
    : disisipkan
      ? { cls: 'from-emerald-600 to-emerald-700 border-emerald-500', badge: 'bg-emerald-800/80 border-emerald-400/40 text-emerald-100', badgeT: 'SISIPAN', emoji: '🟢', judul: 'DISISIPKAN (NORMA SISIPAN BARU)', ket: 'Ketentuan norma baru yang disisipkan di antara pasal yang ada tanpa merombak nomor urut pasal lainnya.' }
      : { cls: 'from-amber-500 to-amber-600 border-amber-400', badge: 'bg-amber-700/80 border-amber-300/40 text-amber-100', badgeT: 'DIUBAH', emoji: '🟡', judul: 'DIUBAH (REDAKSI & SUBSTANSI DIPERBARUI)', ket: 'Rumusan teks kalimat dan materi muatan norma diperbaiki, disesuaikan, atau digantikan dengan konstruksi hukum baru.' };
  return (
    <div className={`p-3.5 rounded-xl bg-gradient-to-br ${tema.cls} text-white shadow-sm`}>
      <div className="flex items-center justify-between gap-1 text-[10px] font-mono tracking-wider uppercase font-bold opacity-90 mb-1">
        <span>TINDAKAN HUKUM (UU 12/2011)</span>
        <span className={`px-1.5 py-0.5 rounded border ${tema.badge}`}>{tema.badgeT}</span>
      </div>
      <h4 className="font-sans font-black text-sm tracking-wide flex items-center gap-1.5">
        <span>{tema.emoji}</span>
        <span>{tema.judul}</span>
      </h4>
      <p className="text-[11px] opacity-90 leading-relaxed mt-1 font-medium">{tema.ket}</p>
    </div>
  );
}

export default function InspectorPanel(p: InspectorPanelProps) {
  const node = p.inspectorNode;
  const ops = node.ops ?? [];
  const opUtama = ops[0];
  const amenderSlug = opUtama?.amenderSlug ?? null;

  const [isBookmarked, setIsBookmarked] = React.useState<boolean>(false);
  const [bookmarkLoading, setBookmarkLoading] = React.useState<boolean>(false);

  // Cek status bookmark saat node berganti
  React.useEffect(() => {
    let cancelled = false;
    if (!p.currentUser || !node.canonicalPath) {
      setIsBookmarked(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/bookmarks?canonicalPath=${encodeURIComponent(node.canonicalPath)}`, {
          credentials: 'include',
        });
        if (res.ok && !cancelled) {
          const json = await res.json();
          setIsBookmarked(Array.isArray(json?.data) && json.data.length > 0);
        }
      } catch {
        // Abaikan
      }
    })();
    return () => { cancelled = true; };
  }, [node.canonicalPath, p.currentUser]);

  const handleToggleBookmark = async () => {
    if (!p.currentUser) {
      p.setShowLoginPrompt(true);
      return;
    }
    setBookmarkLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/bookmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          canonicalPath: node.canonicalPath,
          label: node.label,
          instrumentSlug: node.canonicalPath.split('/')[0] || 'general',
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setIsBookmarked(json.action === 'CREATED');
      }
    } catch {
      // Abaikan
    } finally {
      setBookmarkLoading(false);
    }
  };

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
          {/* 1. Tindakan hukum */}
          <KartuTindakan ops={ops} />

          {/* Label Nama Pasal Aktif & Tombol Bookmark */}
          <div className="pt-1 flex items-start justify-between gap-2">
            <div>
              <h3 className="font-sans font-extrabold text-lg text-slate-900 leading-snug">
                {node.label}
                {node.parentLabel && (
                  <span className="text-slate-400 text-xs font-normal ml-2">({node.parentLabel})</span>
                )}
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 mt-1 inline-block">
                {node.canonicalPath}
              </span>
            </div>

            {/* Tombol Simpan Markah Buku (Bookmark) */}
            <button
              onClick={handleToggleBookmark}
              disabled={bookmarkLoading}
              title={isBookmarked ? 'Hapus dari Markah Buku' : 'Simpan ke Markah Buku Pribadi'}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                isBookmarked
                  ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-900'
              }`}
            >
              {isBookmarked ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-amber-600 fill-amber-500" />
                  <span className="text-[11px] font-bold text-amber-900 pr-1">Tersimpan</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 text-slate-400" />
                  <span className="text-[11px] font-semibold text-slate-600 pr-1">Markah</span>
                </>
              )}
            </button>
          </div>

          {/* 2. Kartu Aturan Pengubah — seluruh data dari operasi database */}
          {opUtama && (
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
                  {opUtama.amender}
                </h5>
                <p className="text-[11px] text-slate-600 mt-0.5">{opUtama.changeSetTitle}</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-200/70 text-[11px]">
                <div className="flex items-start gap-1.5 text-slate-600">
                  <span className="text-slate-400 shrink-0 min-w-[75px]">Dasar Klausul:</span>
                  <span className="text-slate-900 font-semibold">{opUtama.sourceReference}</span>
                </div>
                <div className="flex items-start gap-1.5 text-slate-600">
                  <span className="text-slate-400 shrink-0 min-w-[75px]">Berlaku Sejak:</span>
                  <span className="text-slate-800 font-medium">
                    {new Date(opUtama.effectiveFrom).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                {(opUtama.amenderLnNumber || opUtama.amenderTlnNumber) && (
                  <div className="flex items-start gap-1.5 text-slate-600">
                    <span className="text-slate-400 shrink-0 min-w-[75px]">Lembaran Negara:</span>
                    <span className="text-slate-900 font-mono text-[10.5px]">
                      {opUtama.amenderLnNumber ? `LN Tahun ${opUtama.amenderYear ?? ''} No. ${opUtama.amenderLnNumber}` : ''}
                      {opUtama.amenderTlnNumber ? `, TLN No. ${opUtama.amenderTlnNumber}` : ''}
                    </span>
                  </div>
                )}
                {opUtama.amenderPromulgatedAt && (
                  <div className="flex items-start gap-1.5 text-slate-600">
                    <span className="text-slate-400 shrink-0 min-w-[75px]">Diundangkan:</span>
                    <span className="text-slate-700">
                      {new Date(opUtama.amenderPromulgatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>

              {amenderSlug && (
                <Link
                  href={`/uu/${amenderSlug}`}
                  className="w-full py-2 px-3 rounded-lg bg-white border border-slate-200 hover:border-[#94191C] hover:bg-red-50/60 text-[#94191C] font-bold text-xs flex items-center justify-between transition-all group shadow-2xs mt-2 cursor-pointer"
                  title="Buka naskah undang-undang pengubah di platform ini"
                >
                  <span className="flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span>Buka Naskah Lengkap Aturan Pengubah</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>
          )}

          {/* Tombol Komparasi Berdampingan Split-Screen */}
          <button
            onClick={() => p.setShowSplitDiffModal(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#94191C] to-[#7c1417] hover:from-[#851619] hover:to-[#6d1215] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow cursor-pointer"
          >
            <Columns2 className="w-4 h-4" />
            <span>Buka Komparasi Berdampingan (Split-Screen)</span>
          </button>

          {/* 3. TAB SWITCHER */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => p.setInspectorTab('diff')}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-center transition-all cursor-pointer ${
                p.inspectorTab === 'diff'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Komparasi
            </button>
            <button
              onClick={() => p.setInspectorTab('affected_list')}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                p.inspectorTab === 'affected_list'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Perubahan</span>
              <span className="w-3.5 h-3.5 rounded-full bg-red-100 text-[#94191C] text-[9.5px] flex items-center justify-center font-bold">
                {p.operations.length}
              </span>
            </button>
            <button
              onClick={() => p.setInspectorTab('relasi')}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-center transition-all cursor-pointer ${
                p.inspectorTab === 'relasi'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Relasi
            </button>
            <button
              onClick={() => p.setInspectorTab('catatan')}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                p.inspectorTab === 'catatan'
                  ? 'bg-white text-[#94191C] font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>Catatan</span>
            </button>
          </div>

          <p className="text-[10px] leading-relaxed text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
            Sumber data panel ini: <strong className="text-slate-700">Komparasi, Riwayat, dan daftar operasi</strong> dibaca
            langsung dari database (tabel change_operations &amp; relasi). Tab <strong className="text-slate-700">Relasi</strong> akan
            terisi oleh mesin relasi seiring bertambahnya dokumen terdigitasi.
          </p>

          {/* Isi Tab */}
          <InspectorTabs
            inspectorNode={node}
            inspectorTab={p.inspectorTab}
            setInspectorTab={p.setInspectorTab}
            handleOpenInspector={p.handleOpenInspector}
            scrollToNode={p.scrollToNode}
            operations={p.operations}
            relations={p.relations}
            copiedCitation={p.copiedCitation}
            salinSitasi={p.salinSitasi}
            currentUser={p.currentUser}
            setShowLoginPrompt={p.setShowLoginPrompt}
            setShowAiModal={p.setShowAiModal}
            setShowSplitDiffModal={p.setShowSplitDiffModal}
          />
        </div>
      </div>
    </aside>
  );
}

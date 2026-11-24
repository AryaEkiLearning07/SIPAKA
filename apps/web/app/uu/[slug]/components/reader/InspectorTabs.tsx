'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChevronRight, Check, Copy, Sparkles, ExternalLink, Network, ArrowRight,
  Edit3, Trash2, Plus, Lock, Loader2, MessageSquare, Globe, Landmark, BookOpen,
  CheckCircle2, ShieldAlert, FileText, Scale
} from 'lucide-react';
import { ProvisionNode } from '@sipaka/types';
import { InspectorState, InspectorTab, OpsRow, InstrumentRelationsData, API_BASE } from '../../reader-types';
import { getInternationalBenchmarksFor, getOriginalIntentFor } from '../../legal-intelligence-data';
import { LatinTermBadge } from '@/app/components/LatinTermPopup';

export interface InspectorTabsProps {
  inspectorNode: InspectorState;
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
  setShowSplitDiffModal?: (v: boolean) => void;
}

interface NoteItem {
  id: string;
  canonicalPath: string;
  noteText: string;
  color: string;
  createdAt: string;
}

export default function InspectorTabs(p: InspectorTabsProps) {
  const node = p.inspectorNode;

  // State untuk catatan hukum
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedColor, setSelectedColor] = useState<'amber' | 'rose' | 'emerald' | 'blue'>('amber');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  // Ambil catatan saat canonicalPath atau currentUser berubah
  useEffect(() => {
    let cancelled = false;
    if (!p.currentUser || !node.canonicalPath) {
      setNotes([]);
      return;
    }
    (async () => {
      setLoadingNotes(true);
      try {
        const res = await fetch(`${API_BASE}/api/v1/notes?canonicalPath=${encodeURIComponent(node.canonicalPath)}`, {
          credentials: 'include',
        });
        if (res.ok && !cancelled) {
          const json = await res.json();
          if (Array.isArray(json?.data)) {
            setNotes(json.data);
          }
        }
      } catch {
        // Abaikan
      } finally {
        if (!cancelled) setLoadingNotes(false);
      }
    })();
    return () => { cancelled = true; };
  }, [node.canonicalPath, p.currentUser]);

  const handleSaveNote = async () => {
    if (!newNoteText.trim() || !p.currentUser) return;
    setSavingNote(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          canonicalPath: node.canonicalPath,
          noteText: newNoteText.trim(),
          color: selectedColor,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          setNotes((prev) => [json.data, ...prev]);
          setNewNoteText('');
        }
      }
    } catch {
      // Abaikan
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/notes/${noteId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      }
    } catch {
      // Abaikan
    }
  };
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
            {node.toText && (
              <div className="pt-1.5 border-t border-emerald-100/80">
                <LatinTermBadge text={node.toText} />
              </div>
            )}
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
                    <span className="truncate max-w-[170px]">{op.amender} · {op.sourceReference}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
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
                        p.setShowSplitDiffModal?.(true);
                      }}
                      className="text-[#94191C] hover:bg-red-50 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                      title="Buka perbandingan berdampingan sebelum vs sesudah untuk pasal ini"
                    >
                      <span>Bandingkan</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Relasi: Data nyata live dari basis data */}
      {p.inspectorTab === 'relasi' && (
        <div className="space-y-3 pt-1">
          {(!p.relations || (p.relations.incoming.length === 0 && p.relations.outgoing.length === 0)) ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-[11px] leading-relaxed text-slate-600">
              <span className="font-bold text-slate-800 block mb-1">Belum ada jaring relasi terhubung.</span>
              Mesin relasi akan menghubungkan instrumen ini saat dokumen pengubah atau yang dirujuk masuk ke database.
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {/* Relasi Masuk (Incoming: UU lain yang MENGUBAH / MERUJUK dokumen ini) */}
              {p.relations.incoming.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500 block">
                    Diubah / Dirujuk Oleh ({p.relations.incoming.length}):
                  </span>
                  {p.relations.incoming.map((r) => {
                    const src = r.source;
                    const badgeCls = r.jenis === 'MENGUBAH'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : r.jenis === 'MENCABUT'
                        ? 'bg-rose-100 text-rose-900 border-rose-300'
                        : r.jenis === 'DASAR_HUKUM'
                          ? 'bg-purple-100 text-purple-900 border-purple-300'
                          : 'bg-blue-100 text-blue-900 border-blue-300';
                    return (
                      <div key={r.id} className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${badgeCls}`}>
                            {r.jenis}
                          </span>
                          {src?.slug && (
                            <Link
                              href={`/uu/${src.slug}`}
                              className="text-[10px] text-[#94191C] hover:underline font-semibold flex items-center gap-0.5"
                            >
                              <span>Buka Naskah</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                        <h5 className="font-sans font-bold text-xs text-slate-900 leading-tight">
                          {src?.shortTitle || src?.title || 'Instrumen Hukum'}
                        </h5>
                        {r.sumberKlausa && (
                          <p className="text-[10px] text-slate-500 font-mono line-clamp-2">
                            {r.sumberKlausa}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Relasi Keluar (Outgoing: Dokumen ini MERUJUK / MENCABUT UU lain) */}
              {p.relations.outgoing.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500 block">
                    Merujuk / Mencabut Aturan Lain ({p.relations.outgoing.length}):
                  </span>
                  {p.relations.outgoing.map((r) => {
                    const tgt = r.target;
                    const badgeCls = r.jenis === 'MENCABUT'
                      ? 'bg-rose-100 text-rose-900 border-rose-300'
                      : r.jenis === 'MENGUBAH'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : r.jenis === 'DASAR_HUKUM'
                          ? 'bg-purple-100 text-purple-900 border-purple-300'
                          : 'bg-blue-100 text-blue-900 border-blue-300';
                    return (
                      <div key={r.id} className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${badgeCls}`}>
                            {r.jenis}
                          </span>
                          {tgt?.slug && (
                            <Link
                              href={`/uu/${tgt.slug}`}
                              className="text-[10px] text-[#94191C] hover:underline font-semibold flex items-center gap-0.5"
                            >
                              <span>Buka Naskah</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                        <h5 className="font-sans font-bold text-xs text-slate-900 leading-tight">
                          {tgt?.shortTitle || tgt?.title || 'Instrumen Hukum'}
                        </h5>
                        {r.sumberKlausa && (
                          <p className="text-[10px] text-slate-500 font-mono line-clamp-2">
                            {r.sumberKlausa}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Instrumen Internasional & Bilateral (Inovasi A) */}
      {p.inspectorTab === 'internasional' && (
        <div className="space-y-3 pt-1">
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
              <Globe className="w-3.5 h-3.5 text-blue-700" />
              <span>Hukum Internasional &amp; Treaty Room Kemlu</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Pelacakan basis ratifikasi traktat internasional dan benchmark komparatif global yang relevan dengan regulasi ini.
            </p>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {getInternationalBenchmarksFor(node.canonicalPath).map((b) => (
              <div key={b.id} className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    b.scope === 'BILATERAL'
                      ? 'bg-blue-50 text-blue-800 border-blue-300'
                      : b.scope === 'MULTILATERAL'
                        ? 'bg-purple-50 text-purple-800 border-purple-300'
                        : b.scope === 'MODEL_LAW'
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}>
                    {b.scope} · {b.year}
                  </span>
                  <span className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                    b.treatyStatusRI === 'DIRATIFIKASI'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    <span>{b.treatyStatusRI.replace('_', ' ')}</span>
                  </span>
                </div>

                <div>
                  <h5 className="font-sans font-bold text-xs text-slate-900 leading-snug">
                    {b.title}
                  </h5>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{b.sourceOrg}</p>
                </div>

                {b.ratificationLegalBasis && (
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[10.5px] text-slate-700 space-y-0.5">
                    <span className="font-semibold text-slate-900 block font-mono text-[9.5px] uppercase">
                      Dasar Ratifikasi / Harmonisasi RI:
                    </span>
                    <p className="italic">{b.ratificationLegalBasis}</p>
                  </div>
                )}

                <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/60 text-[11px] space-y-1.5">
                  <span className="font-bold text-amber-900 block font-mono text-[9.5px] uppercase">
                    Matriks Komparasi Norma:
                  </span>
                  <div className="space-y-1 text-slate-700 text-[10.5px] leading-relaxed">
                    <p><strong className="text-slate-900">Norma Nasional:</strong> {b.nationalComparison.nationalProvision}</p>
                    <p><strong className="text-slate-900">Standar Global:</strong> {b.nationalComparison.internationalNorm}</p>
                    <p className="pt-1 text-amber-950 italic border-t border-amber-200/50"><strong className="not-italic">Gap Analysis:</strong> {b.nationalComparison.gapAnalysis}</p>
                  </div>
                </div>

                {b.officialDocUrl && (
                  <a
                    href={b.officialDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#94191C] hover:underline pt-1"
                  >
                    <span>Akses Naskah Traktat Asli</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Risalah Pembentukan & Original Intent (Inovasi B) */}
      {p.inspectorTab === 'risalah' && (
        <div className="space-y-3 pt-1">
          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs">
              <Landmark className="w-3.5 h-3.5 text-purple-700" />
              <span>Risalah Pembentukan &amp; Original Intent (DPR/MK)</span>
            </div>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              Penelusuran kehendak asli pembentuk undang-undang melalui Naskah Akademik, DIM DPR RI, dan Risalah Sidang Terbuka Mahkamah Konstitusi.
            </p>
          </div>

          {(() => {
            const oi = getOriginalIntentFor(node.canonicalPath);
            if (!oi) {
              return (
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 space-y-2 text-center">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-800">
                    Anotasi Risalah Spesifik Berada pada Pasal-Pasal Pidana &amp; Tata Kelola Utama
                  </p>
                  <p className="text-slate-500 text-[10.5px] leading-relaxed">
                    Naskah Akademik dan transkrip sidang MKRI berfokus pada pasal materiil (mis. Pasal 26 Perlindungan Data, Pasal 27 &amp; 27A Pencemaran Nama Baik, Pasal 28 Hoaks/SARA, Pasal 45 Sanksi Pidana). Silakan klik pasal terkait pada naskah untuk membaca telaah lengkapnya.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {/* 1. Naskah Akademik */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 pb-1 border-b border-slate-100">
                    <FileText className="w-3.5 h-3.5 text-[#94191C]" />
                    <span>Naskah Akademik RUU ({oi.provisionLabel})</span>
                  </div>
                  <div className="space-y-2 text-[11px] text-slate-700 leading-relaxed text-justify">
                    <div>
                      <span className="font-mono font-bold text-[9.5px] uppercase text-slate-500 block">Latar Belakang Sosiologis:</span>
                      <p>{oi.naskahAkademik.latarBelakang}</p>
                    </div>
                    <div>
                      <span className="font-mono font-bold text-[9.5px] uppercase text-slate-500 block">Landasan Filosofis:</span>
                      <p className="italic text-slate-800">{oi.naskahAkademik.landasanFilosofis}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Daftar Inventarisasi Masalah (DIM) Fraksi DPR */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 pb-1 border-b border-slate-100">
                    <Scale className="w-3.5 h-3.5 text-amber-700" />
                    <span>DIM Pembahasan DPR RI &amp; Pemerintah</span>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-200/70 text-[10.5px] space-y-1">
                    <span className="font-mono font-bold text-[9.5px] uppercase text-amber-900 block">{oi.dimDpr.nomorDim}</span>
                    <p><strong className="text-slate-900">Sikap Fraksi DPR:</strong> {oi.dimDpr.sikapFraksiDpr}</p>
                    <p><strong className="text-slate-900">Sikap Pemerintah:</strong> {oi.dimDpr.sikapPemerintah}</p>
                    <p className="pt-1 border-t border-amber-200/50 text-amber-950 font-medium"><strong className="text-slate-900 font-semibold">Kompromi Akhir:</strong> {oi.dimDpr.catatanKompromi}</p>
                  </div>
                </div>

                {/* 3. Transkrip Sidang Terbuka Mahkamah Konstitusi */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <Landmark className="w-3.5 h-3.5 text-purple-700" />
                      <span>Risalah Uji Materiil MKRI</span>
                    </div>
                    <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                      {oi.risalahMk.nomorPerkara}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-slate-700 leading-relaxed text-justify">
                    <div>
                      <span className="font-mono font-bold text-[9.5px] uppercase text-slate-500 block">Keterangan Resmi Pembentuk UU di Sidang:</span>
                      <p className="italic text-slate-600">{oi.risalahMk.keteranganDprPresiden}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-50/50 border border-purple-200/50">
                      <span className="font-mono font-bold text-[9.5px] uppercase text-purple-900 block">Ratio Decidendi Mahkamah:</span>
                      <p className="text-purple-950 font-medium text-[10.5px]">{oi.risalahMk.ratioDecidendi}</p>
                    </div>
                  </div>
                </div>

                {/* 4. Penjelasan Resmi Lembaran Negara */}
                {oi.penjelasanResmi && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                    <span className="font-mono font-bold text-[9.5px] uppercase text-slate-500 block">Penjelasan Resmi Naskah UU:</span>
                    <p className="italic text-slate-700 text-justify">{oi.penjelasanResmi}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab 4: Catatan & Anotasi Pribadi */}
      {p.inspectorTab === 'catatan' && (
        <div className="space-y-3 pt-1">
          {!p.currentUser ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-red-50 text-[#94191C] flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Buku Catatan &amp; Anotasi Pribadi</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Masuk ke akun Anda untuk menulis catatan hukum, anotasi doktrin, atau analisis kasus pada pasal ini secara tersimpan aman di database.
                </p>
              </div>
              <button
                onClick={() => p.setShowLoginPrompt(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Masuk ke Akun
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Form Input Catatan Baru */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-[#94191C]" />
                    <span>Catatan Baru</span>
                  </span>
                  {/* Color Selector */}
                  <div className="flex items-center gap-1">
                    {(['amber', 'rose', 'emerald', 'blue'] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                          c === 'amber' ? 'bg-amber-400' :
                          c === 'rose' ? 'bg-rose-500' :
                          c === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'
                        } ${selectedColor === c ? 'ring-2 ring-slate-800 scale-110' : 'opacity-60 hover:opacity-100'}`}
                        title={`Label ${c}`}
                      />
                    ))}
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Tulis pertimbangan yuridis, tafsir putusan MK, atau catatan perkuliahan untuk pasal ini..."
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-[#94191C] focus:ring-1 focus:ring-[#94191C] text-slate-800 placeholder:text-slate-400 leading-relaxed"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    disabled={savingNote || !newNoteText.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#94191C] hover:bg-[#861619] disabled:bg-slate-300 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                  >
                    {savingNote ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Menyimpan…</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Simpan Catatan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* List Catatan Tersimpan */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold">Catatan Tersimpan ({notes.length}):</span>
                  {loadingNotes && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                </div>

                {notes.length === 0 && !loadingNotes ? (
                  <div className="p-3 text-center text-slate-400 text-[11px] bg-white rounded-xl border border-dashed border-slate-200">
                    Belum ada catatan untuk pasal ini. Tulis catatan pertama di atas.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-0.5">
                    {notes.map((n) => {
                      const colorBorder = 
                        n.color === 'rose' ? 'border-l-rose-500 bg-rose-50/20' :
                        n.color === 'emerald' ? 'border-l-emerald-500 bg-emerald-50/20' :
                        n.color === 'blue' ? 'border-l-blue-500 bg-blue-50/20' :
                        'border-l-amber-500 bg-amber-50/20';

                      return (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl border border-slate-200 border-l-4 ${colorBorder} space-y-1.5 shadow-2xs group`}
                        >
                          <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400 font-mono">
                            <span>
                              {new Date(n.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(n.id)}
                              title="Hapus catatan"
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {n.noteText}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
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

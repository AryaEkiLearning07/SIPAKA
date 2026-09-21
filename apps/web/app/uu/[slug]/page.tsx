'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Network, GitBranch, AlertTriangle,
  X, Scale, ExternalLink, Sparkles, SplitSquareVertical,
  Layers, Check, FileText
} from 'lucide-react';
import { ConsolidatedLawDocument, ProvisionNode, ProvisionDiffResult } from '@lexvera/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface InstrumentMeta {
  slug: string;
  type: string;
  number: number;
  year: number;
  title: string;
  shortTitle?: string;
  status: string;
  availableTimelines: string[];
  amendments: { title: string; amendingInstrument: string; effectiveFrom: string }[];
}

interface InspectorState {
  canonicalPath: string;
  label: string;
  parentLabel?: string;
  status: string;
  amendedBy?: string;
  versionTag: string;
  isRepealed?: boolean;
  repealBasis?: string;
  fromText: string;
  toText: string;
  diff: ProvisionDiffResult;
  loading?: boolean;
}

async function fetchSnapshot(slug: string, year: string): Promise<ConsolidatedLawDocument> {
  const res = await fetch(`${API_BASE}/api/v1/instruments/${slug}/snapshot?year=${year}`);
  if (!res.ok) throw new Error(`snapshot ${year} gagal (HTTP ${res.status})`);
  const json = await res.json();
  return json.data as ConsolidatedLawDocument;
}

export default function LawWorkspacePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? 'ite';

  const [meta, setMeta] = useState<InstrumentMeta | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [docCache, setDocCache] = useState<Record<string, ConsolidatedLawDocument>>({});
  const [loadingYears, setLoadingYears] = useState<string[]>([]);
  const docCacheRef = useRef<Record<string, ConsolidatedLawDocument>>({});
  const inflightYears = useRef<Set<string>>(new Set());

  const [selectedTimeline, setSelectedTimeline] = useState<string | null>(null);
  const [activeNodePath, setActiveNodePath] = useState<string>('');
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [compareFromYear, setCompareFromYear] = useState<string | null>(null);
  const [compareToYear, setCompareToYear] = useState<string | null>(null);

  // Inspector State
  const [inspectorNode, setInspectorNode] = useState<InspectorState | null>(null);

  // 1. Metadata peraturan (dari API/database)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/instruments/${slug}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body?.error === 'DATABASE_EMPTY'
              ? 'Database kosong — jalankan `pnpm db:seed`.'
              : body?.error === 'DATABASE_UNAVAILABLE'
                ? 'Database tidak terjangkau — jalankan `docker compose up -d` lalu `pnpm db:migrate`.'
                : `Peraturan "${slug}" tidak ditemukan (HTTP ${res.status}).`
          );
        }
        const json = await res.json();
        if (!cancelled) {
          setMeta(json);
          const years: string[] = json.availableTimelines;
          const last = years[years.length - 1];
          setSelectedTimeline((cur) => cur ?? last);
          setCompareFromYear((cur) => cur ?? years[0]);
          setCompareToYear((cur) => cur ?? last);
        }
      } catch (e) {
        if (!cancelled) setApiError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const years = meta?.availableTimelines ?? [];

  const ensureYearLoaded = useCallback((year: string | null) => {
    if (!year) return;
    if (docCacheRef.current[year] || inflightYears.current.has(year)) return;
    inflightYears.current.add(year);
    setLoadingYears((l) => (l.includes(year) ? l : [...l, year]));
    let cancelled = false;
    fetchSnapshot(slug, year)
      .then((doc) => {
        if (!cancelled) {
          docCacheRef.current[year] = doc;
          setDocCache((c) => ({ ...c, [year]: doc }));
        }
      })
      .catch((e) => {
        if (!cancelled) setApiError(`Gagal memuat snapshot ${year}: ${e instanceof Error ? e.message : String(e)}`);
      })
      .finally(() => {
        if (!cancelled) {
          inflightYears.current.delete(year);
          setLoadingYears((l) => l.filter((y) => y !== year));
        }
      });
  }, [slug]);

  // 2. Rekonstruksi snapshot point-in-time dari API (bukan engine di browser)
  useEffect(() => { ensureYearLoaded(selectedTimeline); }, [selectedTimeline, ensureYearLoaded]);
  useEffect(() => {
    if (isCompareMode) {
      ensureYearLoaded(compareFromYear);
      ensureYearLoaded(compareToYear);
    }
  }, [isCompareMode, compareFromYear, compareToYear, ensureYearLoaded]);

  const currentDoc = selectedTimeline ? docCache[selectedTimeline] : undefined;
  const docFrom = compareFromYear ? docCache[compareFromYear] : undefined;
  const docTo = compareToYear ? docCache[compareToYear] : undefined;

  // Flatten daftar pasal untuk navigasi sidebar
  const allArticles = useMemo(() => {
    if (!currentDoc) return [];
    const list: { node: ProvisionNode; chapterLabel: string }[] = [];
    for (const chapter of currentDoc.nodes) {
      if (chapter.type === 'BAB' && chapter.children) {
        for (const child of chapter.children) {
          if (child.type === 'PASAL') {
            list.push({ node: child, chapterLabel: chapter.label });
          }
        }
      }
    }
    return list;
  }, [currentDoc]);

  // 3. Inspector: diff per node dihitung server-side via API
  const handleOpenInspector = async (node: ProvisionNode, parentLabel?: string) => {
    if (!selectedTimeline) return;
    setActiveNodePath(node.canonicalPath);
    setInspectorNode({
      canonicalPath: node.canonicalPath,
      label: node.label,
      parentLabel,
      status: 'MEMUAT…',
      versionTag: node.versionTag,
      isRepealed: node.isRepealed,
      repealBasis: node.repealBasis,
      fromText: '…',
      toText: '…',
      diff: {
        targetPath: node.canonicalPath,
        sourceVersion: '',
        targetVersion: '',
        isContentIdentical: false,
        tokens: [],
        addedCount: 0,
        removedCount: 0,
        unchangedCount: 0,
        similarityRatio: 0,
      } as ProvisionDiffResult,
      loading: true,
    });

    try {
      const baseYear = years[0] ?? '2008';
      const res = await fetch(
        `${API_BASE}/api/v1/provisions/diff?slug=${slug}&path=${encodeURIComponent(node.canonicalPath)}&fromYear=${baseYear}&toYear=${selectedTimeline}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const baselineMissing = !json.nodeFrom;
      const status = node.isRepealed
        ? 'DICABUT / DIHAPUS'
        : baselineMissing
          ? 'PASAL SISIPAN BARU'
          : node.versionTag.startsWith('AMENDED')
            ? 'DIUBAH REDAKSI'
            : 'BERLAKU';

      setInspectorNode({
        canonicalPath: node.canonicalPath,
        label: node.label,
        parentLabel,
        status,
        amendedBy: node.isRepealed
          ? node.repealBasis || 'UU Pengubah'
          : baselineMissing || node.versionTag.startsWith('AMENDED')
            ? 'UU Pengubah'
            : undefined,
        versionTag: node.versionTag,
        isRepealed: node.isRepealed,
        repealBasis: node.repealBasis,
        fromText: json.textFrom ?? '(Belum ada pada naskah asli)',
        toText: json.textTo ?? node.content,
        diff: json.diff,
        loading: false,
      });
    } catch (e) {
      setApiError(`Gagal menghitung diff: ${e instanceof Error ? e.message : String(e)}`);
      setInspectorNode(null);
    }
  };

  const timelineTitle = (year: string): string => {
    if (!meta) return '';
    if (String(meta.year) === year) return `Naskah Asli (${meta.shortTitle ?? `UU No. ${meta.number}/${meta.year}`})`;
    const amend = meta.amendments.find(
      (a) => String(new Date(a.effectiveFrom).getUTCFullYear()) === year
    );
    return amend ? `Naskah Konsolidasi Pasca ${amend.amendingInstrument}` : `Naskah Konsolidasi (per ${year})`;
  };

  // ---------- Guard: error / loading ----------
  if (apiError && !meta) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-paper gap-4 p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-seal" />
        <h1 className="font-bold text-lg text-ink">Data Tidak Dapat Dimuat</h1>
        <p className="text-sm text-ink-mute max-w-md">{apiError}</p>
        <Link href="/" className="text-xs font-semibold text-seal hover:underline">
          ← Kembali ke beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-paper overflow-hidden">
      {/* Banner error API (non-blokir) */}
      {apiError && meta && (
        <div className="bg-seal-wash border-b border-seal/20 text-seal-deep text-xs font-semibold px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {apiError}
        </div>
      )}

      {/* Top Header */}
      <header className="h-14 bg-white border-b border-ink/10 px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg hover:bg-paper text-ink-mute transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display font-semibold text-sm text-ink leading-tight">
              {meta ? `UU No. ${meta.number} Tahun ${meta.year}${meta.shortTitle ? ` (${meta.shortTitle})` : ''}` : 'Memuat…'}
            </h1>
            <p className="text-xs text-ink-mute flex items-center gap-1.5">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${meta?.status === 'BERLAKU' ? 'bg-sage' : 'bg-brass'}`}></span>
              {selectedTimeline ? timelineTitle(selectedTimeline) : 'Menghubungkan ke API…'}
            </p>
          </div>
        </div>

        {/* Timeline Switcher (Point-in-Time Engine via API) */}
        {!isCompareMode ? (
          <div className="flex items-center gap-1 bg-paper p-1 rounded-lg border border-ink/10 text-xs font-semibold">
            <span className="text-ink-faint px-2 text-2xs uppercase">Titik Waktu:</span>
            {years.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedTimeline(year)}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  selectedTimeline === year
                    ? 'bg-ink text-paper shadow-2xs font-bold'
                    : 'text-ink-mute hover:text-ink'
                }`}
              >
                {String(meta?.year) === year ? `${year} (Asli)` : year}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-brass-wash px-3 py-1.5 rounded-lg border border-brass/40 text-xs font-semibold text-ink">
            <SplitSquareVertical className="w-4 h-4 text-seal" />
            <span>Mode Komparasi:</span>
            <select
              value={compareFromYear ?? ''}
              onChange={(e) => setCompareFromYear(e.target.value)}
              className="bg-white border border-ink/15 rounded px-1.5 py-0.5 text-xs font-medium cursor-pointer"
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <span>vs</span>
            <select
              value={compareToYear ?? ''}
              onChange={(e) => setCompareToYear(e.target.value)}
              className="bg-white border border-ink/15 rounded px-1.5 py-0.5 text-xs font-medium cursor-pointer"
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCompareMode(!isCompareMode)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
              isCompareMode
                ? 'bg-ink text-paper border-ink'
                : 'bg-white text-ink-soft hover:bg-paper-deep border-ink/10'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            {isCompareMode ? 'Tutup Komparasi' : 'Bandingkan Versi'}
          </button>
          <Link
            href={`/neuron?id=${slug}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink text-paper hover:bg-ink-soft border border-ink/15 text-xs font-semibold transition-colors"
          >
            <Network className="w-3.5 h-3.5 text-seal" />
            Peta Silsilah
          </Link>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Kiri: Daftar Isi Hierarki */}
        <aside className="w-72 bg-white border-r border-ink/10 flex flex-col shrink-0">
          <div className="p-3 border-b border-ink/5 font-semibold text-xs text-ink-mute uppercase tracking-wider flex items-center justify-between">
            <span>Daftar Isi Norma</span>
            <span className="text-2xs bg-paper px-1.5 py-0.5 rounded text-ink-mute">
              {allArticles.length} Pasal
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 text-sm">
            {allArticles.map(({ node, chapterLabel }) => (
              <button
                key={node.canonicalPath}
                onClick={() => setActiveNodePath(node.canonicalPath)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  activeNodePath === node.canonicalPath
                    ? 'bg-seal-wash text-seal-deep font-bold'
                    : 'text-ink-soft hover:bg-paper-deep'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span>{node.label}</span>
                  {node.title && (
                    <span className="text-ink-faint font-normal truncate max-w-[110px]">
                      - {node.title}
                    </span>
                  )}
                </div>
                {node.isRepealed && (
                  <span className="text-2xs px-1.5 py-0.5 rounded bg-seal-wash text-seal-deep border border-seal/20 shrink-0">
                    Dihapus
                  </span>
                )}
                {!node.isRepealed && node.versionTag.startsWith('AMENDMENT_2024') && (
                  <span className="text-2xs px-1.5 py-0.5 rounded bg-sage-wash text-sage border border-sage/25 shrink-0">
                    Baru 2024
                  </span>
                )}
                {!node.isRepealed && node.versionTag.startsWith('AMENDED') && (
                  <span className="text-2xs px-1.5 py-0.5 rounded bg-brass-wash text-brass border border-brass/30 shrink-0">
                    Diubah
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Center: Tempat Baca Naskah atau Side-by-Side Diff */}
        {!isCompareMode ? (
          <main className="flex-1 overflow-y-auto p-8 flex justify-center bg-paper">
            {!currentDoc ? (
              <div className="flex items-center justify-center w-full">
                <span className="text-sm text-ink-mute animate-pulse">Merekonstruksi naskah konsolidasi dari API…</span>
              </div>
            ) : (
            <div className="max-w-3xl w-full bg-white rounded-none shadow-sheet border border-ink/10 p-10 min-h-[800px]">
              <div className="text-center pb-8 border-b border-ink/5 mb-8">
                <h2 className="text-xs font-bold tracking-widest text-ink-faint uppercase">
                  Republik Indonesia
                </h2>
                <h3 className="font-display text-xl font-semibold text-ink mt-1">
                  {meta ? `Undang-Undang Nomor ${meta.number} Tahun ${meta.year}` : ''}
                </h3>
                <p className="text-xs text-ink-mute mt-1">
                  {selectedTimeline ? timelineTitle(selectedTimeline) : ''}
                </p>
                {currentDoc.activeAmendingInstruments.length > 0 && (
                  <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap">
                    <span className="text-2xs text-ink-faint">Instrumen Pengubah Aktif:</span>
                    {currentDoc.activeAmendingInstruments.map((inst, idx) => (
                      <span key={idx} className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-seal-wash text-seal-deep border border-ink/15">
                        {inst}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Naskah Pasal-Pasal */}
              <div className="space-y-10 text-ink leading-relaxed">
                {currentDoc.nodes.map((chapter) => (
                  <div key={chapter.canonicalPath} className="space-y-6">
                    <div className="text-center py-2 bg-paper-deep rounded-lg border border-ink/10">
                      <span className="font-extrabold text-xs text-ink-soft uppercase tracking-wide block">
                        {chapter.label}
                      </span>
                      {chapter.title && (
                        <span className="font-display text-sm font-semibold text-ink block mt-0.5">
                          {chapter.title}
                        </span>
                      )}
                    </div>

                    {chapter.children?.map((pasal) => (
                      <div
                        key={pasal.canonicalPath}
                        id={pasal.canonicalPath}
                        className={`p-4 rounded-none transition-all ${
                          activeNodePath === pasal.canonicalPath ? 'ring-2 ring-seal/15 bg-seal-wash/40' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-display font-semibold text-ink text-lg flex items-center gap-2">
                            {pasal.label}
                            {pasal.title && <span className="text-sm font-semibold text-ink-mute">({pasal.title})</span>}
                            {pasal.isRepealed && (
                              <span className="text-2xs font-bold px-2 py-0.5 rounded bg-seal text-paper">
                                Dihapus
                              </span>
                            )}
                            {pasal.versionTag.startsWith('AMENDMENT_2024') && (
                              <span className="text-2xs font-bold px-2 py-0.5 rounded bg-sage text-paper">
                                Sisipan Baru (UU 1/2024)
                              </span>
                            )}
                          </span>
                          <button
                            onClick={() => handleOpenInspector(pasal, chapter.label)}
                            className="text-xs text-seal hover:text-seal-deep font-semibold cursor-pointer"
                          >
                            Inspeksi Perubahan ➔
                          </button>
                        </div>

                        {pasal.children && pasal.children.length > 0 ? (
                          <div className="space-y-3 pl-2">
                            {pasal.children.map((ayat) => (
                              <div
                                key={ayat.canonicalPath}
                                onClick={() => handleOpenInspector(ayat, pasal.label)}
                                className={`flex items-start gap-3 p-2.5 rounded-lg group transition-colors cursor-pointer ${
                                  ayat.isRepealed
                                    ? 'bg-seal-wash border border-seal/20 text-seal-deep'
                                    : 'hover:bg-paper-deep'
                                }`}
                              >
                                <span className="font-bold text-ink-soft shrink-0 select-none text-sm">
                                  {ayat.label}
                                </span>
                                <div className="flex-1">
                                  <p className={`font-serif text-[15px] leading-relaxed ${ayat.isRepealed ? 'line-through text-seal-deep font-medium' : ''}`}>
                                    {ayat.content}
                                  </p>
                                  {ayat.isRepealed && (
                                    <div className="mt-1 text-xs font-semibold text-seal-deep flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      {ayat.repealBasis || 'Ketentuan norma ini dicabut'}
                                    </div>
                                  )}
                                  {ayat.explanation && (
                                    <div className="mt-2 pt-2 border-t border-ink/5 text-xs text-ink-mute bg-paper-deep p-2 rounded">
                                      <span className="font-semibold text-ink-soft">Penjelasan: </span>
                                      {ayat.explanation}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="font-serif text-[15px] leading-relaxed pl-2">{pasal.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            )}
          </main>
        ) : (
          /* Side-by-Side Compare Mode */
          <main className="flex-1 overflow-y-auto p-6 bg-paper">
            {!docFrom || !docTo ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-sm text-ink-mute animate-pulse">Memuat kedua versi untuk komparasi…</span>
              </div>
            ) : (
            <div className="grid grid-cols-2 gap-6 max-w-6xl mx-auto">
              {/* Kolom Kiri: Versi Basis */}
              <div className="bg-white rounded-none shadow-sheet border border-ink/10 p-6 min-h-[700px]">
                <div className="pb-4 border-b border-ink/10 mb-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-seal-deep uppercase tracking-wide block">
                      Versi Basis (Sebelumnya)
                    </span>
                    <h3 className="font-bold text-base text-ink">
                      Tahun {compareFromYear}
                    </h3>
                  </div>
                  <span className="text-2xs px-2 py-1 rounded bg-seal-wash text-seal-deep font-semibold border border-seal/20">
                    Baseline
                  </span>
                </div>
                <div className="space-y-6">
                  {docFrom.nodes.map((ch) => (
                    <div key={ch.canonicalPath} className="space-y-4">
                      <div className="font-bold text-xs text-ink-mute bg-paper-deep p-2 rounded">
                        {ch.label}: {ch.title}
                      </div>
                      {ch.children?.map((p) => (
                        <div key={p.canonicalPath} className="p-3 bg-paper-deep/50 rounded-lg border border-ink/10">
                          <span className="font-bold text-sm block mb-1 text-ink">{p.label}</span>
                          {p.children && p.children.length > 0 ? (
                            <div className="space-y-2">
                              {p.children.map((a) => (
                                <div key={a.canonicalPath} className="text-xs text-ink-soft">
                                  <span className="font-semibold mr-1">{a.label}</span>
                                  <span>{a.content}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-ink-soft">{p.content}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Kolom Kanan: Versi Banding (Baru) */}
              <div className="bg-white rounded-none shadow-sheet border border-ink/10 p-6 min-h-[700px]">
                <div className="pb-4 border-b border-ink/10 mb-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-sage uppercase tracking-wide block">
                      Versi Konsolidasi (Terkini)
                    </span>
                    <h3 className="font-bold text-base text-ink">
                      Tahun {compareToYear}
                    </h3>
                  </div>
                  <span className="text-2xs px-2 py-1 rounded bg-sage-wash text-sage font-semibold border border-sage/25">
                    Amandemen
                  </span>
                </div>
                <div className="space-y-6">
                  {docTo.nodes.map((ch) => (
                    <div key={ch.canonicalPath} className="space-y-4">
                      <div className="font-bold text-xs text-ink-mute bg-paper-deep p-2 rounded">
                        {ch.label}: {ch.title}
                      </div>
                      {ch.children?.map((p) => (
                        <div key={p.canonicalPath} className="p-3 bg-paper-deep/50 rounded-lg border border-ink/10">
                          <span className="font-bold text-sm block mb-1 text-ink flex items-center gap-2">
                            {p.label}
                            {p.isRepealed && <span className="text-2xs bg-seal text-paper px-1.5 py-0.5 rounded">Dihapus</span>}
                            {p.versionTag.startsWith('AMENDMENT_2024') && <span className="text-2xs bg-sage text-paper px-1.5 py-0.5 rounded">Sisipan Baru</span>}
                          </span>
                          {p.children && p.children.length > 0 ? (
                            <div className="space-y-2">
                              {p.children.map((a) => (
                                <div key={a.canonicalPath} className="text-xs text-ink-soft">
                                  <span className="font-semibold mr-1">{a.label}</span>
                                  <span className={a.isRepealed ? 'line-through text-seal-deep' : ''}>{a.content}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-ink-soft">{p.content}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )}
          </main>
        )}

        {/* Sidebar Kanan (Inspector Detail Perubahan via API Diff) */}
        {inspectorNode && (
          <aside className="w-96 bg-white border-l border-ink/10 flex flex-col shrink-0 shadow-lift z-10 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-ink/10 flex items-center justify-between bg-paper-deep">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-seal" />
                <span className="font-bold text-xs text-ink uppercase tracking-wide">
                  Inspektor Perubahan
                </span>
              </div>
              <button
                onClick={() => setInspectorNode(null)}
                className="p-1 rounded hover:bg-paper-edge text-ink-mute transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
              {/* Identitas Perubahan */}
              <div>
                <h4 className="font-display font-semibold text-base text-ink">
                  {inspectorNode.label} {inspectorNode.parentLabel ? `(${inspectorNode.parentLabel})` : ''}
                </h4>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-block px-2.5 py-1 rounded bg-paper text-ink font-bold border border-ink/10">
                    Status: {inspectorNode.status}
                  </span>
                  {!inspectorNode.loading && (
                    <span className="inline-block px-2 py-1 rounded bg-seal-wash text-seal-deep font-semibold border border-seal/20">
                      Skor Kesamaan: {Math.round(inspectorNode.diff.similarityRatio * 100)}%
                    </span>
                  )}
                </div>
              </div>

              {inspectorNode.loading ? (
                <div className="text-ink-mute animate-pulse">Menghitung diff di server…</div>
              ) : (
                <>
                  {/* Provenance Box */}
                  <div className="bg-paper-deep border border-ink/10 rounded-lg p-3.5 space-y-2">
                    <div>
                      <span className="text-ink-faint block text-2xs">Versi Tag:</span>
                      <span className="font-bold text-ink">{inspectorNode.versionTag}</span>
                    </div>
                    {inspectorNode.amendedBy && (
                      <div>
                        <span className="text-ink-faint block text-2xs">Dasar Amandemen:</span>
                        <span className="font-semibold text-ink-soft">{inspectorNode.amendedBy}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-ink-faint block text-2xs">Perubahan Token:</span>
                      <span className="text-ink-soft">
                        +{inspectorNode.diff.addedCount} kata baru, -{inspectorNode.diff.removedCount} kata dihapus
                      </span>
                    </div>
                  </div>

                  {/* Tokenized Visual Diff Highlighting */}
                  <div>
                    <span className="font-bold text-ink-soft block mb-2">
                      Visual Word-Level Diff (Zero-Loss):
                    </span>
                    <div className="p-3.5 rounded-lg bg-paper-deep border border-ink/10 text-ink font-sans text-xs leading-relaxed">
                      {inspectorNode.diff.tokens.map((token, idx) => {
                        if (token.type === 'removed') {
                          return (
                            <span key={idx} className="bg-seal text-paper line-through px-1 py-0.5 rounded mr-0.5 font-medium">
                              {token.value}
                            </span>
                          );
                        }
                        if (token.type === 'added') {
                          return (
                            <span key={idx} className="bg-sage text-paper px-1 py-0.5 rounded mr-0.5 font-semibold">
                              {token.value}
                            </span>
                          );
                        }
                        return <span key={idx}>{token.value}</span>;
                      })}
                    </div>
                  </div>

                  {/* Raw Comparison */}
                  <div>
                    <span className="font-bold text-ink-soft block mb-2">Komparasi Mentah:</span>
                    <div className="space-y-2">
                      <div className="p-3 rounded-lg bg-seal-wash border border-seal/20 text-seal-deep font-mono text-2xs leading-relaxed">
                        <span className="font-bold text-seal-deep block mb-1">[-] SEBELUMNYA ({years[0] ?? '2008'}):</span>
                        {inspectorNode.fromText}
                      </div>
                      <div className="p-3 rounded-lg bg-sage-wash border border-sage/25 text-sage font-mono text-2xs leading-relaxed">
                        <span className="font-bold text-sage block mb-1">{'{+}'} KONSOLIDASI ({selectedTimeline}):</span>
                        {inspectorNode.toText}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Action Button */}
              <div className="pt-2 border-t border-ink/10">
                <button
                  onClick={() => alert(`Analisis Yuridis AI untuk ${inspectorNode.label} siap dieksekusi!`)}
                  className="w-full py-2.5 px-3 rounded-lg bg-ink hover:bg-ink-soft text-white font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sheet"
                >
                  <Sparkles className="w-4 h-4" />
                  Analisis Delik Yuridis AI
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

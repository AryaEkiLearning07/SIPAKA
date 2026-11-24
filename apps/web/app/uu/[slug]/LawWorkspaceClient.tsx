'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, Download, FileText } from 'lucide-react';
import { ConsolidatedLawDocument } from '@sipaka/types';
import { OpsRow } from './reader-types';
import {
  API_BASE, InstrumentMeta, InstrumentRelationsData,
  fetchSnapshot,
} from './reader-types';
import ReaderHeader from './components/reader/ReaderHeader';
import ReaderToc from './components/reader/ReaderToc';
import NaskahKop from './components/reader/NaskahKop';
import NaskahPasal from './components/reader/NaskahPasal';
import NaskahFooter from './components/reader/NaskahFooter';
import InspectorPanel from './components/reader/InspectorPanel';
import ReaderModals from './components/reader/ReaderModals';
import { useInspector } from './use-inspector';

export interface LawWorkspaceClientProps {
  slug: string;
  focusPath?: string | null;
  initialMeta: InstrumentMeta | null;
  initialDoc: ConsolidatedLawDocument | null;
  initialTimeline: string | null;
  initialOperations: OpsRow[];
  initialRelations: InstrumentRelationsData | null;
  initialApiError: string | null;
}

export default function LawWorkspaceClient(props: LawWorkspaceClientProps) {
  const { slug, focusPath } = props;

  const [meta, setMeta] = useState<InstrumentMeta | null>(props.initialMeta);
  const [apiError, setApiError] = useState<string | null>(props.initialApiError);
  const [docCache, setDocCache] = useState<Record<string, ConsolidatedLawDocument>>(
    props.initialTimeline && props.initialDoc ? { [props.initialTimeline]: props.initialDoc } : {}
  );
  const [loadingYears, setLoadingYears] = useState<string[]>([]);
  const docCacheRef = useRef<Record<string, ConsolidatedLawDocument>>(
    props.initialTimeline && props.initialDoc ? { [props.initialTimeline]: props.initialDoc } : {}
  );
  const inflightYears = useRef<Set<string>>(new Set());

  const [selectedTimeline, setSelectedTimeline] = useState<string | null>(props.initialTimeline);
  const [activeNodePath, setActiveNodePath] = useState<string>('');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [fontType, setFontType] = useState<'serif' | 'sans'>('serif');
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
  const [copiedCitation, setCopiedCitation] = useState<boolean>(false);
  const [operations, setOperations] = useState<OpsRow[]>(props.initialOperations);
  const [relations, setRelations] = useState<InstrumentRelationsData | null>(props.initialRelations);
  const [provisionVersions, setProvisionVersions] = useState<Record<string, 'CURRENT' | 'PREVIOUS'>>({});
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [showSplitDiffModal, setShowSplitDiffModal] = useState<boolean>(false);

  const inspector = useInspector(slug, selectedTimeline, meta?.availableTimelines ?? [], setActiveNodePath, operations);

  // Operasi perubahan instrumen (jika belum ada dari SSR)
  useEffect(() => {
    if (operations.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/instruments/${slug}/operations`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setOperations(json.operations ?? []);
      } catch { /* abaikan */ }
    })();
    return () => { cancelled = true; };
  }, [slug, operations.length]);

  // Relasi instrumen (jika belum ada dari SSR)
  useEffect(() => {
    if (relations) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/instruments/${slug}/relations`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setRelations(json.relations ?? null);
      } catch { /* abaikan */ }
    })();
    return () => { cancelled = true; };
  }, [slug, relations]);

  // Sesi pengguna
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          if (!cancelled && json?.user) setCurrentUser(json.user);
        }
      } catch { /* belum masuk */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Metadata peraturan jika belum ada dari SSR
  useEffect(() => {
    if (meta) return;
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
          setSelectedTimeline((cur) => cur ?? years[years.length - 1]);
        }
      } catch (e) {
        if (!cancelled) setApiError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [slug, meta]);

  const years = meta?.availableTimelines ?? [];

  const ensureYearLoaded = useCallback(
    async (year: string | null) => {
      if (!year || docCacheRef.current[year] || inflightYears.current.has(year)) return;
      inflightYears.current.add(year);
      setLoadingYears((prev) => (prev.includes(year) ? prev : [...prev, year]));
      try {
        const doc = await fetchSnapshot(slug, year);
        docCacheRef.current = { ...docCacheRef.current, [year]: doc };
        setDocCache((prev) => ({ ...prev, [year]: doc }));
      } catch (e) {
        setApiError(e instanceof Error ? e.message : String(e));
      } finally {
        inflightYears.current.delete(year);
        setLoadingYears((prev) => prev.filter((y) => y !== year));
      }
    },
    [slug]
  );

  useEffect(() => { ensureYearLoaded(selectedTimeline); }, [selectedTimeline, ensureYearLoaded]);

  const currentDoc = selectedTimeline ? docCache[selectedTimeline] : undefined;

  const pasalCount = useMemo(() => {
    if (!currentDoc) return 0;
    return currentDoc.nodes.reduce(
      (n, ch) => n + (ch.children ?? []).filter((c) => c.type === 'PASAL').length,
      0
    );
  }, [currentDoc]);

  const scrollToNode = useCallback((path: string) => {
    requestAnimationFrame(() => {
      const el = document.getElementById(`node-${path}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.add('bg-amber-100/90');
        setTimeout(() => el.classList.remove('bg-amber-100/90'), 1500);
      }
    });
  }, []);

  // Auto-scroll ke pasal tertentu saat halaman dibuka dari tautan hasil pencarian
  useEffect(() => {
    if (focusPath && currentDoc) {
      const timer = setTimeout(() => {
        scrollToNode(focusPath);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [focusPath, currentDoc, scrollToNode]);

  const salinSitasi = (node: { label: string }) => {
    const amenderText = meta?.amendments?.length
      ? meta.amendments.map((a) => `jo. ${a.amendingInstrument}`).join(' ')
      : '';
    const lnInfo = meta?.lnNumber
      ? `(LN RI Tahun ${meta.year} No. ${meta.lnNumber}${meta.tlnNumber ? `, TLN No. ${meta.tlnNumber}` : ''})`
      : '';
    const instTitle = meta?.shortTitle || `${meta?.type ?? 'Peraturan'} No. ${meta?.number ?? ''} Tahun ${meta?.year ?? ''}`.trim();
    const citation = `${node.label} ${instTitle} tentang ${meta?.title ?? ''} ${amenderText} ${lnInfo}`.replace(/\s+/g, ' ').trim();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(citation);
      setCopiedCitation(true);
      setTimeout(() => setCopiedCitation(false), 2200);
    }
  };

  // Resolusi target induk jika dokumen adalah instrumen amandemen
  const parentTarget = useMemo(() => {
    if (!relations?.outgoing?.length) return null;
    const amenderRel = relations.outgoing.find((o) => o.jenis === 'MENGUBAH');
    return amenderRel?.target ?? relations.outgoing[0]?.target ?? null;
  }, [relations]);

  // ---------- Guard: error / loading ----------
  if (apiError && !meta && !currentDoc) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 p-8 text-center font-sans">
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <h1 className="font-bold text-lg text-slate-900">Data Peraturan Tidak Dapat Dimuat</h1>
        <p className="text-sm text-slate-600 max-w-md">{apiError}</p>
        <Link href="/katalog" className="text-xs font-semibold text-[#94191C] hover:underline">
          ← Kembali ke Katalog Regulasi
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100/70 overflow-hidden font-sans text-slate-800">
      <ReaderHeader
        meta={meta} slug={slug} currentUser={currentUser}
        selectedTimeline={selectedTimeline} setSelectedTimeline={setSelectedTimeline}
        years={years} showRiwayat={false} isCompareMode={false}
        fontSize={fontSize} setFontSize={setFontSize}
        fontType={fontType} setFontType={setFontType}
        showAnnotations={showAnnotations} setShowAnnotations={setShowAnnotations}
      />

      <div className="flex-1 flex overflow-hidden">
        <ReaderToc
          currentDoc={currentDoc}
          pasalCount={pasalCount}
          activeNodePath={activeNodePath}
          setActiveNodePath={setActiveNodePath}
          scrollToNode={scrollToNode}
        />

        {/* Bagian Tengah: Workspace Baca Berstandar Arsip Negara */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#EEF2F6] overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10 flex flex-col items-center scroll-smooth relative">
            {!currentDoc ? (
              <div className="flex items-center justify-center w-full my-auto">
                <span className="text-sm font-medium text-slate-500 animate-pulse bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-xs">
                  Merekonstruksi naskah konsolidasi deterministik…
                </span>
              </div>
            ) : (
              <div className="max-w-4xl w-full bg-white shadow-xl rounded-2xl border border-slate-200/90 px-8 sm:px-14 lg:px-20 py-12 sm:py-16 text-slate-800 mb-12">
                <NaskahKop meta={meta} fontType={fontType} />

                {currentDoc.nodes.length === 0 ? (
                  <div className="my-10 space-y-6">
                    {parentTarget ? (
                      /* Dokumen Amandemen yang Mengubah UU Pokok */
                      <div className="p-6 sm:p-8 bg-amber-50/70 border border-amber-200/90 rounded-2xl text-slate-800 space-y-5 shadow-xs">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-md bg-[#94191C] text-white text-[11px] font-mono font-bold uppercase tracking-wider">
                              Instrumen Regulasi Amandemen
                            </span>
                            <span className="text-xs font-semibold text-amber-900">
                              {meta?.type} No. {meta?.number} Tahun {meta?.year}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Hukum Positif Terintegrasi</span>
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-sans font-bold text-lg text-slate-900 leading-snug">
                            Naskah Telah Dikodifikasikan ke Dalam Undang-Undang Pokok (Induk)
                          </h3>
                          <p className="text-xs text-slate-700 leading-relaxed text-justify">
                            {meta?.type} Nomor {meta?.number} Tahun {meta?.year} merupakan regulasi perubahan materiil yang mengubah, menambah, atau mencabut norma-norma tertentu. Berdasarkan tata perundang-undangan Republik Indonesia, naskah hukum positif yang berlaku dibaca secara utuh pada naskah konsolidasi Undang-Undang Pokok:
                          </p>
                        </div>

                        <div className="p-4 bg-white rounded-xl border border-amber-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                              Undang-Undang Pokok yang Diubah:
                            </span>
                            <h4 className="font-sans font-bold text-sm text-slate-900 mt-0.5">
                              {parentTarget.type} No. {parentTarget.number} Tahun {parentTarget.year} tentang {parentTarget.title}
                            </h4>
                            {parentTarget.shortTitle && (
                              <span className="text-xs text-slate-500 font-medium">({parentTarget.shortTitle})</span>
                            )}
                          </div>
                          <Link
                            href={`/uu/${parentTarget.slug}?point=${meta?.year}`}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white font-bold text-xs shadow-sm hover:shadow transition-all shrink-0 cursor-pointer"
                          >
                            <span>Buka Naskah Konsolidasi ({meta?.year})</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>

                        <div className="p-4 bg-white/80 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                          <span className="font-mono text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                            Struktur Ketentuan Peralihan &amp; Penutup:
                          </span>
                          <div className="space-y-1.5 text-slate-700 leading-relaxed">
                            <p>
                              <strong className="text-slate-900">Pasal I:</strong> Beberapa ketentuan dalam Undang-Undang {parentTarget?.type ?? 'Pokok'} diubah, disisipkan norma baru, dan/atau dihapus sebagaimana tercantum dalam naskah perubahan.
                            </p>
                            <p>
                              <strong className="text-slate-900">Pasal II:</strong> Undang-Undang ini mulai berlaku pada tanggal diundangkan. Agar setiap orang mengetahuinya, memerintahkan pengundangan Undang-Undang ini dengan penempatannya dalam Lembaran Negara Republik Indonesia.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Dokumen Resmi Arsip Negara (Salinan Otentik Lembaran Negara RI / PDF Viewer) */
                      <div className="p-6 sm:p-8 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 space-y-6 shadow-xs">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-white text-[11px] font-mono font-bold uppercase tracking-wider">
                              Salinan Otentik Lembaran Negara
                            </span>
                            <span className="text-xs font-semibold text-slate-700">
                              {meta?.type} No. {meta?.number} Tahun {meta?.year}
                            </span>
                          </div>
                          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                            meta?.status === 'BERLAKU'
                              ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                              : 'text-amber-800 bg-amber-50 border-amber-200'
                          }`}>
                            Status: {meta?.status ?? 'BERLAKU'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-sans font-bold text-lg text-slate-900 leading-snug">
                            Salinan Otentik Lembaran Negara Republik Indonesia
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed text-justify">
                            Peraturan ini tercatat sah dalam arsip nasional Lembaran Negara RI. Anda dapat meneliti salinan resmi terverifikasi secara utuh langsung melalui penampil dokumen di bawah ini:
                          </p>
                        </div>

                        {meta?.pdfUrl ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex-wrap">
                              <div>
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                                  Sumber Dokumen Resmi
                                </span>
                                <h4 className="font-sans font-bold text-sm text-slate-900 mt-0.5">
                                  {meta.type} Nomor {meta.number} Tahun {meta.year}
                                </h4>
                              </div>
                              <a
                                href={meta.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                              >
                                <Download className="w-4 h-4" />
                                <span>Unduh PDF Resmi</span>
                              </a>
                            </div>

                            {/* Penampil PDF tersemat langsung agar tidak kosong */}
                            <div className="w-full h-[650px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
                              <iframe
                                src={`${meta.pdfUrl}#toolbar=1`}
                                className="w-full h-full border-0"
                                title="Salinan Otentik Lembaran Negara RI"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                            Naskah sedang disinkronkan dari repositori dokumen resmi negara.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <NaskahPasal
                    currentDoc={currentDoc}
                    showAnnotations={showAnnotations}
                    activeNodePath={activeNodePath}
                    operations={operations}
                    selectedTimeline={selectedTimeline}
                    baseYear={meta?.year}
                    provisionVersions={provisionVersions}
                    setProvisionVersions={setProvisionVersions}
                    fontSize={fontSize}
                    fontType={fontType}
                    handleOpenInspector={inspector.handleOpenInspector}
                  />
                )}
                <NaskahFooter meta={meta} />
              </div>
            )}
          </main>
        </section>

        {inspector.inspectorNode && (
          <InspectorPanel
            inspectorNode={inspector.inspectorNode}
            setInspectorNode={inspector.setInspectorNode}
            setActiveNodePath={setActiveNodePath}
            inspectorTab={inspector.inspectorTab}
            setInspectorTab={inspector.setInspectorTab}
            handleOpenInspector={inspector.handleOpenInspector}
            scrollToNode={scrollToNode}
            operations={operations}
            relations={relations}
            copiedCitation={copiedCitation}
            salinSitasi={salinSitasi}
            currentUser={currentUser}
            setShowLoginPrompt={setShowLoginPrompt}
            setShowAiModal={setShowAiModal}
            setShowSplitDiffModal={setShowSplitDiffModal}
          />
        )}
      </div>

      <ReaderModals
        showLoginPrompt={showLoginPrompt} setShowLoginPrompt={setShowLoginPrompt}
        showAiModal={showAiModal} setShowAiModal={setShowAiModal}
        showSplitDiffModal={showSplitDiffModal} setShowSplitDiffModal={setShowSplitDiffModal}
        inspectorNode={inspector.inspectorNode} operations={operations}
        copiedCitation={copiedCitation} salinSitasi={salinSitasi}
        currentUser={currentUser}
      />
    </div>
  );
}

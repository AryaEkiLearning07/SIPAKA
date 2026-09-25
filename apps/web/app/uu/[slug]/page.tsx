'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { ConsolidatedLawDocument } from '@lexvera/types';
import {
  API_BASE, InstrumentMeta, LedgerChangeSet,
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
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [fontType, setFontType] = useState<'serif' | 'sans'>('serif');
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
  const [copiedCitation, setCopiedCitation] = useState<boolean>(false);
  const [provisionVersions, setProvisionVersions] = useState<Record<string, 'CURRENT' | 'PREVIOUS'>>({});
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [selectedImpact, setSelectedImpact] = useState<import('./impact-data').ImpactedRegulation | null>(null);
  const [copiedHarmonisasi, setCopiedHarmonisasi] = useState<boolean>(false);

  const inspector = useInspector(slug, selectedTimeline, meta?.availableTimelines ?? [], setActiveNodePath);

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
          setSelectedTimeline((cur) => cur ?? years[years.length - 1]);
        }
      } catch (e) {
        if (!cancelled) setApiError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

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
        el.classList.add('bg-indigo-50/80');
        setTimeout(() => el.classList.remove('bg-indigo-50/80'), 1500);
      }
    });
  }, []);

  const salinSitasi = (node: { label: string }) => {
    const amenderText = meta?.amendments?.length
      ? meta.amendments.map((a) => `jo. ${a.amendingInstrument}`).join(' ')
      : '';
    const lnInfo =
      meta?.year === 2008 && selectedTimeline === '2024'
        ? '(LN RI Tahun 2024 No. 8, TLN No. 6916)'
        : meta?.year === 2008 && selectedTimeline === '2016'
          ? '(LN RI Tahun 2016 No. 251, TLN No. 5952)'
          : meta?.year === 2008
            ? '(LN RI Tahun 2008 No. 58, TLN No. 4843)'
            : '';
    const citation = `${node.label} ${meta?.type ?? 'UU'} No. ${meta?.number ?? 11} Tahun ${meta?.year ?? 2008} ${amenderText} ${lnInfo}`.trim();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(citation);
      setCopiedCitation(true);
      setTimeout(() => setCopiedCitation(false), 2200);
    }
  };

  // ---------- Guard: error / loading ----------
  if (apiError && !meta) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 p-8 text-center font-sans">
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <h1 className="font-bold text-lg text-slate-900">Data Peraturan Tidak Dapat Dimuat</h1>
        <p className="text-sm text-slate-600 max-w-md">{apiError}</p>
        <Link href="/katalog" className="text-xs font-semibold text-indigo-600 hover:underline">
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
                <NaskahPasal
                  currentDoc={currentDoc}
                  showAnnotations={showAnnotations}
                  activeNodePath={activeNodePath}
                  provisionVersions={provisionVersions}
                  setProvisionVersions={setProvisionVersions}
                  fontSize={fontSize}
                  fontType={fontType}
                  handleOpenInspector={inspector.handleOpenInspector}
                />
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
            setSelectedImpact={setSelectedImpact}
            copiedCitation={copiedCitation}
            salinSitasi={salinSitasi}
            currentUser={currentUser}
            setShowLoginPrompt={setShowLoginPrompt}
            setShowAiModal={setShowAiModal}
          />
        )}
      </div>

      <ReaderModals
        showLoginPrompt={showLoginPrompt} setShowLoginPrompt={setShowLoginPrompt}
        showAiModal={showAiModal} setShowAiModal={setShowAiModal}
        selectedImpact={selectedImpact} setSelectedImpact={setSelectedImpact}
        copiedHarmonisasi={copiedHarmonisasi} setCopiedHarmonisasi={setCopiedHarmonisasi}
        inspectorNode={inspector.inspectorNode} currentUser={currentUser}
      />
    </div>
  );
}

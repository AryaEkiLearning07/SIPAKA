'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Network, GitBranch, AlertTriangle,
  X, Scale, ExternalLink, Sparkles, SplitSquareVertical,
  Layers, Check, FileText, ChevronRight, ChevronDown, History,
  Search, Copy, Lock, ShieldCheck, Printer, Bookmark, Info,
  Share2, Cpu
} from 'lucide-react';
import { ConsolidatedLawDocument, ProvisionNode, ProvisionDiffResult } from '@lexvera/types';
import {
  getProvisionAmendmentDetail,
  ImpactedRegulation,
  ProvisionAmendmentDetail
} from './impact-data';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface InstrumentMeta {
  slug: string;
  type: string;
  number: number;
  year: number;
  title: string;
  shortTitle?: string;
  status: string;
  source?: 'database' | 'engine-demo';
  availableTimelines: string[];
  amendments: { title: string; amendingInstrument: string; effectiveFrom: string }[];
}

interface RiwayatVersi {
  year: string;
  ada: boolean;
  isRepealed: boolean;
  versionTag: string | null;
  content: string | null;
}

interface LedgerOp {
  operationType: string;
  targetCanonicalPath: string;
  sourceReference: string;
  ringkas: string;
}

interface LedgerChangeSet {
  id: string;
  amendingInstrument: string;
  title: string;
  effectiveFrom: string;
  operations: LedgerOp[];
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
  riwayat?: RiwayatVersi[];
  amendmentDetail?: ProvisionAmendmentDetail;
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
  const [showRiwayat, setShowRiwayat] = useState<boolean>(false);
  const [ledger, setLedger] = useState<LedgerChangeSet[] | null>(null);
  const [compareFromYear, setCompareFromYear] = useState<string | null>(null);
  const [compareToYear, setCompareToYear] = useState<string | null>(null);

  // User session state
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);

  // Search filter for provisions
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Citation copy state
  const [copiedCitation, setCopiedCitation] = useState<boolean>(false);

  // Inspector State
  const [inspectorNode, setInspectorNode] = useState<InspectorState | null>(null);

  // Authenticated feature modals
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);

  // Modal baca perubahan regulasi terdampak
  const [selectedImpact, setSelectedImpact] = useState<ImpactedRegulation | null>(null);
  const [copiedHarmonisasi, setCopiedHarmonisasi] = useState<boolean>(false);

  // Fetch session user
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          if (!cancelled && json?.user) setCurrentUser(json.user);
        }
      } catch {
        /* belum masuk */
      }
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

  const ensureYearLoaded = useCallback(
    async (year: string | null) => {
      if (!year) return;
      if (docCacheRef.current[year]) return;
      if (inflightYears.current.has(year)) return;

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

  // Muat data ledger (buku besar perubahan) saat tab riwayat dibuka
  useEffect(() => {
    if (!showRiwayat || ledger) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/instruments/${slug}/ledger`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setLedger(json.changeSets ?? []);
      } catch (e) {
        if (!cancelled) setApiError(`Gagal memuat buku besar: ${e instanceof Error ? e.message : String(e)}`);
      }
    })();
    return () => { cancelled = true; };
  }, [showRiwayat, slug, ledger]);

  const bukaDariLedger = (path: string) => {
    setShowRiwayat(false);
    setActiveNodePath(path);
    scrollToNode(path);
  };

  // 2. Rekonstruksi snapshot point-in-time dari API
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

  // Hitungan jumlah pasal
  const pasalCount = useMemo(() => {
    if (!currentDoc) return 0;
    let n = 0;
    for (const chapter of currentDoc.nodes) {
      for (const child of chapter.children ?? []) {
        if (child.type === 'PASAL') n += 1;
      }
    }
    return n;
  }, [currentDoc]);

  // Filter nodes berdasarkan query pencarian di daftar isi
  const filteredNodes = useMemo(() => {
    if (!currentDoc) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentDoc.nodes;

    return currentDoc.nodes
      .map((bab) => {
        const babMatch =
          bab.label.toLowerCase().includes(q) ||
          (bab.title ? bab.title.toLowerCase().includes(q) : false);
        const matchingChildren = (bab.children ?? []).filter((pasal) => {
          const pasalMatch =
            pasal.label.toLowerCase().includes(q) ||
            (pasal.content ? pasal.content.toLowerCase().includes(q) : false);
          const ayatMatch = (pasal.children ?? []).some(
            (a) =>
              a.label.toLowerCase().includes(q) ||
              (a.content ? a.content.toLowerCase().includes(q) : false)
          );
          return pasalMatch || ayatMatch;
        });

        if (babMatch || matchingChildren.length > 0) {
          return {
            ...bab,
            children: babMatch && matchingChildren.length === 0 ? bab.children : matchingChildren,
          };
        }
        return null;
      })
      .filter(Boolean) as ProvisionNode[];
  }, [currentDoc, searchQuery]);

  // Saat mencari: buka otomatis seluruh BAB yang relevan
  useEffect(() => {
    if (searchQuery.trim() && currentDoc) {
      const allPaths = new Set<string>();
      currentDoc.nodes.forEach((b) => {
        allPaths.add(b.canonicalPath);
        (b.children ?? []).forEach((p) => allPaths.add(p.canonicalPath));
      });
      setExpanded(allPaths);
    }
  }, [searchQuery, currentDoc]);

  // Status buka-tutup daftar isi bertingkat (BAB → Pasal → Ayat → Huruf)
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleExpand = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  // Gulir area baca ke node yang dipilih dengan smooth scroll
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

  // Saat naskah termuat: buka BAB pertama sebagai titik awal daftar isi
  useEffect(() => {
    if (currentDoc && expanded.size === 0 && currentDoc.nodes.length > 0) {
      setExpanded(new Set([currentDoc.nodes[0].canonicalPath]));
    }
  }, [currentDoc, expanded.size]);

  // 3. Inspector: diff per node dihitung server-side via API & diintegrasikan dengan cascade regulasi terdampak
  const handleOpenInspector = async (node: ProvisionNode, parentLabel?: string) => {
    if (!selectedTimeline) return;
    setActiveNodePath(node.canonicalPath);
    const detail = getProvisionAmendmentDetail(node.canonicalPath, node.label);

    setInspectorNode({
      canonicalPath: node.canonicalPath,
      label: node.label,
      parentLabel,
      status: detail.statusBadge || 'MEMUAT…',
      amendedBy: detail.diubahOleh,
      versionTag: node.versionTag,
      isRepealed: node.isRepealed,
      repealBasis: node.repealBasis,
      fromText: '…',
      toText: node.content || '…',
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
      amendmentDetail: detail,
      loading: true,
    });

    try {
      const baseYear = years[0] ?? '2008';
      const [diffRes, histRes] = await Promise.all([
        fetch(
          `${API_BASE}/api/v1/provisions/diff?slug=${slug}&path=${encodeURIComponent(node.canonicalPath)}&fromYear=${baseYear}&toYear=${selectedTimeline}`
        ).catch(() => null),
        fetch(
          `${API_BASE}/api/v1/instruments/${slug}/history?path=${encodeURIComponent(node.canonicalPath)}`
        ).catch(() => null),
      ]);

      const json = diffRes && diffRes.ok ? await diffRes.json() : null;
      const hist = histRes && histRes.ok ? await histRes.json() : { versi: [] };

      const baselineMissing = json ? !json.nodeFrom : node.versionTag.startsWith('AMENDMENT_2024');
      const status = node.isRepealed
        ? 'DICABUT / DIHAPUS'
        : baselineMissing
          ? 'PASAL SISIPAN BARU'
          : node.versionTag.startsWith('AMENDED') || node.versionTag.startsWith('AMENDMENT')
            ? 'DIUBAH REDAKSI'
            : 'BERLAKU';

      setInspectorNode((prev) => ({
        canonicalPath: node.canonicalPath,
        label: node.label,
        parentLabel,
        status: detail.statusBadge || status,
        amendedBy: detail.diubahOleh || (node.isRepealed ? node.repealBasis || 'UU Pengubah' : 'UU Pengubah'),
        versionTag: node.versionTag,
        isRepealed: node.isRepealed,
        repealBasis: node.repealBasis,
        fromText: json?.textFrom ?? '(Belum ada pada naskah asli)',
        toText: json?.textTo ?? node.content,
        diff: json?.diff ?? (prev ? prev.diff : {} as ProvisionDiffResult),
        riwayat: (hist?.versi ?? []) as RiwayatVersi[],
        amendmentDetail: detail,
        loading: false,
      }));
    } catch {
      // Fallback tetap aman dengan metadata lokal
      setInspectorNode((prev) => prev ? { ...prev, loading: false } : null);
    }
  };

  const salinSitasi = (node: InspectorState | { label: string }) => {
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
      {/* ── Top Header Modern ─────────────────────────────────── */}
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-5 flex items-center justify-between z-20 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <Link
            href="/katalog"
            title="Kembali ke Katalog JDIH"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Katalog</span>
          </Link>
          <div>
            <h1 className="font-sans font-bold text-sm text-slate-900 leading-tight flex items-center gap-2">
              {meta ? `UU No. ${meta.number} Tahun ${meta.year}` : 'Memuat Peraturan…'}
              {meta?.shortTitle && (
                <span className="text-slate-500 font-normal">({meta.shortTitle})</span>
              )}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block w-2 h-2 rounded-full ${meta?.status === 'BERLAKU' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="font-medium text-slate-600">
                {selectedTimeline ? timelineTitle(selectedTimeline) : 'Menghubungkan ke API…'}
              </span>
            </p>
          </div>
        </div>

        {/* Timeline Switcher Titik Waktu */}
        {!showRiwayat && !isCompareMode && (
          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-medium">
            <span className="text-slate-500 px-2.5 text-[11px] font-semibold tracking-wide uppercase">Titik Waktu:</span>
            {years.map((year) => {
              const isSelected = selectedTimeline === year;
              return (
                <button
                  key={year}
                  onClick={() => setSelectedTimeline(year)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {String(meta?.year) === year ? `${year} (Pokok)` : year}
                </button>
              );
            })}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = !showRiwayat;
              setShowRiwayat(next);
              if (next) setIsCompareMode(false);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              showRiwayat
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-2xs'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Riwayat Amandemen</span>
          </button>

          <button
            onClick={() => {
              const next = !isCompareMode;
              setIsCompareMode(next);
              if (next) setShowRiwayat(false);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              isCompareMode
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-2xs'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isCompareMode ? 'Tutup Komparasi' : 'Bandingkan Versi'}</span>
          </button>

          <Link
            href="/pipeline"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs"
            title="Buka Simulasi Pipeline Ingestion & AST Parsing"
          >
            <Cpu className="w-3.5 h-3.5 text-[#94191C]" />
            <span className="hidden sm:inline">Pipeline ETL</span>
          </Link>

          <Link
            href={`/neuron?id=${slug}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 text-xs font-semibold transition-all shadow-xs"
          >
            <Network className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Peta Silsilah</span>
          </Link>

          {currentUser ? (
            <Link
              href="/masuk"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-900 font-semibold text-xs border border-indigo-200/80 hover:bg-indigo-100 transition-colors shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
              <span className="max-w-[100px] truncate">{currentUser.name}</span>
            </Link>
          ) : (
            <Link
              href="/masuk"
              className="px-3 py-1.5 rounded-xl bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold border border-slate-200 transition-colors shadow-2xs"
            >
              Masuk
            </Link>
          )}
        </div>
      </header>

      {/* ── 3-Column Layout: Sidebar Kiri | Dokumen Tengah Word-style | Panel Kanan ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Sidebar Kiri: Full Daftar Isi Bertingkat ───────────── */}
        <aside className="w-80 bg-slate-50/70 border-r border-slate-200/80 flex flex-col shrink-0">
          <div className="p-3.5 border-b border-slate-200/70 font-semibold text-xs text-slate-500 uppercase tracking-wider flex items-center justify-between bg-white/50">
            <span>Daftar Isi Norma</span>
            <span className="text-[11px] font-mono bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
              {pasalCount} Pasal
            </span>
          </div>

          {/* Quick Search Bar */}
          <div className="p-3 border-b border-slate-200/70 bg-white/70">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pasal atau kata kunci…"
                className="w-full pl-9 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 placeholder:text-slate-400 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-xs font-bold text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Navigasi Hirarki Bertingkat */}
          <nav className="flex-1 overflow-y-auto p-2 text-sm space-y-1" aria-label="Daftar isi">
            {/* Bagian Pendahuluan */}
            <div className="rounded-xl overflow-hidden border border-slate-200/60 bg-white/60 mb-1.5 shadow-2xs">
              <button
                onClick={() => {
                  const el = document.getElementById('pendahuluan-konsiderans');
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pendahuluan (Konsiderans)</span>
              </button>
            </div>

            {filteredNodes.length === 0 && searchQuery && (
              <div className="p-6 text-center text-xs text-slate-500 bg-white/60 rounded-xl border border-slate-200/60 m-2">
                Tidak ada pasal yang cocok dengan &quot;{searchQuery}&quot;
              </div>
            )}

            {filteredNodes.map((bab) => {
              const babOpen = expanded.has(bab.canonicalPath);
              return (
                <div key={bab.canonicalPath} className="rounded-xl overflow-hidden border border-slate-200/50 bg-white/60 mb-1.5 shadow-2xs">
                  {/* Level 1: BAB */}
                  <button
                    onClick={() => toggleExpand(bab.canonicalPath)}
                    className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors cursor-pointer ${
                      babOpen ? 'bg-indigo-50/50 text-indigo-950' : 'hover:bg-slate-100/70 text-slate-800'
                    }`}
                  >
                    <span className="mt-0.5 shrink-0 text-slate-400">
                      {babOpen ? <ChevronDown className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-sans text-xs font-bold text-slate-900 tracking-tight">
                        {bab.label}
                      </span>
                      {bab.title && (
                        <span className="block text-[10px] leading-snug text-slate-500 uppercase tracking-wide truncate mt-0.5">
                          {bab.title}
                        </span>
                      )}
                    </span>
                  </button>

                  {/* Level 2: Pasal */}
                  {babOpen && (
                    <div className="py-1 border-t border-slate-100 bg-white/80">
                      {bab.children
                        ?.filter((c) => c.type === 'PASAL')
                        .map((pasal) => {
                          const pOpen = expanded.has(pasal.canonicalPath);
                          const hasAyat = (pasal.children?.length ?? 0) > 0;
                          const isActive = activeNodePath === pasal.canonicalPath;
                          const isAmended = pasal.versionTag.startsWith('AMENDMENT') || pasal.versionTag.startsWith('AMENDED');
                          return (
                            <div key={pasal.canonicalPath} className="relative">
                              <div
                                className={`group flex items-center pl-5 pr-2 py-0.5 transition-all ${
                                  isActive ? 'bg-indigo-50/90 text-indigo-900 font-semibold' : 'hover:bg-slate-100/70'
                                }`}
                              >
                                {isActive && (
                                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-sm" />
                                )}
                                <button
                                  onClick={() => {
                                    setActiveNodePath(pasal.canonicalPath);
                                    scrollToNode(pasal.canonicalPath);
                                    if (hasAyat) {
                                      setExpanded((prev) => new Set(prev).add(pasal.canonicalPath));
                                    }
                                  }}
                                  className="flex-1 text-left py-1 text-xs text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1.5 min-w-0"
                                >
                                  <span className="truncate">{pasal.label}</span>
                                  {pasal.isRepealed ? (
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" title="Pasal Dicabut" />
                                  ) : isAmended ? (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Pasal Mengalami Amandemen" />
                                  ) : null}
                                </button>
                                {hasAyat && (
                                  <button
                                    onClick={() => toggleExpand(pasal.canonicalPath)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer shrink-0"
                                    aria-label={pOpen ? 'Tutup' : 'Buka ayat'}
                                  >
                                    {pOpen ? <ChevronDown className="w-3 h-3 text-indigo-600" /> : <ChevronRight className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>

                              {/* Level 3: Ayat */}
                              {pOpen &&
                                pasal.children?.map((ayat) => {
                                  const isAyatActive = activeNodePath === ayat.canonicalPath;
                                  return (
                                    <div key={ayat.canonicalPath} className="relative">
                                      <div
                                        className={`group flex items-center pl-8 pr-2 py-0.5 transition-colors ${
                                          isAyatActive ? 'bg-indigo-50/80 font-semibold' : 'hover:bg-slate-100/60'
                                        }`}
                                      >
                                        <button
                                          onClick={() => {
                                            setActiveNodePath(ayat.canonicalPath);
                                            scrollToNode(ayat.canonicalPath);
                                          }}
                                          className="flex-1 text-left py-1 text-[11px] text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer truncate"
                                        >
                                          <span className="font-semibold text-slate-700">{ayat.label}</span>
                                          <span className="text-slate-400"> · {ayat.content.slice(0, 32)}…</span>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* ── Bagian Tengah: Full Paper Layaknya Dokumen Microsoft Word Resmi ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10 flex flex-col items-center bg-slate-200/50 scroll-smooth">
          {!currentDoc ? (
            <div className="flex items-center justify-center w-full my-auto">
              <span className="text-sm font-medium text-slate-500 animate-pulse bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-xs">
                Merekonstruksi naskah konsolidasi deterministik…
              </span>
            </div>
          ) : (
            <>
              {/* Bilah Status Baca Lengket (Sticky Reading Navigator Bar) */}
              <div className="sticky top-0 z-20 w-full max-w-4xl mx-auto mb-6 px-5 py-2.5 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xs flex items-center justify-between text-xs font-sans text-slate-700">
                <div className="flex items-center gap-2.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-bold truncate text-slate-900">
                    {meta ? `UU No. ${meta.number} Tahun ${meta.year}` : 'Naskah Regulasi'}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-600 truncate font-medium">
                    {selectedTimeline ? timelineTitle(selectedTimeline) : 'Konsolidasi Positif Terkini'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-semibold">
                    {pasalCount} Pasal
                  </span>
                  <button
                    onClick={() => {
                      const el = document.getElementById('pendahuluan-konsiderans');
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer text-xs font-semibold"
                  >
                    Ke Atas ↑
                  </button>
                </div>
              </div>

              {/* Kertas Dokumen Word Resmi */}
              <div className="max-w-4xl w-full bg-white shadow-xl rounded-2xl border border-slate-300/80 px-8 sm:px-16 lg:px-20 py-14 sm:py-20 min-h-[1400px] text-slate-800 font-serif leading-[1.85] text-[15.5px]">
                {/* Header Atas Dokumen */}
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest pb-4 mb-8 border-b border-slate-200/80 flex items-center justify-between">
                  <span>LEMBARAN NEGARA REPUBLIK INDONESIA</span>
                  <span>SALINAN KONSOLIDASI RESMI</span>
                </div>

                {/* Kop Naskah Republik Indonesia */}
                <div className="text-center pb-8 border-b-2 border-slate-900 mb-12">
                  <div className="w-14 h-14 mx-auto rounded-full bg-slate-50 border border-slate-300 flex items-center justify-center text-slate-800 mb-4 shadow-2xs">
                    <Scale className="w-7 h-7 text-slate-800" />
                  </div>
                  <h2 className="font-sans font-extrabold text-sm uppercase tracking-widest text-slate-700">
                    Presiden Republik Indonesia
                  </h2>
                  <h3 className="font-sans font-extrabold text-lg sm:text-xl uppercase tracking-tight text-slate-900 mt-2.5">
                    {meta ? `Undang-Undang Republik Indonesia Nomor ${meta.number} Tahun ${meta.year}` : ''}
                  </h3>
                  <h4 className="font-sans font-bold text-sm uppercase tracking-wide text-slate-800 mt-1">
                    Tentang {meta?.title}
                  </h4>
                  <p className="font-serif italic text-xs text-slate-600 mt-3.5">
                    Dengan Rahmat Tuhan Yang Maha Esa
                  </p>
                  <p className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800 mt-1">
                    Presiden Republik Indonesia,
                  </p>
                </div>

                {/* Bagian Pendahuluan Konsiderans */}
                <div id="pendahuluan-konsiderans" className="mb-12 space-y-4 text-xs sm:text-sm leading-relaxed border-b border-slate-200 pb-10 font-serif">
                  <div className="flex items-start gap-4">
                    <span className="font-bold font-sans text-slate-900 shrink-0 w-24">Menimbang :</span>
                    <div className="space-y-2 text-slate-700">
                      <p>a. bahwa pemanfaatan Teknologi Informasi dan Transaksi Elektronik dilaksanakan untuk mencerdaskan kehidupan bangsa sebagai bagian dari masyarakat informasi dunia;</p>
                      <p>b. bahwa penataan ruang digital perlu menjamin kepastian hukum, keadilan, dan pelindungan hak asasi manusia;</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 pt-2">
                    <span className="font-bold font-sans text-slate-900 shrink-0 w-24">Mengingat :</span>
                    <div className="space-y-1 text-slate-700">
                      <p>1. Pasal 5 ayat (1) dan Pasal 20 Undang-Undang Dasar Negara Republik Indonesia Tahun 1945;</p>
                    </div>
                  </div>

                  <div className="text-center py-5 font-sans font-extrabold text-xs uppercase tracking-widest text-slate-900">
                    MEMUTUSKAN:
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="font-bold font-sans text-slate-900 shrink-0 w-24">Menetapkan :</span>
                    <p className="font-sans font-bold text-slate-900 uppercase">
                      UNDANG-UNDANG TENTANG {meta?.title}.
                    </p>
                  </div>
                </div>

                {/* Batang Tubuh Pasal-Pasal */}
                <div className="space-y-12">
                  {currentDoc.nodes.map((chapter) => (
                    <div key={chapter.canonicalPath} className="space-y-6">
                      {/* Judul BAB Resmi */}
                      <div className="my-14 pt-10 border-t-2 border-slate-200/90 text-center space-y-1.5">
                        <span className="font-sans font-bold text-xs uppercase tracking-widest text-slate-600 block">
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
                        const isNewInsert = pasal.versionTag.startsWith('AMENDMENT_2024');
                        const isAmended = pasal.versionTag.startsWith('AMENDED') || (pasal.versionTag.startsWith('AMENDMENT') && !isNewInsert);
                        const isRepealed = pasal.isRepealed;
                        const isSelected = activeNodePath === pasal.canonicalPath || activeNodePath.startsWith(pasal.canonicalPath + '/');

                        // Penanda warna tepi dokumen (Track Changes style)
                        const borderClass = isRepealed
                          ? 'border-l-4 border-rose-500 bg-rose-50/25 pl-4 sm:pl-5 pr-2 py-3 rounded-r-xl shadow-2xs'
                          : isNewInsert
                            ? 'border-l-4 border-emerald-500 bg-emerald-50/25 pl-4 sm:pl-5 pr-2 py-3 rounded-r-xl shadow-2xs'
                            : isAmended
                              ? 'border-l-4 border-amber-400 bg-amber-50/25 pl-4 sm:pl-5 pr-2 py-3 rounded-r-xl shadow-2xs'
                              : 'pl-4 sm:pl-5 pr-2 py-3 border-l-4 border-transparent';

                        const activeClass = isSelected
                          ? 'ring-2 ring-indigo-500/80 bg-indigo-50/30 rounded-xl'
                          : 'hover:bg-slate-50/70';

                        return (
                          <div
                            key={pasal.canonicalPath}
                            id={`node-${pasal.canonicalPath}`}
                            className={`my-6 transition-all ${borderClass} ${activeClass}`}
                          >
                            {/* Header Pasal ala Format UU Resmi (Centered) */}
                            <div className="text-center mb-4 cursor-pointer" onClick={() => handleOpenInspector(pasal, chapter.label)}>
                              <div className="inline-flex items-center gap-2 flex-wrap justify-center">
                                <span className="font-sans font-extrabold text-slate-900 text-base">
                                  {pasal.label}
                                </span>
                                {isNewInsert && (
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    🟢 Sisipan Baru (UU 1/2024)
                                  </span>
                                )}
                                {isAmended && (
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                                    🟡 Diubah (UU 1/2024)
                                  </span>
                                )}
                                {isRepealed && (
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300">
                                    🔴 Dicabut (UU 1/2024)
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
                              <div className="space-y-3">
                                {pasal.children.map((ayat) => (
                                  <div
                                    key={ayat.canonicalPath}
                                    id={`node-${ayat.canonicalPath}`}
                                    onClick={() => handleOpenInspector(ayat, pasal.label)}
                                    className={`flex items-start gap-3.5 py-1.5 px-2 rounded-lg transition-colors cursor-pointer group ${
                                      ayat.isRepealed
                                        ? 'line-through text-rose-700 bg-rose-50/40 font-medium'
                                        : activeNodePath === ayat.canonicalPath
                                          ? 'bg-indigo-50/80 text-indigo-950 font-medium'
                                          : 'hover:bg-slate-100/70'
                                    }`}
                                  >
                                    <span className="font-sans font-bold text-slate-700 shrink-0 w-8 text-right text-xs mt-1 select-none">
                                      {ayat.label}
                                    </span>
                                    <div className="flex-1">
                                      <p className="text-slate-800 text-[15.5px] leading-[1.85] text-justify font-serif">
                                        {ayat.content}
                                      </p>
                                      {ayat.isRepealed && (
                                        <p className="mt-1 text-xs font-sans font-semibold text-rose-700 not-italic">
                                          ⚠️ Ketentuan norma ini dicabut: {ayat.repealBasis || 'Putusan MK / UU No. 1 Tahun 2024'}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              /* Pasal Satu Paragraf Tanpa Ayat (Sejajar dengan Margin Ayat) */
                              <div
                                onClick={() => handleOpenInspector(pasal, chapter.label)}
                                className={`flex items-start gap-3.5 py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
                                  activeNodePath === pasal.canonicalPath
                                    ? 'bg-indigo-50/80 text-indigo-950 font-medium'
                                    : 'hover:bg-slate-100/70'
                                }`}
                              >
                                <div className="w-8 shrink-0 select-none text-right font-sans font-bold text-xs text-slate-400 mt-1">
                                  •
                                </div>
                                <p className="flex-1 text-[15.5px] leading-[1.85] text-justify font-serif text-slate-800">
                                  {pasal.content}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Tanda Tangan Pengesahan Negara di Akhir Dokumen */}
                <div className="mt-16 pt-12 border-t-2 border-slate-900 font-sans text-xs space-y-8">
                  <p className="text-slate-700 leading-relaxed font-serif text-[14.5px]">
                    Agar setiap orang mengetahuinya, memerintahkan pengundangan Undang-Undang ini dengan penempatannya dalam Lembaran Negara Republik Indonesia.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-1">
                      <p className="text-slate-500 text-2xs uppercase tracking-wider font-semibold">Diundangkan di Jakarta</p>
                      <p className="text-slate-600">pada tanggal 21 April 2008</p>
                      <p className="font-bold text-slate-900 uppercase mt-4">Menteri Hukum dan Hak Asasi Manusia</p>
                      <p className="font-bold text-slate-900 uppercase">Republik Indonesia,</p>
                      <div className="h-14" />
                      <p className="font-bold text-slate-900 uppercase">ANDI MATTALATTA</p>
                    </div>

                    <div className="sm:text-right space-y-1">
                      <p className="text-slate-500 text-2xs uppercase tracking-wider font-semibold">Disahkan di Jakarta</p>
                      <p className="text-slate-600">pada tanggal 21 April 2008</p>
                      <p className="font-bold text-slate-900 uppercase mt-4">Presiden Republik Indonesia,</p>
                      <div className="h-14" />
                      <p className="font-bold text-slate-900 uppercase">DR. H. SUSILO BAMBANG YUDHOYONO</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                    <span>LEMBARAN NEGARA REPUBLIK INDONESIA TAHUN 2008 NOMOR 58</span>
                    <span>TLN NO. 4843 · KONSOLIDASI RESMI SIPAKA</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>

        {/* ── Sidebar Kanan: Panel Asisten, Riwayat Perubahan & Regulasi Terdampak ─── */}
        <aside className="w-96 lg:w-[420px] bg-white border-l border-slate-200/80 flex flex-col shrink-0 shadow-lg z-10 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Header Samping Kanan */}
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-600" />
              <span className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900">
                Asisten &amp; Analisis Perubahan
              </span>
            </div>
            <button
              onClick={() => window.print()}
              title="Cetak Naskah Dokumen"
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>

          {/* Kartu 1: Status Naskah & Timeline */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
              Status Peraturan
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-slate-900 text-xs">Berlaku (Konsolidasi Aktif)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Naskah konsolidasi mutakhir menggabungkan UU Pokok 11/2008 dengan UU 19/2016 dan UU 1/2024.
            </p>
          </div>

          {/* Kartu 2: Legenda Penanda Warna */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
              Legenda Tanda Warna Naskah:
            </span>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 border border-emerald-600 shrink-0" />
                <span className="text-slate-700">Garis Hijau: <strong>Sisipan Baru (UU 1/2024)</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-amber-400 border border-amber-500 shrink-0" />
                <span className="text-slate-700">Garis Kuning: <strong>Redaksi Telah Diubah</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-rose-500 border border-rose-600 shrink-0" />
                <span className="text-slate-700">Garis Merah: <strong>Dicabut / Dihapus oleh UU 1/2024</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 pt-1 border-t border-slate-100">
                <span className="w-3 h-3 rounded-sm bg-white border border-slate-300 shrink-0" />
                <span>Tanpa Garis: <strong>Norma Asli Berlaku</strong></span>
              </div>
            </div>
          </div>

          {/* Kartu 3: Detail Pasal Aktif (Yang Sedang Diklik) */}
          {inspectorNode ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Header Status & Nama Pasal */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    {inspectorNode.amendmentDetail?.statusBadge || inspectorNode.status}
                  </span>
                  <span className="text-2xs font-mono text-slate-400">
                    {inspectorNode.versionTag}
                  </span>
                </div>
                <h3 className="font-sans font-extrabold text-base text-slate-900 leading-snug">
                  {inspectorNode.label} {inspectorNode.parentLabel ? `(${inspectorNode.parentLabel})` : ''}
                </h3>
              </div>

              {/* Sub-Kartu A: Riwayat & Keterangan Perubahan */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <History className="w-4 h-4 text-amber-600" />
                  <span className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900">
                    Riwayat &amp; Keterangan Perubahan
                  </span>
                </div>

                {/* Diubah Oleh UU Apa */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    Diubah Oleh:
                  </span>
                  <p className="text-xs font-bold text-slate-900 leading-snug">
                    {inspectorNode.amendmentDetail?.diubahOleh || inspectorNode.amendedBy || 'UU No. 1 Tahun 2024'}
                  </p>
                </div>

                {/* Waktu Pengundangan & Lembaran Negara */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    Waktu Pengundangan &amp; Lembaran Negara:
                  </span>
                  <p className="text-xs text-slate-700 leading-snug">
                    {inspectorNode.amendmentDetail?.tanggalPengundangan || '2 Januari 2024'}
                  </p>
                  {inspectorNode.amendmentDetail?.lembaranNegara && (
                    <p className="text-[11px] font-mono text-slate-500">
                      {inspectorNode.amendmentDetail.lembaranNegara}
                    </p>
                  )}
                </div>

                {/* Putusan Mahkamah Konstitusi (Jika Ada) */}
                {inspectorNode.amendmentDetail?.putusanMk && (
                  <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-rose-800 font-bold text-[11px]">
                      <Scale className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Dasar Putusan Mahkamah Konstitusi:</span>
                    </div>
                    <p className="font-bold text-xs text-slate-900">
                      {inspectorNode.amendmentDetail.putusanMk.nomor}
                    </p>
                    <p className="text-[11px] text-slate-700 leading-relaxed italic">
                      &ldquo;{inspectorNode.amendmentDetail.putusanMk.amarPutusan}&rdquo;
                    </p>
                    <div className="pt-1.5 border-t border-rose-200/60 text-[10px] text-slate-600">
                      <span className="font-bold text-rose-800">Pertimbangan Hukum (Ratio Decidendi): </span>
                      {inspectorNode.amendmentDetail.putusanMk.ratioDecidendi}
                    </div>
                  </div>
                )}

                {/* Latar Belakang & Rasio Perubahan */}
                {inspectorNode.amendmentDetail?.latarBelakangPerubahan && (
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                      Latar Belakang &amp; Rasio Perubahan:
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {inspectorNode.amendmentDetail.latarBelakangPerubahan}
                    </p>
                  </div>
                )}

                {/* Perbandingan Teks Naskah Asli vs Positif */}
                {inspectorNode.fromText && inspectorNode.toText && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                      Perbandingan Bunyi Naskah:
                    </span>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-serif space-y-1.5">
                      <div className="text-slate-400 text-2xs font-sans font-bold">Naskah Lama:</div>
                      <p className="text-slate-500 line-through leading-relaxed italic">
                        {inspectorNode.fromText}
                      </p>
                      <div className="text-emerald-700 text-2xs font-sans font-bold pt-1 border-t border-slate-200">
                        Naskah Positif (Terkini):
                      </div>
                      <p className="text-slate-900 leading-relaxed font-sans">
                        {inspectorNode.toText}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-Kartu B: Semua UU / Peraturan yang Terdampak dari Perubahan Tersebut */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900">
                      Peraturan Terdampak
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                    {inspectorNode.amendmentDetail?.peraturanTerdampak?.length || 0} Regulasi
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-snug">
                  Peraturan turunan berikut terpengaruh oleh amandemen pasal ini. <strong>Klik peraturan untuk membaca perubahan yang terjadi:</strong>
                </p>

                <div className="space-y-2.5">
                  {inspectorNode.amendmentDetail?.peraturanTerdampak?.map((reg) => (
                    <div
                      key={reg.id}
                      onClick={() => setSelectedImpact(reg)}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all cursor-pointer group shadow-2xs bg-slate-50/50"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-slate-800 border border-slate-200 group-hover:border-indigo-300 group-hover:bg-indigo-50 group-hover:text-indigo-800 transition-colors">
                          {reg.number}
                        </span>
                        <span className="text-[10px] font-bold text-amber-700">
                          {reg.statusLabel}
                        </span>
                      </div>

                      <h5 className="font-sans font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {reg.title}
                      </h5>

                      <p className="text-[11px] text-slate-600 font-semibold mt-1">
                        Pasal Terdampak: <span className="text-indigo-700">{reg.pasalTurunan}</span>
                      </p>

                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {reg.ringkasanDampak}
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-800">
                        <span>Baca Perubahan yang Terjadi</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tombol Aksi: Salin Sitasi & Delik AI */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => salinSitasi(inspectorNode)}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  {copiedCitation ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Sitasi Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Salin Sitasi Akademik</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    if (!currentUser) setShowLoginPrompt(true);
                    else setShowAiModal(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Analisis Delik Yuridis AI</span>
                </button>
              </div>
            </div>
          ) : (
            /* Panduan Pemilihan Pasal & Chip Cepat Pasal Amandemen */
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-600" />
                <span className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900">
                  Inspeksi Perubahan Norma
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Naskah di tengah menampilkan <strong>versi terkini (hukum positif)</strong>. Bagian yang mengalami perubahan ditandai dengan garis warna. Klik salah satu pasal untuk melihat riwayat amandemen, putusan MK, dan peraturan turunan yang terdampak.
              </p>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Pilih Cepat Pasal yang Mengalami Amandemen:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Pasal 26', 'Pasal 27', 'Pasal 27A', 'Pasal 27B', 'Pasal 28', 'Pasal 40', 'Pasal 45'].map((pName) => {
                    const targetSlug = pName.toLowerCase().replace(' ', '-');
                    const fullPath = `uu-11-2008/${targetSlug}`;
                    return (
                      <button
                        key={pName}
                        onClick={() => {
                          setActiveNodePath(fullPath);
                          scrollToNode(fullPath);
                          const nodeDummy = {
                            canonicalPath: fullPath,
                            type: 'PASAL' as const,
                            orderIndex: 0,
                            label: pName,
                            title: '',
                            content: '',
                            versionTag: pName.includes('27A') || pName.includes('27B') ? 'AMENDMENT_2024' : 'AMENDED',
                            children: [],
                          };
                          handleOpenInspector(nodeDummy, 'BAB VI');
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 transition-all cursor-pointer"
                      >
                        {pName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Kartu 4: Pintasan Navigasi */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <Link
              href={`/neuron?id=${slug}`}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Network className="w-3.5 h-3.5 text-indigo-400" />
              Lihat Peta Silsilah Regulasi
            </Link>
            <Link
              href="/katalog"
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              Kembali ke Katalog JDIH
            </Link>
          </div>
        </aside>
      </div>

      {/* Modal Prompt: Fitur Lanjutan Perlu Login */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-sans font-bold text-lg text-slate-900">
              Fitur Khusus Pengguna Terdaftar
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 mt-2">
              <strong>Naskah konsolidasi, riwayat amandemen, dan silsilah hukum dapat diakses bebas tanpa login oleh publik.</strong>
            </p>
            <p className="text-xs leading-relaxed text-slate-600 mt-1.5">
              Fitur <em>Analisis Delik Yuridis AI</em> dan kurasi anotasi memerlukan akun Mahasiswa, Dosen FH, atau Kurator Ahli.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/masuk"
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs text-center transition-colors shadow-xs"
              >
                Masuk Akun Demo (1-Klik) →
              </Link>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Lanjut Baca Publik
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Hasil Analisis Delik AI (Jika Sudah Login) */}
      {showAiModal && inspectorNode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base text-slate-900">
                    Analisis Delik Yuridis AI: {inspectorNode.label}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Didekomposisi untuk: <span className="font-semibold text-indigo-600">{currentUser?.name}</span> ({currentUser?.role})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 space-y-4 text-xs font-sans">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Bunyi Norma Diuji:
                </span>
                <p className="text-xs text-slate-800 font-serif leading-relaxed italic">
                  &ldquo;{inspectorNode.toText || inspectorNode.fromText}&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 block">
                    1. Subjek Hukum (Normadressat)
                  </span>
                  <p className="text-xs text-slate-700 mt-1">
                    Setiap Orang (orang perseorangan atau korporasi yang menyelenggarakan sistem elektronik).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 block">
                    2. Unsur Kesalahan (Mens Rea)
                  </span>
                  <p className="text-xs text-slate-700 mt-1">
                    Dengan sengaja dan tanpa hak (dolus malus). Memerlukan pembuktian niat jahat subjek.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 block">
                    3. Sifat Delik &amp; Syarat Formil
                  </span>
                  <p className="text-xs text-slate-700 mt-1">
                    <strong>Delik Aduan Absolut</strong> (Putusan MK No. 50/PUU-VI/2008 &amp; UU 1/2024). Wajib ada aduan korban langsung.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 block">
                    4. Alasan Pembenar / Pengecualian
                  </span>
                  <p className="text-xs text-slate-700 mt-1">
                    Demi kepentingan umum atau pembelaan diri secara terpaksa (Pasal 27A ayat 3 UU 1/2024).
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-950">
                <span className="text-[11px] font-bold block mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Rekomendasi Konstruksi Yuridis:
                </span>
                <p className="text-xs leading-relaxed text-slate-700">
                  Periksa tanggal tempus delicti. Jika perbuatan dilakukan setelah berlakunya UU 1/2024, penyidik tidak dapat lagi menggunakan rumusan lama Pasal 27 ayat (3), melainkan harus memilih secara spesifik antara penyerangan kehormatan (Pasal 27A) atau pemerasan (Pasal 27B).
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-2xs text-slate-400">
                SIPAKA Legal-Tech AI Engine · Terhubung Basis Pengetahuan Hukum
              </span>
              <button
                onClick={() => setShowAiModal(false)}
                className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Baca Perubahan yang Terjadi (Komparasi Dampak Regulasi Terdampak) ── */}
      {selectedImpact && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                      {selectedImpact.number}
                    </span>
                    <span className="text-xs font-bold text-amber-700">
                      {selectedImpact.statusLabel}
                    </span>
                  </div>
                  <h3 className="font-sans font-bold text-base text-slate-900 mt-1">
                    {selectedImpact.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pasal Terdampak: <span className="font-bold text-indigo-700">{selectedImpact.pasalTurunan}</span> · Hubungan Hierarki terhadap UU ITE
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedImpact(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Konten Scrollable */}
            <div className="flex-1 overflow-y-auto py-5 space-y-5 text-xs font-sans">
              {/* Ringkasan Masalah */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Inti Permasalahan Yuridis:</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700">
                  {selectedImpact.ringkasanDampak}
                </p>
              </div>

              {/* Komparasi 2 Kolom Berdampingan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kolom Kiri: Perubahan UU Induk */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 block pb-1 border-b border-slate-100">
                    Perubahan pada UU Induk
                  </span>

                  <div className="space-y-1">
                    <span className="text-[10px] font-sans font-bold text-slate-400 uppercase">Sebelum Amandemen:</span>
                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-serif leading-relaxed">
                      {selectedImpact.uuIndukSebelum}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-sans font-bold text-emerald-700 uppercase">Pasca Amandemen (Berlaku):</span>
                    <p className="text-xs text-slate-900 font-medium bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200 font-serif leading-relaxed">
                      {selectedImpact.uuIndukSesudah}
                    </p>
                  </div>
                </div>

                {/* Kolom Kanan: Kondisi Aturan Turunan Saat Ini */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 block pb-1 border-b border-slate-100">
                    Ketentuan Aturan Turunan Saat Ini
                  </span>

                  <div className="space-y-1">
                    <span className="text-[10px] font-sans font-bold text-slate-400 uppercase">{selectedImpact.number} ({selectedImpact.pasalTurunan}):</span>
                    <p className="text-xs text-slate-800 bg-amber-50/40 p-2.5 rounded-lg border border-amber-200 font-serif leading-relaxed">
                      {selectedImpact.ketentuanTurunanTerdampak}
                    </p>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-sans font-bold text-rose-700 uppercase">Potensi Pertentangan Norma:</span>
                    <p className="text-xs text-slate-700 leading-relaxed bg-rose-50/40 p-2.5 rounded-lg border border-rose-200">
                      {selectedImpact.penjelasanPertentangan}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rekomendasi Harmonisasi */}
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Rekomendasi Tindakan Harmonisasi bagi Pembentuk Regulasi:</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-800">
                  {selectedImpact.rekomendasiHarmonisasi}
                </p>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-2xs text-slate-400">
                Prinsip Stufenbau: Aturan pelaksana tidak boleh bertentangan dengan UU Induk
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const textToCopy = `[LAPORAN DAMPAK HARMONISASI HUKUM]\nRegulasi Terdampak: ${selectedImpact.number} (${selectedImpact.title})\nPasal: ${selectedImpact.pasalTurunan}\nStatus: ${selectedImpact.statusLabel}\n\nDampak: ${selectedImpact.ringkasanDampak}\nPertentangan: ${selectedImpact.penjelasanPertentangan}\nRekomendasi: ${selectedImpact.rekomendasiHarmonisasi}`;
                    navigator.clipboard.writeText(textToCopy);
                    setCopiedHarmonisasi(true);
                    setTimeout(() => setCopiedHarmonisasi(false), 2000);
                  }}
                  className="py-2 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedHarmonisasi ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Salin Catatan Harmonisasi</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedImpact(null)}
                  className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

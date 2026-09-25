'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Network, GitBranch, AlertTriangle,
  X, Scale, ExternalLink, Sparkles, SplitSquareVertical,
  Layers, Check, FileText, ChevronRight, ChevronDown, History,
  Search, Copy, Lock, ShieldCheck, Printer, Bookmark, Info,
  Share2, Cpu, ArrowRight
} from 'lucide-react';
import { ConsolidatedLawDocument, ProvisionNode, ProvisionDiffResult } from '@lexvera/types';
import {
  getProvisionAmendmentDetail,
  ImpactedRegulation,
  ProvisionAmendmentDetail,
  PROVISION_AMENDMENT_MAP,
  ALL_AMENDED_PROVISIONS,
  AmendedProvisionItem
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

function formatProvisionLabel(label: string): string {
  if (!label) return '';
  const angkaMatch = label.match(/^Angka\s+(\d+)$/i);
  if (angkaMatch) return `${angkaMatch[1]}.`;
  const ayatMatch = label.match(/^Ayat\s*\((\d+)\)$/i);
  if (ayatMatch) return `(${ayatMatch[1]})`;
  const hurufMatch = label.match(/^Huruf\s+([a-zA-Z])$/i);
  if (hurufMatch) return `${hurufMatch[1].toLowerCase()}.`;
  return label;
}

function cleanLegalText(text: string): string {
  if (!text) return '';
  return text
    .replace(/^[A-Za-z0-9]+\s*\.\s*\.\s*\.?\s*/g, '')
    .replace(/\s+[A-Za-z0-9]+\s*\.\s*\.\s*\.?$/g, '')
    .replace(/\s*Pasal\s+\d+\s*\.\s*\.\s*\.?/gi, '')
    .trim();
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

  // Reader display preferences
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [fontType, setFontType] = useState<'serif' | 'sans'>('serif');
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);

  // User session state
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);

  // Search filter for provisions
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Citation copy state
  const [copiedCitation, setCopiedCitation] = useState<boolean>(false);

  // Inspector State
  const [inspectorNode, setInspectorNode] = useState<InspectorState | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'diff' | 'affected_list' | 'impact' | 'mk'>('diff');

  // State pemilihan versi naskah per pasal/ayat di area tengah ('CURRENT' | 'PREVIOUS')
  const [provisionVersions, setProvisionVersions] = useState<Record<string, 'CURRENT' | 'PREVIOUS'>>({});

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

  // Default seluruh BAB tertutup rapat saat pertama kali naskah dibuka

  // 3. Inspector: diff per node dihitung server-side via API & diintegrasikan dengan cascade regulasi terdampak
  const handleOpenInspector = async (node: ProvisionNode, parentLabel?: string) => {
    if (!selectedTimeline) return;
    setActiveNodePath(node.canonicalPath);
    const detail = getProvisionAmendmentDetail(node.canonicalPath, node.label);

    // KETENTUAN PENGGUNA: Sidebar kanan HANYA muncul saat memilih pasal/ayat yang mengalami amandemen!
    const hasAmendment =
      detail.statusPerubahan !== 'ASLI' ||
      node.versionTag?.startsWith('AMENDMENT') ||
      node.versionTag?.startsWith('AMEND') ||
      Boolean(node.isRepealed) ||
      Boolean(detail.putusanMk);

    if (!hasAmendment) {
      setInspectorNode(null);
      return;
    }

    setInspectorTab('diff');
    setInspectorNode({
      canonicalPath: node.canonicalPath,
      label: node.label,
      parentLabel,
      status: detail.statusBadge || 'MEMUAT…',
      amendedBy: detail.diubahOleh,
      versionTag: node.versionTag,
      isRepealed: node.isRepealed,
      repealBasis: node.repealBasis,
      fromText: detail.textSebelum || '…',
      toText: detail.textSesudah || node.content || '…',
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
        fromText: detail.textSebelum || json?.textFrom || '(Belum ada pada naskah asli)',
        toText: detail.textSesudah || json?.textTo || node.content,
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
          {/* Format & Tipografi Naskah */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs">
            <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200 shadow-2xs">
              <button
                onClick={() => setFontSize((prev) => (prev === 'xl' ? 'lg' : prev === 'lg' ? 'base' : 'sm'))}
                disabled={fontSize === 'sm'}
                className="px-2 py-0.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 font-bold text-xs cursor-pointer"
                title="Perkecil Ukuran Huruf (A-)"
              >
                A-
              </button>
              <span className="text-[10px] font-mono font-bold px-1.5 text-slate-500 select-none">
                {fontSize === 'sm' ? '85%' : fontSize === 'base' ? '100%' : fontSize === 'lg' ? '115%' : '130%'}
              </span>
              <button
                onClick={() => setFontSize((prev) => (prev === 'sm' ? 'base' : prev === 'base' ? 'lg' : 'xl'))}
                disabled={fontSize === 'xl'}
                className="px-2 py-0.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 font-bold text-xs cursor-pointer"
                title="Perbesar Ukuran Huruf (A+)"
              >
                A+
              </button>
            </div>

            <button
              onClick={() => setFontType((prev) => (prev === 'serif' ? 'sans' : 'serif'))}
              className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors cursor-pointer shadow-2xs"
              title="Ganti Tipografi Serif / Sans"
            >
              {fontType === 'serif' ? 'Serif' : 'Sans'}
            </button>

            <button
              onClick={() => setShowAnnotations(!showAnnotations)}
              className={`px-2 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer shadow-2xs ${
                showAnnotations
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="Toggle garis penanda perubahan"
            >
              {showAnnotations ? 'Anotasi ON' : 'Anotasi OFF'}
            </button>
          </div>


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

        {/* ── Bagian Tengah: Workspace Baca Berstandar Arsip Negara ── */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#EEF2F6] overflow-hidden">
          {/* ── Scrollable Canvas Area (Kertas Dokumen Bersih) ── */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10 flex flex-col items-center scroll-smooth relative">
            {!currentDoc ? (
              <div className="flex items-center justify-center w-full my-auto">
                <span className="text-sm font-medium text-slate-500 animate-pulse bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-xs">
                  Merekonstruksi naskah konsolidasi deterministik…
                </span>
              </div>
            ) : (
              <>
                {/* Kertas Dokumen Word / Lembaran Negara Resmi Berstandar Arsip Negara */}
                <div className="max-w-4xl w-full bg-white shadow-xl rounded-2xl border border-slate-200/90 px-8 sm:px-14 lg:px-20 py-12 sm:py-16 text-slate-800 mb-12">
                  {/* Header Atas Dokumen Lembaran Negara */}
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest pb-4 mb-8 border-b border-slate-200/80 flex items-center justify-between">
                    <span>LEMBARAN NEGARA REPUBLIK INDONESIA</span>
                    <span>SALINAN KONSOLIDASI RESMI DETERMINISTIK · SIPAKA</span>
                  </div>

                  {/* Kop Naskah Republik Indonesia (100% Sesuai Naskah PDF Lembaran Negara Asli) */}
                  <div className="text-center pb-8 border-b-2 border-slate-900 mb-10 space-y-2">
                    <img
                      src="/garuda.svg"
                      alt="Lambang Negara Republik Indonesia Garuda Pancasila"
                      className="w-28 h-28 mx-auto mb-4 object-contain drop-shadow-xs select-none"
                    />
                    <h2 className="font-sans font-extrabold text-sm uppercase tracking-widest text-slate-800">
                      PRESIDEN REPUBLIK INDONESIA
                    </h2>
                    <h3 className="font-sans font-extrabold text-lg sm:text-xl uppercase tracking-tight text-slate-900 pt-1">
                      {meta ? `UNDANG-UNDANG REPUBLIK INDONESIA NOMOR ${meta.number} TAHUN ${meta.year}` : 'UNDANG-UNDANG REPUBLIK INDONESIA NOMOR 11 TAHUN 2008'}
                    </h3>
                    <p className="font-sans font-extrabold text-sm uppercase tracking-wide text-slate-700">
                      TENTANG
                    </p>
                    <h4 className="font-sans font-extrabold text-base sm:text-lg uppercase tracking-wide text-slate-900">
                      {meta?.title || 'INFORMASI DAN TRANSAKSI ELEKTRONIK'}
                    </h4>
                    <p className="font-serif italic text-xs text-slate-600 pt-2">
                      DENGAN RAHMAT TUHAN YANG MAHA ESA
                    </p>
                    <p className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900">
                      PRESIDEN REPUBLIK INDONESIA,
                    </p>
                  </div>

                  {/* Bagian Pendahuluan Konsiderans Asli Sesuai LNRI No. 58 Tahun 2008 */}
                  <div id="pendahuluan-konsiderans" className={`mb-10 space-y-4 text-xs sm:text-sm leading-relaxed border-b border-slate-200 pb-10 ${fontType === 'serif' ? 'font-serif' : 'font-sans'}`}>
                    <div className="flex items-start gap-4">
                      <span className="font-bold font-sans text-slate-900 shrink-0 w-28">Menimbang :</span>
                      <div className="space-y-2.5 text-slate-700 text-justify">
                        <p>a. bahwa pembangunan nasional adalah proses yang berkelanjutan yang harus senantiasa tanggap terhadap berbagai dinamika yang terjadi di masyarakat;</p>
                        <p>b. bahwa globalisasi informasi telah menempatkan Indonesia sebagai bagian dari masyarakat informasi dunia sehingga mengharuskan dibentuknya pengaturan mengenai pengelolaan Informasi dan Transaksi Elektronik di tingkat nasional sehingga pembangunan Teknologi Informasi dapat dilakukan secara optimal, merata, dan menyebar ke seluruh lapisan masyarakat guna mencerdaskan kehidupan bangsa;</p>
                        <p>c. bahwa perkembangan dan kemajuan Teknologi Informasi yang demikian pesat telah menyebabkan perubahan kegiatan kehidupan manusia dalam berbagai bidang yang secara langsung telah memengaruhi lahirnya bentuk-bentuk perbuatan hukum baru;</p>
                        <p>d. bahwa penggunaan dan pemanfaatan Teknologi Informasi harus terus dikembangkan untuk menjaga, memelihara, dan memperkukuh persatuan dan kesatuan nasional berdasarkan peraturan perundang-undangan demi kepentingan nasional;</p>
                        <p>e. bahwa pemanfaatan Teknologi Informasi berperan penting dalam perdagangan dan pertumbuhan perekonomian nasional untuk mewujudkan kesejahteraan masyarakat;</p>
                        <p>f. bahwa berdasarkan pertimbangan sebagaimana dimaksud dalam huruf a, huruf b, huruf c, huruf d, dan huruf e, perlu membentuk Undang-Undang tentang Informasi dan Transaksi Elektronik;</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 pt-3 border-t border-slate-100">
                      <span className="font-bold font-sans text-slate-900 shrink-0 w-28">Mengingat :</span>
                      <div className="space-y-1 text-slate-700">
                        <p>Pasal 5 ayat (1) dan Pasal 20 Undang-Undang Dasar Negara Republik Indonesia Tahun 1945;</p>
                      </div>
                    </div>

                    <div className="text-center py-5 space-y-1.5 font-sans">
                      <p className="text-xs uppercase tracking-wider text-slate-600 font-bold">Dengan Persetujuan Bersama</p>
                      <p className="font-extrabold text-xs sm:text-sm uppercase tracking-wide text-slate-900">DEWAN PERWAKILAN RAKYAT REPUBLIK INDONESIA</p>
                      <p className="text-xs font-serif italic text-slate-500">dan</p>
                      <p className="font-extrabold text-xs sm:text-sm uppercase tracking-wide text-slate-900">PRESIDEN REPUBLIK INDONESIA</p>
                      <div className="pt-3 font-extrabold text-sm uppercase tracking-widest text-[#94191C]">
                        MEMUTUSKAN:
                      </div>
                    </div>

                    <div className="flex items-start gap-4 pt-2">
                      <span className="font-bold font-sans text-slate-900 shrink-0 w-28">Menetapkan :</span>
                      <p className="font-sans font-extrabold text-slate-900 uppercase tracking-wide">
                        UNDANG-UNDANG TENTANG {meta?.title || 'INFORMASI DAN TRANSAKSI ELEKTRONIK'}.
                      </p>
                    </div>
                  </div>

                  {/* Batang Tubuh Pasal-Pasal */}
                  <div className="space-y-10">
                    {currentDoc.nodes.map((chapter) => (
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
                          const isSelected = activeNodePath === pasal.canonicalPath || activeNodePath.startsWith(pasal.canonicalPath + '/');

                          // Penanda warna tepi dokumen (Track Changes style)
                          const borderClass = !showAnnotations
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

                          const fontSizeClass =
                            fontSize === 'sm'
                              ? 'text-[14px] leading-[1.75]'
                              : fontSize === 'lg'
                                ? 'text-[17.5px] leading-[1.9]'
                                : fontSize === 'xl'
                                  ? 'text-[19.5px] leading-[2.0]'
                                  : 'text-[15.5px] leading-[1.85]';

                          const fontFamilyClass = fontType === 'serif' ? 'font-serif' : 'font-sans';

                          return (
                            <div
                              key={pasal.canonicalPath}
                              id={`node-${pasal.canonicalPath}`}
                              className={`my-5 transition-all ${borderClass} ${activeClass}`}
                            >
                              {/* Header Pasal ala Format UU Resmi (Centered) */}
                              <div className="text-center mb-3 cursor-pointer select-none" onClick={() => handleOpenInspector(pasal, chapter.label)}>
                                <div className="inline-flex items-center gap-2 flex-wrap justify-center">
                                  <span className="font-sans font-extrabold text-slate-900 text-sm sm:text-base">
                                    {pasal.label}
                                  </span>
                                  {showAnnotations && isNewInsert && (
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                      🟢 Sisipan Baru (UU 1/2024)
                                    </span>
                                  )}
                                  {showAnnotations && isAmended && (
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                      🟡 Diubah (UU 1/2024)
                                    </span>
                                  )}
                                  {showAnnotations && isRepealed && (
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                                      🔴 Dicabut / Dihapus (UU 1/2024)
                                    </span>
                                  )}
                                  {showAnnotations && hasMk && (
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
                                  {pasal.children.map((ayat) => {
                                    const ayatDetail = PROVISION_AMENDMENT_MAP[ayat.canonicalPath];
                                    const ayatIsNew = ayatDetail?.statusPerubahan === 'SISIPAN_BARU' || isNewInsert;
                                    const ayatIsAmended = ayatDetail?.statusPerubahan === 'DIUBAH';
                                    const ayatIsRepealed = ayat.isRepealed || ayatDetail?.statusPerubahan === 'DICABUT';
                                    const ayatHasMk = Boolean(ayatDetail?.putusanMk || (hasMk && ayat.canonicalPath.includes('pasal-27')));
                                    const isAyatActive = activeNodePath === ayat.canonicalPath;
                                    const hasAyatAmendment = Boolean(ayatDetail && ayatDetail.statusPerubahan !== 'ASLI');
                                    const isAyatPreviousSelected = provisionVersions[ayat.canonicalPath] === 'PREVIOUS';

                                    const ayatColorStyle = !showAnnotations
                                      ? ''
                                      : isAyatPreviousSelected
                                        ? 'bg-amber-50/90 border-l-4 border-amber-500'
                                        : ayatIsRepealed
                                          ? 'line-through text-rose-800 bg-rose-50/70 border-l-4 border-rose-500 font-medium'
                                          : ayatIsNew
                                            ? 'bg-emerald-50/70 border-l-4 border-emerald-500 font-medium text-slate-900'
                                            : ayatIsAmended
                                              ? 'bg-amber-50/70 border-l-4 border-amber-400 font-medium text-slate-900'
                                              : '';

                                    return (
                                      <div
                                        key={ayat.canonicalPath}
                                        id={`node-${ayat.canonicalPath}`}
                                        onClick={() => handleOpenInspector(ayat, pasal.label)}
                                        className={`flex items-start gap-3 py-2 px-2.5 rounded-lg transition-colors cursor-pointer group ${ayatColorStyle} ${
                                          isAyatActive
                                            ? 'bg-red-50/90 text-slate-900 ring-2 ring-[#94191C]/80 font-medium shadow-2xs'
                                            : 'hover:bg-slate-100/70'
                                        }`}
                                      >
                                        <span className="font-mono font-bold text-slate-600 shrink-0 min-w-[36px] sm:min-w-[42px] text-right text-xs pt-1 select-none">
                                          {formatProvisionLabel(ayat.label)}
                                        </span>
                                        <div className="flex-1 min-w-0 space-y-1.5">
                                          {isAyatPreviousSelected ? (
                                            /* Tampilan Versi Sebelumnya: Latar Amber Kuno Kontras & Banner Peringatan */
                                            <div className="p-3 sm:p-3.5 rounded-xl bg-amber-100/70 border-2 border-dashed border-amber-400 text-amber-950 font-serif shadow-xs ring-1 ring-amber-300/80">
                                              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-amber-300 text-[10.5px] font-mono font-bold text-amber-900">
                                                <span className="flex items-center gap-1.5">
                                                  <History className="w-3.5 h-3.5 text-amber-700" />
                                                  <span>ARSIP MASA LALU (NASKAH ASLI UU 11/2008) — TIDAK BERLAKU</span>
                                                </span>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setProvisionVersions((prev) => ({ ...prev, [ayat.canonicalPath]: 'CURRENT' }));
                                                  }}
                                                  className="text-amber-800 hover:text-amber-950 font-sans font-bold underline cursor-pointer text-[10px]"
                                                >
                                                  Tampilkan Naskah Berlaku Terkini →
                                                </button>
                                              </div>
                                              <p className={`text-slate-900 text-justify leading-relaxed italic ${fontSizeClass}`}>
                                                {cleanLegalText(ayatDetail?.textSebelum || '(Naskah versi sebelumnya tidak tercatat)')}
                                              </p>
                                            </div>
                                          ) : (
                                            /* Tampilan Naskah Positif Berlaku */
                                            <p className={`text-slate-800 text-justify ${fontSizeClass} ${fontFamilyClass}`}>
                                              {cleanLegalText(ayat.content)}
                                            </p>
                                          )}

                                          {/* Penanda status ayat & Tombol pemilih versi sebelumnya */}
                                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                                            {showAnnotations && ayatIsNew && (
                                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                🟢 Sisipan Baru (UU 1/2024)
                                              </span>
                                            )}
                                            {showAnnotations && ayatIsAmended && (
                                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                                🟡 Redaksi Diubah (UU 1/2024)
                                              </span>
                                            )}
                                            {showAnnotations && ayatIsRepealed && (
                                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                                                🔴 Dicabut / Dihapus: {ayat.repealBasis || 'UU No. 1 Tahun 2024'}
                                              </span>
                                            )}
                                            {showAnnotations && ayatHasMk && (
                                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300">
                                                ⚖️ Terikat Putusan MK
                                              </span>
                                            )}

                                            {/* Tombol Pemilih Versi Sebelumnya Langsung di Naskah Tengah */}
                                            {hasAyatAmendment && ayatDetail?.textSebelum && !isAyatPreviousSelected && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setProvisionVersions((prev) => ({ ...prev, [ayat.canonicalPath]: 'PREVIOUS' }));
                                                }}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-colors shadow-2xs cursor-pointer ml-auto"
                                                title="Bandingkan langsung: Klik untuk menampilkan teks naskah sebelum amandemen"
                                              >
                                                <History className="w-3 h-3 text-amber-700" />
                                                <span>Lihat Naskah Sebelumnya</span>
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                /* Pasal Satu Paragraf Tanpa Ayat (Sejajar dengan Margin Ayat) */
                                (() => {
                                  const isPasalPreviousSelected = provisionVersions[pasal.canonicalPath] === 'PREVIOUS';
                                  const hasPasalAmendment = Boolean(pasalDetail && pasalDetail.statusPerubahan !== 'ASLI');

                                  return (
                                    <div
                                      onClick={() => handleOpenInspector(pasal, chapter.label)}
                                      className={`flex items-start gap-3 py-2 px-2.5 rounded-lg transition-colors cursor-pointer ${
                                        activeNodePath === pasal.canonicalPath
                                          ? 'bg-red-50/90 text-slate-900 ring-2 ring-[#94191C]/80 font-medium shadow-2xs'
                                          : 'hover:bg-slate-100/70'
                                      }`}
                                    >
                                      <div className="min-w-[36px] sm:min-w-[42px] shrink-0 select-none text-right font-sans font-bold text-xs text-slate-400 pt-1">
                                        •
                                      </div>
                                      <div className="flex-1 min-w-0 space-y-1.5">
                                        {isPasalPreviousSelected ? (
                                          /* Tampilan Versi Sebelumnya untuk Pasal Satu Paragraf */
                                          <div className="p-3 sm:p-3.5 rounded-xl bg-amber-100/70 border-2 border-dashed border-amber-400 text-amber-950 font-serif shadow-xs ring-1 ring-amber-300/80">
                                            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-amber-300 text-[10.5px] font-mono font-bold text-amber-900">
                                              <span className="flex items-center gap-1.5">
                                                <History className="w-3.5 h-3.5 text-amber-700" />
                                                <span>ARSIP MASA LALU (NASKAH ASLI UU 11/2008) — TIDAK BERLAKU</span>
                                              </span>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setProvisionVersions((prev) => ({ ...prev, [pasal.canonicalPath]: 'CURRENT' }));
                                                }}
                                                className="text-amber-800 hover:text-amber-950 font-sans font-bold underline cursor-pointer text-[10px]"
                                              >
                                                Tampilkan Naskah Berlaku Terkini →
                                              </button>
                                            </div>
                                            <p className={`text-slate-900 text-justify leading-relaxed italic ${fontSizeClass}`}>
                                              {cleanLegalText(pasalDetail?.textSebelum || '(Naskah versi sebelumnya tidak tercatat)')}
                                            </p>
                                          </div>
                                        ) : (
                                          <p className={`flex-1 text-justify ${fontSizeClass} ${fontFamilyClass} text-slate-800`}>
                                            {cleanLegalText(pasal.content)}
                                          </p>
                                        )}

                                        {hasPasalAmendment && pasalDetail?.textSebelum && !isPasalPreviousSelected && (
                                          <div className="pt-1 flex justify-end">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setProvisionVersions((prev) => ({ ...prev, [pasal.canonicalPath]: 'PREVIOUS' }));
                                              }}
                                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-colors shadow-2xs cursor-pointer"
                                              title="Klik untuk melihat teks naskah sebelum amandemen"
                                            >
                                              <History className="w-3 h-3 text-amber-700" />
                                              <span>Lihat Naskah Sebelumnya</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Tanda Tangan Pengesahan Negara di Akhir Dokumen */}
                  <div className="mt-16 pt-10 border-t-2 border-slate-900 font-sans text-xs space-y-6">
                    <p className="text-slate-800 leading-relaxed font-serif text-[15px] text-justify">
                      Agar setiap orang mengetahuinya, memerintahkan pengundangan Undang-Undang ini dengan penempatannya dalam Lembaran Negara Republik Indonesia.
                    </p>

                    {/* Format Tanda Tangan Resmi Sesuai Lembaran Negara Republik Indonesia */}
                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-8 text-slate-800">
                      <div className="space-y-1">
                        <p className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold">Diundangkan di Jakarta</p>
                        <p className="text-slate-700 text-xs">pada tanggal 21 April 2008</p>
                        <p className="font-extrabold text-slate-900 uppercase mt-3 text-xs leading-snug">
                          MENTERI HUKUM DAN HAK ASASI MANUSIA<br />REPUBLIK INDONESIA,
                        </p>
                        <div className="py-4 text-xs font-serif italic text-slate-400">
                          [ttd.]
                        </div>
                        <p className="font-extrabold text-slate-900 uppercase text-xs">
                          ANDI MATTALATTA
                        </p>
                      </div>

                      <div className="space-y-1 sm:text-right">
                        <p className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold">Disahkan di Jakarta</p>
                        <p className="text-slate-700 text-xs">pada tanggal 21 April 2008</p>
                        <p className="font-extrabold text-slate-900 uppercase mt-3 text-xs leading-snug">
                          PRESIDEN REPUBLIK INDONESIA,
                        </p>
                        <div className="py-4 text-xs font-serif italic text-slate-400">
                          [ttd.]
                        </div>
                        <p className="font-extrabold text-slate-900 uppercase text-xs">
                          DR. H. SUSILO BAMBANG YUDHOYONO
                        </p>
                      </div>
                    </div>

                    {/* Lembaran Negara Footnote & Amandemen Inkorporasi */}
                    <div className="pt-6 border-t border-slate-200 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono text-slate-500">
                        <span>LEMBARAN NEGARA REPUBLIK INDONESIA TAHUN 2008 NOMOR 58</span>
                        <span>TAMBAHAN LEMBARAN NEGARA NOMOR 4843</span>
                      </div>
                      <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                        <span className="font-semibold text-slate-700">Catatan Salinan Konsolidasi:</span> Naskah ini telah dimutakhirkan secara deterministik dengan menginkorporasikan perubahan materiil berdasarkan <strong>UU No. 19 Tahun 2016</strong> (LNRI 2016 No. 251, TLN 5952) dan <strong>UU No. 1 Tahun 2024</strong> (LNRI 2024 No. 8, TLN 6916).
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </main>
        </section>

        {/* ── Sidebar Kanan: Panel Inspeksi Norma & Analisis Perubahan (HANYA MUNCUL KETIKA PASAL BERUBAH DIPILIH) ─── */}
        {inspectorNode && (
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
                    setInspectorNode(null);
                    setActiveNodePath('');
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
                {/* 1. KETERANGAN STATUS PERUBAHAN PALING ATAS (TEGAS, BESAR & MENCOLOK) */}
                <div className="space-y-2 pb-2 border-b border-slate-100">
                  {inspectorNode.amendmentDetail?.statusPerubahan === 'SISIPAN_BARU' ? (
                    <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-sm border border-emerald-500">
                      <div className="flex items-center justify-between gap-1 text-[10px] font-mono tracking-wider uppercase font-bold text-emerald-100 mb-1">
                        <span>TINDAKAN HUKUM (UU 12/2011)</span>
                        <span className="bg-emerald-800/80 px-1.5 py-0.5 rounded border border-emerald-400/40">SISIPAN</span>
                      </div>
                      <h4 className="font-sans font-black text-sm tracking-wide flex items-center gap-1.5">
                        <span>🟢</span>
                        <span>DISISIPKAN (NORMA SISIPAN BARU)</span>
                      </h4>
                      <p className="text-[11px] text-emerald-50/90 leading-relaxed mt-1 font-medium">
                        Ketentuan norma baru yang disisipkan di antara pasal yang ada tanpa merombak nomor urut pasal lainnya.
                      </p>
                    </div>
                  ) : inspectorNode.amendmentDetail?.statusPerubahan === 'DICABUT' ? (
                    <div className="p-3.5 rounded-xl bg-gradient-to-br from-rose-600 to-rose-700 text-white shadow-sm border border-rose-500">
                      <div className="flex items-center justify-between gap-1 text-[10px] font-mono tracking-wider uppercase font-bold text-rose-100 mb-1">
                        <span>TINDAKAN HUKUM (UU 12/2011)</span>
                        <span className="bg-rose-800/80 px-1.5 py-0.5 rounded border border-rose-400/40">DICABUT</span>
                      </div>
                      <h4 className="font-sans font-black text-sm tracking-wide flex items-center gap-1.5">
                        <span>🔴</span>
                        <span>DIHAPUS / DICABUT DARI HUKUM POSITIF</span>
                      </h4>
                      <p className="text-[11px] text-rose-50/90 leading-relaxed mt-1 font-medium">
                        Ketentuan norma ditiadakan secara permanen dan tidak lagi memiliki daya laku atau kekuatan hukum mengikat.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm border border-amber-400">
                      <div className="flex items-center justify-between gap-1 text-[10px] font-mono tracking-wider uppercase font-bold text-amber-100 mb-1">
                        <span>TINDAKAN HUKUM (UU 12/2011)</span>
                        <span className="bg-amber-700/80 px-1.5 py-0.5 rounded border border-amber-300/40">DIUBAH</span>
                      </div>
                      <h4 className="font-sans font-black text-sm tracking-wide flex items-center gap-1.5">
                        <span>🟡</span>
                        <span>DIUBAH (REDAKSI & SUBSTANSI DIPERBARUI)</span>
                      </h4>
                      <p className="text-[11px] text-amber-50/90 leading-relaxed mt-1 font-medium">
                        Rumusan teks kalimat dan materi muatan norma diperbaiki, disesuaikan, atau digantikan dengan konstruksi hukum baru.
                      </p>
                    </div>
                  )}

                  {/* Anotasi Tambahan Mahkamah Konstitusi jika ada */}
                  {inspectorNode.amendmentDetail?.putusanMk && (
                    <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 flex items-start gap-2 shadow-2xs">
                      <Scale className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                      <div className="text-[11px]">
                        <span className="font-bold text-purple-900 block">Terikat Putusan Mahkamah Konstitusi:</span>
                        <span className="font-medium text-purple-800">{inspectorNode.amendmentDetail.putusanMk.nomor}</span>
                      </div>
                    </div>
                  )}

                  {/* Label Nama Pasal Aktif */}
                  <div className="pt-1 flex items-baseline justify-between gap-2">
                    <h3 className="font-sans font-extrabold text-lg text-slate-900 leading-snug">
                      {inspectorNode.label}
                      {inspectorNode.parentLabel && (
                        <span className="text-slate-400 text-xs font-normal ml-2">({inspectorNode.parentLabel})</span>
                      )}
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {inspectorNode.canonicalPath}
                    </span>
                  </div>
                </div>

                {/* 2. KARTU ATURAN PENGUBAH DETAIL & BISA DIKLIK */}
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
                      {inspectorNode.amendmentDetail?.diubahOleh ? inspectorNode.amendmentDetail.diubahOleh.split(' (')[0] : 'UU No. 1 Tahun 2024'}
                    </h5>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Perubahan Kedua atas UU No. 11/2008 tentang Informasi dan Transaksi Elektronik
                    </p>
                  </div>

                  <div className="space-y-1 pt-1.5 border-t border-slate-200/70 text-[11px]">
                    <div className="flex items-start gap-1.5 text-slate-600">
                      <span className="text-slate-400 shrink-0 min-w-[75px]">Dasar Pasal:</span>
                      <span className="text-slate-900 font-semibold">
                        {inspectorNode.amendmentDetail?.diubahOleh?.includes('(')
                          ? inspectorNode.amendmentDetail.diubahOleh.split('(')[1].replace(')', '')
                          : 'Ketentuan Perubahan UU 1/2024'}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-600">
                      <span className="text-slate-400 shrink-0 min-w-[75px]">Pengesahan:</span>
                      <span className="text-slate-800 font-medium">
                        {inspectorNode.amendmentDetail?.tanggalPengundangan || '2 Januari 2024'}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-600">
                      <span className="text-slate-400 shrink-0 min-w-[75px]">Pengesah:</span>
                      <span className="text-slate-800 font-medium">
                        {inspectorNode.amendmentDetail?.disahkanOleh || 'Presiden RI Joko Widodo & Mensesneg Pratikno'}
                      </span>
                    </div>
                    {inspectorNode.amendmentDetail?.lembaranNegara && (
                      <div className="flex items-start gap-1.5 text-slate-600">
                        <span className="text-slate-400 shrink-0 min-w-[75px]">Publikasi:</span>
                        <span className="text-slate-800 font-mono text-[10px] leading-tight">
                          {inspectorNode.amendmentDetail.lembaranNegara}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tombol Tautan Klikable ke Aturan Pengubah */}
                  <Link
                    href={`/uu/${inspectorNode.amendmentDetail?.diubahOleh?.includes('19') ? 'uu-19-2016' : 'uu-1-2024'}`}
                    className="w-full py-2 px-3 rounded-lg bg-white border border-slate-200 hover:border-[#94191C] hover:bg-red-50/60 text-[#94191C] font-bold text-xs flex items-center justify-between transition-all group shadow-2xs mt-2 cursor-pointer"
                    title="Buka naskah undang-undang pengubah di platform ini"
                  >
                    <span className="flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span>Buka Naskah Lengkap Aturan Pengubah</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {/* 3. TAB SWITCHER SEGMENTED CONTROL */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
                  <button
                    onClick={() => setInspectorTab('diff')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                      inspectorTab === 'diff'
                        ? 'bg-white text-slate-900 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Komparasi Teks
                  </button>
                  <button
                    onClick={() => setInspectorTab('affected_list')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      inspectorTab === 'affected_list'
                        ? 'bg-white text-slate-900 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Pasal Terdampak</span>
                    <span className="w-4 h-4 rounded-full bg-red-100 text-[#94191C] text-[10px] flex items-center justify-center font-bold">
                      {ALL_AMENDED_PROVISIONS.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setInspectorTab('impact')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      inspectorTab === 'impact'
                        ? 'bg-white text-slate-900 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Turunan</span>
                    {inspectorNode.amendmentDetail?.peraturanTerdampak?.length ? (
                      <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">
                        {inspectorNode.amendmentDetail.peraturanTerdampak.length}
                      </span>
                    ) : null}
                  </button>
                  {inspectorNode.amendmentDetail?.putusanMk && (
                    <button
                      onClick={() => setInspectorTab('mk')}
                      className={`py-1.5 px-2.5 rounded-lg text-center transition-all cursor-pointer ${
                        inspectorTab === 'mk'
                          ? 'bg-white text-purple-900 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Putusan MK
                    </button>
                  )}
                </div>

                {/* Tab 1: Komparasi Teks (Before vs After) */}
                {inspectorTab === 'diff' && (
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
                        {inspectorNode.fromText || '(Belum diatur pada naskah awal)'}
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
                        {inspectorNode.toText || 'Norma berlaku sesuai naskah dokumen.'}
                      </p>
                    </div>

                    {/* Rasional Perubahan */}
                    {inspectorNode.amendmentDetail?.latarBelakangPerubahan && (
                      <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 text-[11px] text-slate-600 leading-relaxed">
                        <span className="font-semibold text-slate-800">Latar Belakang Perubahan: </span>
                        {inspectorNode.amendmentDetail.latarBelakangPerubahan}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Daftar Seluruh Pasal yang Terdampak Amandemen */}
                {inspectorTab === 'affected_list' && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pb-0.5">
                      <span>Daftar pasal yang disentuh oleh UU 1/2024:</span>
                      <span className="font-mono font-bold text-slate-700">{ALL_AMENDED_PROVISIONS.length} Ketentuan</span>
                    </div>

                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {ALL_AMENDED_PROVISIONS.map((item) => {
                        const isCurrentActive = inspectorNode.canonicalPath === item.canonicalPath;
                        return (
                          <div
                            key={item.canonicalPath}
                            onClick={() => {
                              scrollToNode(item.canonicalPath);
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
                              handleOpenInspector(dummyNode);
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
                {inspectorTab === 'impact' && (
                  <div className="space-y-3 pt-1">
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Peraturan turunan yang terdampak langsung oleh amandemen pasal ini:
                    </p>

                    <div className="space-y-2">
                      {inspectorNode.amendmentDetail?.peraturanTerdampak?.map((reg) => (
                        <div
                          key={reg.id}
                          onClick={() => setSelectedImpact(reg)}
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
                {inspectorTab === 'mk' && inspectorNode.amendmentDetail?.putusanMk && (
                  <div className="space-y-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2">
                      <div className="flex items-center gap-1.5 text-purple-950 font-bold text-xs">
                        <Scale className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                        <span>{inspectorNode.amendmentDetail.putusanMk.nomor}</span>
                      </div>
                      <p className="text-xs text-purple-950 font-serif italic leading-relaxed">
                        &ldquo;{inspectorNode.amendmentDetail.putusanMk.amarPutusan}&rdquo;
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
                      <span className="font-semibold text-slate-900 block mb-1">Pertimbangan Hukum (Ratio Decidendi):</span>
                      {inspectorNode.amendmentDetail.putusanMk.ratioDecidendi}
                    </div>
                  </div>
                )}

                {/* Clean Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => salinSitasi(inspectorNode)}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    {copiedCitation ? (
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
                      if (!currentUser) setShowLoginPrompt(true);
                      else setShowAiModal(true);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-red-200" />
                    <span>Analisis AI</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}
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

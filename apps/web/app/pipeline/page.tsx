'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Activity, Play, Square, RotateCcw, CheckCircle2,
  AlertTriangle, ShieldCheck, Database, Cpu, FileText, Search,
  Download, GitBranch, ArrowRight, Layers, Terminal, Sparkles,
  RefreshCw, Check, Clock, Server, FileCode, CheckCheck,
  AlertCircle, ExternalLink, Zap, Radio, BookOpen, Hash, Eye,
  SlidersHorizontal, ChevronRight, CornerDownRight, FolderTree, Network
} from 'lucide-react';

import FamilyQueueTab from './components/FamilyQueueTab';
import InteractiveParsingTab from './components/InteractiveParsingTab';
import ParsingCorrectionTab from './components/ParsingCorrectionTab';
import LawConnectivityTrackerTab from './components/LawConnectivityTrackerTab';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface WorkerStats {
  total_indexed: number;
  processed: number;
  published: number;
  quarantined: number;
  errors: number;
}

interface WorkerTelemetry {
  state: 'IDLE' | 'RUNNING' | 'STOPPED';
  phase: string;
  pid: number | null;
  currentSlug: string | null;
  currentTitle: string | null;
  lastHeartbeat: string | null;
  stats: WorkerStats;
}

interface CheckpointData {
  totalProcessed: number;
  lastRun: string | null;
  processedCount: number;
}

interface CrawlerStatusResponse {
  success: boolean;
  worker: WorkerTelemetry;
  checkpoint: CheckpointData;
  queue: {
    totalIndexed: number;
    totalRich: number;
    pending: number;
  };
  logs: string[];
  timestamp: string;
}

interface MonitoringTotals {
  katalog: {
    total: number;
    terdaftar: number;
    terunduh: number;
    terparse: number;
    lolos: number;
    karantina: number;
    gagalUnduh: number;
    gagalParse: number;
  };
  perTahunUU: { tahun: string; jumlah: number }[];
  database: {
    instruments: number;
    provisions: number;
    teraSkor: number;
    rataSkor: number | null;
  };
  dihitungPada: string;
}

interface QueueRow {
  slug: string;
  nomor: string | null;
  tahun: string | null;
  status: string;
  skor: number | null;
  pasal: number;
  ayat: number;
  perubahan: number;
}

interface ConsolidatedLawItem {
  id: string;
  slug: string;
  label: string;
  title: string;
  status: string;
  score: number | null;
  publishMode: string | null;
  provisionsCount: number;
  amendmentsReceived: number;
  amendmentsMade: number;
}

interface RecentOperation {
  id: string;
  type: string;
  targetPath: string;
  sourceReference: string;
  changeSetTitle: string;
  amending: string;
  target: string;
}

type StationStep = 1 | 2 | 3 | 4 | 5;
type MainTab = 'OVERVIEW' | 'FAMILIES' | 'PARSER' | 'QA_CORRECTION' | 'CONNECTIVITY';

export default function RealtimePipelinePage() {
  // Tab Navigation Utama
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('OVERVIEW');

  // Telemetri data
  const [crawlerData, setCrawlerData] = useState<CrawlerStatusResponse | null>(null);
  const [monitoringTotals, setMonitoringTotals] = useState<MonitoringTotals | null>(null);
  const [queueRows, setQueueRows] = useState<QueueRow[]>([]);
  const [consolidatedLaws, setConsolidatedLaws] = useState<ConsolidatedLawItem[]>([]);
  const [recentOperations, setRecentOperations] = useState<RecentOperation[]>([]);

  // State kendali
  const [activeStation, setActiveStation] = useState<StationStep>(1);
  const [activeQueueTab, setActiveQueueTab] = useState<'LOLOS' | 'KARANTINA' | 'TERDAFTAR'>('LOLOS');
  const [activeConsoleTab, setActiveConsoleTab] = useState<'LOGS' | 'QUEUE' | 'STATS'>('LOGS');
  const [pollingInterval, setPollingInterval] = useState<number>(2000); // 2 detik
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const logBottomRef = useRef<HTMLDivElement>(null);

  // 1. Fetching telemetri utama
  const fetchAllTelemetry = async () => {
    try {
      const [resCrawler, resTotals, resConsolidation] = await Promise.all([
        fetch(`${API_BASE}/api/v1/monitoring/crawler`).then((r) => r.ok ? r.json() : null),
        fetch(`${API_BASE}/api/v1/monitoring`).then((r) => r.ok ? r.json() : null),
        fetch(`${API_BASE}/api/v1/monitoring/consolidations`).then((r) => r.ok ? r.json() : null),
      ]);

      if (resCrawler && resCrawler.success) {
        setCrawlerData(resCrawler);
        if (resCrawler.worker?.state === 'RUNNING') {
          const ph = resCrawler.worker.phase;
          if (ph.includes('SCRAPING')) setActiveStation(1);
          else if (ph.includes('DOWNLOADING')) setActiveStation(2);
          else if (ph.includes('PARSING') || ph.includes('QA')) setActiveStation(3);
          else if (ph.includes('WEAVING') || ph.includes('INGESTING')) setActiveStation(4);
        }
      }

      if (resTotals) setMonitoringTotals(resTotals);

      if (resConsolidation && resConsolidation.success) {
        setConsolidatedLaws(resConsolidation.instruments || []);
        setRecentOperations(resConsolidation.recentOperations || []);
      }

      setErrorMsg(null);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
    }
  };

  // 2. Fetch antrean dokumen sesuai tab
  const fetchQueueData = async (status: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/monitoring/queue?status=${status}&jenis=UU&limit=30`);
      if (res.ok) {
        const json = await res.json();
        setQueueRows(json.antrean || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAllTelemetry();
    const timer = setInterval(fetchAllTelemetry, pollingInterval);
    return () => clearInterval(timer);
  }, [pollingInterval]);

  useEffect(() => {
    fetchQueueData(activeQueueTab);
  }, [activeQueueTab]);

  useEffect(() => {
    if (activeConsoleTab === 'LOGS' && logBottomRef.current) {
      logBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [crawlerData?.logs, activeConsoleTab]);

  // Pergantian Tab dengan Smooth Scroll Reset
  const handleTabChange = (tab: MainTab) => {
    setActiveMainTab(tab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Aksi stop worker background (darurat / kendali sistem)
  const handleStopWorker = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/monitoring/crawler/stop`, {
        method: 'POST',
      });
      const json = await res.json();
      setTriggerMsg(json.message || 'Signal henti dikirim');
      fetchAllTelemetry();
    } catch (e) {
      setTriggerMsg(`Gagal henti: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const isWorkerRunning = crawlerData?.worker?.state === 'RUNNING';

  // 5 Gerbong Stasiun
  const stations = [
    {
      id: 1 as StationStep,
      title: '1. Scraper JDIH BPK',
      subtitle: 'Pemanenan Hulu',
      icon: Download,
      desc: 'Pengambilan metadata resmi dan deteksi relasi amandemen dengan ethical rate limiting.',
      color: 'from-blue-600 to-cyan-600',
      activeColor: 'border-cyan-500 bg-cyan-950/40 text-cyan-300',
    },
    {
      id: 2 as StationStep,
      title: '2. Gudang Antrean',
      subtitle: 'Buffer & Checkpoint',
      icon: Database,
      desc: 'Penyimpanan berkas PDF resmi, verifikasi SHA-256 hash, dan antrean resumable.',
      color: 'from-amber-600 to-orange-600',
      activeColor: 'border-amber-500 bg-amber-950/40 text-amber-300',
    },
    {
      id: 3 as StationStep,
      title: '3. Parser AST & QA',
      subtitle: 'Bedah Norma & Skor',
      icon: Cpu,
      desc: 'Pembedahan struktur hierarki Bab/Pasal/Ayat/Huruf dan uji mutu kualitas (Skor 0-100).',
      color: 'from-indigo-600 to-purple-600',
      activeColor: 'border-indigo-500 bg-indigo-950/40 text-indigo-300',
    },
    {
      id: 4 as StationStep,
      title: '4. Tenun Relasi',
      subtitle: 'Weave Changeset',
      icon: GitBranch,
      desc: 'Pencocokan UU Pengubah ke UU Pokok: deteksi operasi INSERT, REPLACE, REPEAL, dan Putusan MK.',
      color: 'from-rose-600 to-red-600',
      activeColor: 'border-rose-500 bg-rose-950/40 text-rose-300',
    },
    {
      id: 5 as StationStep,
      title: '5. Launching Jadi',
      subtitle: 'Naskah Konsolidasi',
      icon: Sparkles,
      desc: 'Rekonstruksi deterministik naskah utuh dengan legal diff bar, siap tayang di publik.',
      color: 'from-emerald-600 to-teal-600',
      activeColor: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#0A0D14] text-slate-100 font-sans min-h-screen">
      {/* ── Top Header & Telemetry Bar (Pure Real-time Observer) ──────────────── */}
      <header className="border-b border-white/10 bg-[#0F1420]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#94191C]/30 text-rose-300 border border-[#94191C]/50">
                <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
                SIPAKA PIPELINE MONITOR
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-400 font-mono">Visualisasi Real-Time Pemanenan &amp; Konsolidasi UU</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              Visualisasi Pipeline Otomatis
              {isWorkerRunning ? (
                <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  WORKER BACKGROUND AKTIF (PID: {crawlerData?.worker?.pid})
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 border border-white/10 font-mono">
                  SISTEM OTOMATIS: STANDBY (TERJADWAL PER-KLUSTER)
                </span>
              )}
            </h1>
          </div>

          {/* Telemetri & Refresh Controls (Pure Visualizer, Tanpa Tombol Pemicu Manual) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isWorkerRunning ? (
              <button
                onClick={handleStopWorker}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-rose-900/30 cursor-pointer"
                title="Hentikan background worker yang sedang berjalan"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Hentikan Worker</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs font-mono text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Pemanenan Mandiri Per-Kluster</span>
              </div>
            )}

            {/* Polling Interval Select */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-mono text-slate-300">
              <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: `${pollingInterval / 1000}s` }} />
              <select
                value={pollingInterval}
                onChange={(e) => setPollingInterval(Number(e.target.value))}
                aria-label="Pilih Interval Pembaruan Data"
                className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer text-xs"
              >
                <option value={1000} className="bg-slate-900">1 dtk (Kilat)</option>
                <option value={2000} className="bg-slate-900">2 dtk (Normal)</option>
                <option value={5000} className="bg-slate-900">5 dtk (Hemat)</option>
              </select>
            </div>

            <button
              onClick={fetchAllTelemetry}
              title="Segarkan data seketika"
              className="p-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {triggerMsg && (
          <div className="max-w-7xl mx-auto mt-3 px-3 py-2 rounded-xl text-xs font-mono font-medium bg-emerald-950/70 border border-emerald-500/40 text-emerald-200">
            {triggerMsg}
          </div>
        )}
      </header>

      {/* ── 5 Tab Navigasi Utama Ruang Kerja Pipeline (Sticky & Auto-Scroll) ──────────────── */}
      <nav className="border-b border-white/10 bg-[#0F1420]/95 backdrop-blur-md sticky top-[61px] z-30 px-4 sm:px-6 shadow-lg shadow-black/30">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar">
          <button
            onClick={() => handleTabChange('OVERVIEW')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
              activeMainTab === 'OVERVIEW'
                ? 'bg-[#94191C] text-white shadow-md shadow-rose-950/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Pabrik &amp; Telemetri Live</span>
          </button>

          <button
            onClick={() => handleTabChange('FAMILIES')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
              activeMainTab === 'FAMILIES'
                ? 'bg-[#94191C] text-white shadow-md shadow-rose-950/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
            <span>Keluarga Regulasi &amp; Antrean Download</span>
          </button>

          <button
            onClick={() => handleTabChange('PARSER')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
              activeMainTab === 'PARSER'
                ? 'bg-[#94191C] text-white shadow-md shadow-rose-950/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Proses Parsing Interaktif</span>
          </button>

          <button
            onClick={() => handleTabChange('QA_CORRECTION')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
              activeMainTab === 'QA_CORRECTION'
                ? 'bg-[#94191C] text-white shadow-md shadow-rose-950/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Koreksi &amp; Auto-Healing QA</span>
          </button>

          <button
            onClick={() => handleTabChange('CONNECTIVITY')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
              activeMainTab === 'CONNECTIVITY'
                ? 'bg-[#94191C] text-white shadow-md shadow-rose-950/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-emerald-400" />
            <span>Koneksi Relasi &amp; Mutasi 1 UU</span>
          </button>
        </div>
      </nav>

      {/* ── Quick KPI Telemetry Ribbon ────────────────────────────── */}
      <section className="border-b border-white/5 bg-[#0C101A] px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">1. Indeks BPK</span>
            <span className="text-xl font-black text-white font-mono">{monitoringTotals?.katalog.total.toLocaleString('id-ID') ?? '1.325'}</span>
            <span className="text-[10px] text-slate-500 block">dokumen terdata</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
            <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">2. Antrean Menunggu</span>
            <span className="text-xl font-black text-cyan-300 font-mono">{crawlerData?.queue?.pending.toLocaleString('id-ID') ?? '1.324'}</span>
            <span className="text-[10px] text-cyan-500/80 block">siap dipanen</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
            <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold block">3. Terproses Mesin</span>
            <span className="text-xl font-black text-indigo-300 font-mono">{crawlerData?.checkpoint?.totalProcessed ?? 1}</span>
            <span className="text-[10px] text-indigo-400/80 block">telah diekstraksi</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
            <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">4. Lolos QA (100)</span>
            <span className="text-xl font-black text-emerald-300 font-mono">{monitoringTotals?.katalog.lolos ?? 14}</span>
            <span className="text-[10px] text-emerald-500/80 block">AUTO_PUBLISH</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">5. Karantina Layout</span>
            <span className="text-xl font-black text-amber-300 font-mono">{monitoringTotals?.katalog.karantina ?? 15}</span>
            <span className="text-[10px] text-amber-500/80 block">perlu kurasi</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
            <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block">6. Di MariaDB</span>
            <span className="text-xl font-black text-white font-mono">{monitoringTotals?.database.instruments ?? 21} UU</span>
            <span className="text-[10px] text-rose-400/80 block">{monitoringTotals?.database.provisions.toLocaleString('id-ID') ?? '3.260'} pasal aktif</span>
          </div>
        </div>
      </section>

      {/* ── Main Production Content Area ───────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        {/* TAB 1: OVERVIEW (Conveyor 5 Gerbong + Terminal Live) */}
        {activeMainTab === 'OVERVIEW' && (
          <div className="space-y-8">
            {/* Conveyor Station Stepper Header */}
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                Rantai Alur Pemanenan &amp; Rekonstruksi Hukum (End-to-End Factory Floor):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                {stations.map((s) => {
                  const Icon = s.icon;
                  const isActive = activeStation === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveStation(s.id)}
                      className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                        isActive
                          ? s.activeColor + ' shadow-lg scale-[1.02]'
                          : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:bg-white/[0.04]'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full pointer-events-none" />
                      )}
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-mono font-bold uppercase tracking-wider">{s.subtitle}</span>
                      </div>
                      <h3 className="font-bold text-sm text-white">{s.title}</h3>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Station Stage Details Display */}
            <div className="bg-[#0F1420] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

              {/* Gerbong 1 */}
              {activeStation === 1 && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        <Download className="w-6 h-6 animate-bounce" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-white">Stasiun 1: Crawler Pemanenan JDIH BPK RI</h2>
                        <p className="text-xs text-slate-400">Pemanenan berkala terotomasi dengan perlindungan *Ethical Rate Limiting* (1.5s–3s jitter).</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                        Delay Etis: <strong>1.5 dtk</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        Status: {crawlerData?.worker?.state || 'IDLE'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                      <h4 className="text-xs font-mono font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
                        <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                        Target Pemanenan Sedang Berjalan:
                      </h4>
                      {crawlerData?.worker?.currentSlug ? (
                        <div className="space-y-2">
                          <p className="text-sm font-bold text-white font-mono break-all">{crawlerData.worker.currentSlug}</p>
                          <p className="text-xs text-slate-300">{crawlerData.worker.currentTitle || 'Sedang mengunduh dokumen resmi...'}</p>
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60">
                            <span>Fase Aktif:</span>
                            <strong>{crawlerData.worker.phase}</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 text-center text-slate-500 text-xs font-mono">
                          Tidak ada dokumen aktif yang sedang di-scrape detik ini. Worker dalam kondisi standby.
                        </div>
                      )}
                    </div>

                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                      <h4 className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Parameter Integritas Jaringan &amp; Anti-Blocking:
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                          <span className="text-slate-500 text-[10px] block">Target Domain</span>
                          <span className="text-slate-200 font-bold">peraturan.bpk.go.id</span>
                        </div>
                        <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                          <span className="text-slate-500 text-[10px] block">Checkpoint Store</span>
                          <span className="text-emerald-400 font-bold">crawler_checkpoint.json</span>
                        </div>
                        <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                          <span className="text-slate-500 text-[10px] block">Detak Jantung</span>
                          <span className="text-slate-300 truncate block">
                            {crawlerData?.worker?.lastHeartbeat ? new Date(crawlerData.worker.lastHeartbeat).toLocaleTimeString('id-ID') : 'Aktif'}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                          <span className="text-slate-500 text-[10px] block">Graceful Shutdown</span>
                          <span className="text-amber-300 font-bold">SIGINT / SIGTERM OK</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Gerbong 2 */}
              {activeStation === 2 && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Database className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-white">Stasiun 2: Gudang Antrean &amp; Hash Checkpoint</h2>
                        <p className="text-xs text-slate-400">Menyimpan berkas mentah PDF dan menjamin pemrosesan idempoten (zero duplication).</p>
                      </div>
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      Total Tersimpan: <strong>{crawlerData?.checkpoint?.totalProcessed ?? 0} diproses</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                      <span className="text-slate-500 block mb-1">Total Antrean Terindeks</span>
                      <span className="text-2xl font-black text-white">{crawlerData?.queue?.totalIndexed ?? 1325}</span>
                      <p className="text-[11px] text-slate-400 mt-1">Berasal dari katalog resmi Lembaran Negara BPK</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                      <span className="text-slate-500 block mb-1">Status Checkpoint</span>
                      <span className="text-2xl font-black text-amber-300">{crawlerData?.queue?.pending ?? 1324} tertunda</span>
                      <p className="text-[11px] text-slate-400 mt-1">Dapat di-resume kapan saja tanpa mengulang</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                      <span className="text-slate-500 block mb-1">Integritas Checksum</span>
                      <span className="text-2xl font-black text-emerald-400">SHA-256</span>
                      <p className="text-[11px] text-slate-400 mt-1">Semua unduhan diverifikasi anti-tamper</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Gerbong 3 */}
              {activeStation === 3 && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        <Cpu className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-white">Stasiun 3: Dapur Parser AST &amp; Scorecard QA</h2>
                        <p className="text-xs text-slate-400">Membedah teks PDF menjadi pohon norma hierarkis dan menguji integritas pasal.</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveMainTab('PARSER')}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Buka Simulator Parsing</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
                      <h4 className="font-bold text-white mb-1">Uji Urutan Numerik</h4>
                      <p className="text-slate-400 leading-relaxed">
                        Memastikan Pasal 1 s.d. Pasal N urut tanpa ada nomor pasal yang terlewati atau tertukar.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
                      <h4 className="font-bold text-white mb-1">Pembersihan OCR Catchwords</h4>
                      <p className="text-slate-400 leading-relaxed">
                        Menghapus otomatis teks running header, nomor halaman cetak lama BPK, dan artefak pemisah.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                      <Layers className="w-5 h-5 text-cyan-400 mb-2" />
                      <h4 className="font-bold text-white mb-1">Hierarki AST Lengkap</h4>
                      <p className="text-slate-400 leading-relaxed">
                        Mengekstrak Buku ➔ Bab ➔ Bagian ➔ Paragraf ➔ Pasal ➔ Ayat ➔ Huruf secara deterministik.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                      <AlertTriangle className="w-5 h-5 text-amber-400 mb-2" />
                      <h4 className="font-bold text-white mb-1">Karantina Anomali</h4>
                      <p className="text-slate-400 leading-relaxed">
                        Dokumen hasil scan miring atau tabel multi-kolom diisolasi ke status KARANTINA untuk verifikasi.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Gerbong 4 */}
              {activeStation === 4 && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <GitBranch className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-white">Stasiun 4: Menenun Relasi Hukum (Weaving Engine)</h2>
                        <p className="text-xs text-slate-400">Mendeteksi pasangan UU Pokok vs UU Pengubah, mengekstrak operasi mutasi teks pasal.</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveMainTab('CONNECTIVITY')}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Buka Pelacakan Mutasi 1 UU</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 mb-3 flex items-center justify-between">
                      <span>Daftar Mutasi Perubahan Hukum Nyata di Database:</span>
                      <span className="text-slate-500 text-[10px]">Tabel change_operations</span>
                    </h4>

                    <div className="space-y-2 font-mono text-xs">
                      {recentOperations.map((op) => (
                        <div key={op.id} className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              op.type.includes('ADD') ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                              op.type.includes('REPLACE') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {op.type}
                            </span>
                            <span className="text-white font-bold">{op.targetPath}</span>
                            <span className="text-slate-500 text-[11px]">({op.sourceReference})</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span>{op.amending}</span>
                            <ArrowRight className="w-3 h-3 text-slate-600" />
                            <span className="text-slate-200">{op.target}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Gerbong 5 */}
              {activeStation === 5 && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-white">Stasiun 5: Etalase Launching &amp; Naskah Konsolidasi Jadi</h2>
                        <p className="text-xs text-slate-400">Naskah hukum utuh hasil rekonstruksi deterministik siap dinikmati publik di Reader.</p>
                      </div>
                    </div>

                    <Link
                      href="/katalog"
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <span>Buka Semua di Katalog</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {consolidatedLaws.map((law) => (
                      <div
                        key={law.id}
                        className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/50 transition-all flex flex-col justify-between gap-3 group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                              {law.label}
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              law.status === 'DIUBAH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                              'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}>
                              {law.status}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                            {law.title}
                          </h4>
                          <p className="text-xs text-slate-400 font-mono mt-1">
                            {law.provisionsCount.toLocaleString('id-ID')} Pasal/Ayat Aktif
                          </p>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                          <span className="text-[10px] font-mono text-emerald-400">Skor: {law.score ?? 100}/100</span>
                          <Link
                            href={`/uu/${law.slug}`}
                            className="font-bold text-xs text-white group-hover:text-emerald-300 flex items-center gap-1"
                          >
                            <span>Baca Naskah</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Live Console Terminal & Antrean Dokumen */}
            <section className="bg-[#0B0F19] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 bg-black/30">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveConsoleTab('LOGS')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeConsoleTab === 'LOGS'
                        ? 'bg-[#94191C] text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Live Log Harvester</span>
                  </button>

                  <button
                    onClick={() => setActiveConsoleTab('QUEUE')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeConsoleTab === 'QUEUE'
                        ? 'bg-[#94191C] text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Antrean Dokumen ({monitoringTotals?.katalog.total ?? 1325})</span>
                  </button>

                  <button
                    onClick={() => setActiveConsoleTab('STATS')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeConsoleTab === 'STATS'
                        ? 'bg-[#94191C] text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Sebaran Tahun UU</span>
                  </button>
                </div>

                <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                  Port: 4000 (API) · Port: 3307 (MariaDB)
                </span>
              </div>

              {activeConsoleTab === 'LOGS' && (
                <div className="p-4 sm:p-5 font-mono text-xs max-h-96 overflow-y-auto bg-black/60 text-slate-300 space-y-1 selection:bg-amber-400 selection:text-black">
                  {crawlerData?.logs && crawlerData.logs.length > 0 ? (
                    crawlerData.logs.map((logLine, idx) => {
                      const isWarn = logLine.includes('[WARNING]') || logLine.includes('403') || logLine.includes('Gagal');
                      const isQa = logLine.includes('[QA Gate]') || logLine.includes('AUTO_PUBLISH');
                      const isInfo = logLine.includes('[INFO]');
                      return (
                        <div
                          key={idx}
                          className={`leading-relaxed break-all ${
                            isWarn ? 'text-amber-300 bg-amber-950/20 px-1 rounded' :
                            isQa ? 'text-emerald-300 font-bold' :
                            isInfo ? 'text-slate-300' : 'text-slate-400'
                          }`}
                        >
                          {logLine}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-slate-500">
                      Belum ada log baru. Klik tombol &quot;Picu Batch 5 UU&quot; di atas untuk memulai pemanenan langsung.
                    </div>
                  )}
                  <div ref={logBottomRef} />
                </div>
              )}

              {activeConsoleTab === 'QUEUE' && (
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      {(['LOLOS', 'KARANTINA', 'TERDAFTAR'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setActiveQueueTab(st)}
                          className={`px-3 py-1 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                            activeQueueTab === st
                              ? 'bg-white/10 text-white border-white/20'
                              : 'bg-black/20 text-slate-400 border-white/5 hover:text-white'
                          }`}
                        >
                          {st} ({st === 'LOLOS' ? monitoringTotals?.katalog.lolos ?? 14 :
                                 st === 'KARANTINA' ? monitoringTotals?.katalog.karantina ?? 15 :
                                 monitoringTotals?.katalog.terdaftar ?? 1293})
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">Menampilkan 30 dokumen pertama</span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-white/[0.04] text-slate-400 border-b border-white/10">
                        <tr>
                          <th className="py-2.5 px-3">No</th>
                          <th className="py-2.5 px-3">Identitas Dokumen</th>
                          <th className="py-2.5 px-3">Tahun</th>
                          <th className="py-2.5 px-3">Skor Mutu</th>
                          <th className="py-2.5 px-3">Pasal / Ayat</th>
                          <th className="py-2.5 px-3">Mutasi</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {queueRows.map((row, idx) => (
                          <tr key={row.slug + idx} className="hover:bg-white/[0.02]">
                            <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-white">
                              {row.nomor ? `UU No. ${row.nomor} Thn ${row.tahun}` : row.slug}
                            </td>
                            <td className="py-2.5 px-3">{row.tahun || '—'}</td>
                            <td className="py-2.5 px-3">
                              {row.skor !== null ? (
                                <span className={row.skor === 100 ? 'text-emerald-300 font-bold' : 'text-amber-300 font-bold'}>
                                  {row.skor}/100
                                </span>
                              ) : '—'}
                            </td>
                            <td className="py-2.5 px-3">
                              {row.pasal} ps / {row.ayat} ay
                            </td>
                            <td className="py-2.5 px-3 text-rose-300">
                              {row.perubahan > 0 ? `${row.perubahan} mutasi` : '0'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                row.status === 'LOLOS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                row.status === 'KARANTINA' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                'bg-slate-800 text-slate-300'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeConsoleTab === 'STATS' && (
                <div className="p-5 space-y-4">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400">
                    Sebaran Katalog Peraturan per Tahun (Terdaftar di Antrean Hulu):
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 font-mono">
                    {monitoringTotals?.perTahunUU?.map((item) => (
                      <div key={item.tahun} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="text-xs text-slate-400 block">Tahun {item.tahun}</span>
                        <span className="text-lg font-black text-amber-300">{item.jumlah} UU</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 2: KELUARGA REGULASI & ANTREAN DOWNLOAD */}
        {activeMainTab === 'FAMILIES' && (
          <FamilyQueueTab
            onSelectStation={(s) => {
              handleTabChange('OVERVIEW');
              setActiveStation(s);
            }}
          />
        )}

        {/* TAB 3: PROSES PARSING INTERAKTIF */}
        {activeMainTab === 'PARSER' && (
          <InteractiveParsingTab />
        )}

        {/* TAB 4: KOREKSI HASIL PARSING & AUTO-HEALING */}
        {activeMainTab === 'QA_CORRECTION' && (
          <ParsingCorrectionTab />
        )}

        {/* TAB 5: KONEKSI RELASI & TRACKING PERUBAHAN 1 UU */}
        {activeMainTab === 'CONNECTIVITY' && (
          <LawConnectivityTrackerTab />
        )}
      </main>
    </div>
  );
}

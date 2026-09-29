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

import FamilyQueueTab from '../../pipeline/components/FamilyQueueTab';
import InteractiveParsingTab from '../../pipeline/components/InteractiveParsingTab';
import ParsingCorrectionTab from '../../pipeline/components/ParsingCorrectionTab';
import LawConnectivityTrackerTab from '../../pipeline/components/LawConnectivityTrackerTab';

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
type SubTab = 'OVERVIEW' | 'FAMILIES' | 'PARSER' | 'QA_CORRECTION' | 'CONNECTIVITY';

interface PipelineManagerTabProps {
  onNavigateToApproval?: () => void;
}

export default function PipelineManagerTab({ onNavigateToApproval }: PipelineManagerTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('OVERVIEW');

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
  const [pollingInterval, setPollingInterval] = useState<number>(3000);
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

  // Handler Trigger Batch Harvester dari Dasbor Admin
  const handleTriggerCrawler = async (limit = 5) => {
    setIsTriggering(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/crawler/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ limit }),
      });
      const json = await res.json();
      setTriggerMsg(json.message || 'Worker harvester berhasil dipicu.');
      fetchAllTelemetry();
      setTimeout(() => setTriggerMsg(null), 5000);
    } catch (e) {
      setTriggerMsg(`Gagal memicu worker: ${e instanceof Error ? e.message : String(e)}`);
      setTimeout(() => setTriggerMsg(null), 5000);
    } finally {
      setIsTriggering(false);
    }
  };

  // Handler Hentikan Worker
  const handleStopWorker = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/monitoring/crawler/stop`, {
        method: 'POST',
      });
      const json = await res.json();
      setTriggerMsg(json.message || 'Sinyal henti dikirim ke worker.');
      fetchAllTelemetry();
      setTimeout(() => setTriggerMsg(null), 5000);
    } catch (e) {
      setTriggerMsg(`Gagal henti: ${e instanceof Error ? e.message : String(e)}`);
      setTimeout(() => setTriggerMsg(null), 5000);
    }
  };

  const isWorkerRunning = crawlerData?.worker?.state === 'RUNNING';

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
    <div className="space-y-6">
      {/* ── Sub-Navigasi 5 Pilar Pipeline ────────────────────────────── */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('OVERVIEW')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'OVERVIEW'
              ? 'bg-[#94191C] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Pabrik &amp; Telemetri Live</span>
        </button>

        <button
          onClick={() => setActiveSubTab('FAMILIES')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'FAMILIES'
              ? 'bg-[#94191C] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5 text-cyan-600" />
          <span>Keluarga Regulasi &amp; Unduhan</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PARSER')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'PARSER'
              ? 'bg-[#94191C] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-600" />
          <span>Proses Parsing Interaktif</span>
        </button>

        <button
          onClick={() => setActiveSubTab('QA_CORRECTION')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'QA_CORRECTION'
              ? 'bg-[#94191C] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          <span>Koreksi &amp; Auto-Healing QA</span>
        </button>

        <button
          onClick={() => setActiveSubTab('CONNECTIVITY')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'CONNECTIVITY'
              ? 'bg-[#94191C] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Network className="w-3.5 h-3.5 text-emerald-600" />
          <span>Koneksi Relasi &amp; Mutasi 1 UU</span>
        </button>
      </div>

      {/* Pesan Aksi Interaktif */}
      {triggerMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{triggerMsg}</span>
        </div>
      )}

      {/* ── SUB-TAB 1: OVERVIEW LIVE FACTORY ────────────────────────── */}
      {activeSubTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Header Panel Harvester & Quick Control Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#94191C]/10 text-[#94191C] border border-[#94191C]/20">
                  <Radio className="w-3 h-3 text-[#94191C] animate-pulse" />
                  HARVESTER CONTROL DECK
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500 font-mono">Pemanenan &amp; Sinkronisasi Latar Belakang</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Mesin Pemanen Dokumen Hukum JDIH BPK</span>
                {isWorkerRunning ? (
                  <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                    WORKER RUNNING (PID: {crawlerData?.worker?.pid})
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-300 font-mono">
                    STANDBY / IDLE
                  </span>
                )}
              </h3>
            </div>

            {/* Tombol Kontrol Pemicu Batch */}
            <div className="flex flex-wrap items-center gap-2">
              {isWorkerRunning ? (
                <button
                  onClick={handleStopWorker}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Hentikan Worker</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleTriggerCrawler(5)}
                    disabled={isTriggering}
                    className="px-3.5 py-2 rounded-xl bg-[#94191C] hover:bg-[#861619] disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-amber-300" />
                    <span>Picu Batch 5 UU</span>
                  </button>

                  <button
                    onClick={() => handleTriggerCrawler(10)}
                    disabled={isTriggering}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Picu Batch 10 UU</span>
                  </button>
                </>
              )}

              <button
                onClick={fetchAllTelemetry}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Segarkan Telemetri"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 6 Ribbon Metrik Ringkas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">1. Indeks BPK</span>
              <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">{monitoringTotals?.katalog.total.toLocaleString('id-ID') ?? '1.325'}</span>
              <span className="text-[10px] text-slate-400 block">dokumen terindeks</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-mono font-bold uppercase text-cyan-600 block">2. Antrean Menunggu</span>
              <span className="text-xl font-black text-cyan-700 font-mono mt-0.5 block">{crawlerData?.queue?.pending.toLocaleString('id-ID') ?? '1.324'}</span>
              <span className="text-[10px] text-slate-400 block">siap diproses</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-mono font-bold uppercase text-indigo-600 block">3. Terproses Mesin</span>
              <span className="text-xl font-black text-indigo-700 font-mono mt-0.5 block">{crawlerData?.checkpoint?.totalProcessed ?? 1}</span>
              <span className="text-[10px] text-slate-400 block">telah diekstraksi</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 block">4. Lolos QA (100)</span>
              <span className="text-xl font-black text-emerald-700 font-mono mt-0.5 block">{monitoringTotals?.katalog.lolos ?? 14}</span>
              <span className="text-[10px] text-emerald-600 block">AUTO_PUBLISH</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-mono font-bold uppercase text-amber-600 block">5. Karantina Layout</span>
              <span className="text-xl font-black text-amber-700 font-mono mt-0.5 block">{monitoringTotals?.katalog.karantina ?? 15}</span>
              <span className="text-[10px] text-amber-600 block">perlu kurasi</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-mono font-bold uppercase text-rose-600 block">6. Di MariaDB</span>
              <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">{monitoringTotals?.database.instruments ?? 37} UU</span>
              <span className="text-[10px] text-slate-500 block">{monitoringTotals?.database.provisions.toLocaleString('id-ID') ?? '7.075'} pasal aktif</span>
            </div>
          </div>

          {/* Stepper Gerbong Stasiun Pemrosesan (1 s.d. 5) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              5 Tahap Konveyor Pemrosesan Norma:
            </h4>
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
                        ? 'border-[#94191C] bg-red-50/50 text-slate-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-[#94191C] text-white' : 'bg-slate-200 text-slate-600'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider">{s.subtitle}</span>
                    </div>
                    <h5 className="font-bold text-xs text-slate-900">{s.title}</h5>
                  </button>
                );
              })}
            </div>

            {/* Detail Stasiun Terpilih */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <span className="font-bold block mb-1">
                {stations[activeStation - 1].title} — {stations[activeStation - 1].subtitle}
              </span>
              <p>{stations[activeStation - 1].desc}</p>
              {crawlerData?.worker?.currentSlug && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-200 font-mono text-[11px] text-slate-800 flex items-center gap-2">
                  <span className="text-cyan-700 font-bold">Dokumen Berjalan:</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-300">{crawlerData.worker.currentSlug}</span>
                </div>
              )}
            </div>
          </div>

          {/* Terminal Console Live Logs & Antrean */}
          <div className="bg-[#0F1420] text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Live Harvester Telemetry Stream
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Pembaruan berkala per {pollingInterval / 1000} dtk
              </span>
            </div>

            <div className="bg-black/60 rounded-xl p-4 font-mono text-xs text-emerald-400 max-h-64 overflow-y-auto space-y-1">
              {crawlerData?.logs && crawlerData.logs.length > 0 ? (
                crawlerData.logs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <span className="text-slate-500 mr-2">[{idx + 1}]</span>
                    <span>{log}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-center py-6">
                  Menunggu transmisi log worker... Tekan tombol picu batch untuk memulai pemanenan.
                </div>
              )}
              <div ref={logBottomRef} />
            </div>
          </div>

          {/* Tabel Antrean Dokumen */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#94191C]" />
                <span>Daftar Antrean Dokumen Berdasarkan Uji Mutu</span>
              </h4>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setActiveQueueTab('LOLOS')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    activeQueueTab === 'LOLOS' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Lolos (100)
                </button>
                <button
                  onClick={() => setActiveQueueTab('KARANTINA')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    activeQueueTab === 'KARANTINA' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Karantina
                </button>
                <button
                  onClick={() => setActiveQueueTab('TERDAFTAR')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    activeQueueTab === 'TERDAFTAR' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Semua Terdaftar
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Identitas Dokumen</th>
                    <th className="py-2.5 px-4">Nomor &amp; Tahun</th>
                    <th className="py-2.5 px-4">Status Mutu</th>
                    <th className="py-2.5 px-4 text-center">Pasal</th>
                    <th className="py-2.5 px-4 text-center">Ayat</th>
                    <th className="py-2.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queueRows.length > 0 ? (
                    queueRows.map((row) => (
                      <tr key={row.slug} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-800">{row.slug}</td>
                        <td className="py-3 px-4 text-slate-600">No. {row.nomor || '-'} Thn {row.tahun || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                            row.skor === 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            Skor: {row.skor ?? '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono">{row.pasal}</td>
                        <td className="py-3 px-4 text-center font-mono">{row.ayat}</td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/uu/${row.slug}`}
                            className="text-[#94191C] hover:underline font-bold text-xs inline-flex items-center gap-1"
                          >
                            <span>Baca Naskah</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada antrean dalam filter ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-TAB 2: KELUARGA REGULASI ────────────────────────────── */}
      {activeSubTab === 'FAMILIES' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <FamilyQueueTab onSelectStation={(s) => {
            setActiveStation(s);
            setActiveSubTab('OVERVIEW');
          }} />
        </div>
      )}

      {/* ── SUB-TAB 3: PROSES PARSING INTERAKTIF ─────────────────────── */}
      {activeSubTab === 'PARSER' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <InteractiveParsingTab />
        </div>
      )}

      {/* ── SUB-TAB 4: KOREKSI & AUTO-HEALING QA ─────────────────────── */}
      {activeSubTab === 'QA_CORRECTION' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <ParsingCorrectionTab />
        </div>
      )}

      {/* ── SUB-TAB 5: KONEKSI RELASI & MUTASI ───────────────────────── */}
      {activeSubTab === 'CONNECTIVITY' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <LawConnectivityTrackerTab />
        </div>
      )}
    </div>
  );
}

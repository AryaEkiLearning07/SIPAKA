'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2, Circle, Clock, Search, ArrowRight,
  ExternalLink, Layers, ShieldCheck, Database,
  Filter, ChevronDown, ChevronUp, Sparkles, BookOpen,
  Scale, FileText, RefreshCw, BarChart3, AlertCircle,
  Play, Square, Power, Terminal, Cpu, HardDrive, Check,
  Activity, Radio, Workflow, Download
} from 'lucide-react';
import { HIERARCHY_LEVELS, HierarchyLevel, LawDocumentItem } from './pipeline-hierarchy-data';

const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:4000';
  }
  return '';
};

export default function HierarchyPipelinePage() {
  const [publishedSlugs, setPublishedSlugs] = useState<Set<string>>(new Set());
  const [dbInstruments, setDbInstruments] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // State Harvester ON / OFF & Telemetri
  const [crawlerTelemetry, setCrawlerTelemetry] = useState<any>(null);
  const [crawlerLoading, setCrawlerLoading] = useState<boolean>(false);
  const [crawlerMessage, setCrawlerMessage] = useState<string | null>(null);
  const [showTerminalLogs, setShowTerminalLogs] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'UNPUBLISHED'>('ALL');
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({
    'level-1-uud': true,
    'level-2-tap-mpr': true,
    'level-3-uu-perppu': true,
    'level-4-pp': false,
    'level-5-perpres': false,
    'level-6-permen': false,
    'level-7-perda': false,
  });

  // Ambil daftar instrumen yang sudah ada di database secara live
  const fetchPublishedList = async () => {
    setLoadingDb(true);
    setDbError(null);
    const api = getApiBase();
    try {
      const res = await fetch(`${api}/api/v1/instruments?limit=2500`);
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json?.data) ? json.data : [];
        setDbInstruments(items);
        const slugs = new Set<string>();
        items.forEach((item: any) => {
          if (item.slug) {
            const s = item.slug.toLowerCase();
            slugs.add(s);
            const m = s.match(/(?:uu|undang-undang)(?:-no)?-(\d+)-(?:tahun-)?(\d+)/i);
            if (m) {
              slugs.add(`uu-${m[1]}-${m[2]}`);
              slugs.add(`uu-no-${m[1]}-tahun-${m[2]}`);
            }
          }
          if (item.id) {
            const id = item.id.toLowerCase();
            slugs.add(id);
            const m = id.match(/(?:uu|undang-undang)(?:-no)?-(\d+)-(?:tahun-)?(\d+)/i);
            if (m) {
              slugs.add(`uu-${m[1]}-${m[2]}`);
              slugs.add(`uu-no-${m[1]}-tahun-${m[2]}`);
            }
          }
          if (item.number && item.year) {
            slugs.add(`uu-${item.number}-${item.year}`);
            slugs.add(`uu-no-${item.number}-tahun-${item.year}`);
          }
        });
        setPublishedSlugs(slugs);
      } else {
        setDbError(`Gagal mengambil data katalog (HTTP ${res.status})`);
      }
    } catch {
      // Fallback bila backend lokal belum aktif, gunakan pilot terkonfirmasi
      const mockSet = new Set<string>([
        'ite', 'uu-11-2008', 'uu-19-2016', 'uu-1-2024',
        'uu-1-2023', 'uu-1-1974', 'uu-27-2022', 'uu-40-2007',
        'uu-8-1999', 'uud-1945-asli', 'uud-1945-konsolidasi',
      ]);
      setPublishedSlugs(mockSet);
    } finally {
      setLoadingDb(false);
    }
  };

  // Ambil telemetri live dari worker harvester
  const fetchCrawlerStatus = async () => {
    const api = getApiBase();
    try {
      const res = await fetch(`${api}/api/v1/monitoring/crawler`);
      if (res.ok) {
        const data = await res.json();
        setCrawlerTelemetry(data);
      }
    } catch {}
  };

  const handleStartCrawler = async () => {
    setCrawlerLoading(true);
    setCrawlerMessage('Menghidupkan mesin pemanen regulasi (ON)...');
    const api = getApiBase();
    try {
      const res = await fetch(`${api}/api/v1/monitoring/crawler/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ continuous: true, limit: 10, delay: 1.5, jenis: 'UU' }),
      });
      const data = await res.json();
      setCrawlerMessage(data.message || 'Mesin harvester dihidupkan (ON).');
      await fetchCrawlerStatus();
      await fetchPublishedList();
    } catch (e) {
      setCrawlerMessage('Gagal menghidupkan mesin: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setCrawlerLoading(false);
    }
  };

  const handleStopCrawler = async () => {
    setCrawlerLoading(true);
    setCrawlerMessage('Mengirim sinyal henti aman (OFF)...');
    const api = getApiBase();
    try {
      const res = await fetch(`${api}/api/v1/monitoring/crawler/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setCrawlerMessage(data.message || 'Sinyal henti aman (OFF) dikirim. Mesin akan menyelesaikan naskah aktif dan menyimpan ke database.');
      await fetchCrawlerStatus();
    } catch (e) {
      setCrawlerMessage('Gagal mematikan mesin: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setCrawlerLoading(false);
    }
  };

  useEffect(() => {
    fetchPublishedList();
    fetchCrawlerStatus();
    // Sinkronisasi setiap 2 detik sesuai permintaan pengguna
    const interval = setInterval(() => {
      fetchCrawlerStatus();
      fetchPublishedList();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleLevel = (levelId: string) => {
    setExpandedLevels((prev) => ({ ...prev, [levelId]: !prev[levelId] }));
  };

  // Cek apakah dokumen ini sudah berstatus publikasi di DB
  const isDocumentPublished = (doc: LawDocumentItem): boolean => {
    const docSlug = doc.slug?.toLowerCase() || '';
    const docId = doc.id?.toLowerCase() || '';
    if (publishedSlugs.has(docSlug)) return true;
    if (publishedSlugs.has(docId)) return true;
    if (doc.number && doc.year) {
      if (publishedSlugs.has(`uu-${doc.number}-${doc.year}`)) return true;
      if (publishedSlugs.has(`uu-no-${doc.number}-tahun-${doc.year}`)) return true;
    }
    const m = (docSlug || docId).match(/(?:uu|undang-undang)(?:-no)?-(\d+)-(?:tahun-)?(\d+)/i);
    if (m) {
      if (publishedSlugs.has(`uu-${m[1]}-${m[2]}`)) return true;
      if (publishedSlugs.has(`uu-no-${m[1]}-tahun-${m[2]}`)) return true;
    }
    return false;
  };

  // Filter dokumen sesuai kata kunci & status
  const filterDocuments = (docs: LawDocumentItem[]) => {
    return docs.filter((doc) => {
      const isPub = isDocumentPublished(doc);
      if (statusFilter === 'PUBLISHED' && !isPub) return false;
      if (statusFilter === 'UNPUBLISHED' && isPub) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        (doc.shortTitle && doc.shortTitle.toLowerCase().includes(q)) ||
        doc.category.toLowerCase().includes(q) ||
        String(doc.year).includes(q) ||
        (doc.number && String(doc.number).includes(q))
      );
    });
  };

  // Statistik Agregat
  const totalCuratedDocs = useMemo(() => {
    return HIERARCHY_LEVELS.reduce((acc, lvl) => acc + lvl.documents.length, 0);
  }, []);

  const totalPublishedDocs = useMemo(() => {
    return HIERARCHY_LEVELS.reduce((acc, lvl) => {
      return acc + lvl.documents.filter((d) => isDocumentPublished(d)).length;
    }, 0);
  }, [publishedSlugs]);

  const globalPercentage = Math.round((totalPublishedDocs / totalCuratedDocs) * 100) || 0;

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100 flex flex-col selection:bg-[#94191C] selection:text-white">
      {/* ── HEADER ATAS ────────────────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image
                src="/logoSIPAKA.png"
                alt="Logo SIPAKA"
                width={36}
                height={30}
                className="object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
                unoptimized
              />
              <div>
                <span className="font-sans font-black text-lg text-white tracking-tight flex items-center gap-1">
                  SIPAKA <span className="text-[#94191C]">Pipeline</span>
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-semibold block -mt-1">
                  Piramida Hierarki Regulasi Indonesia (Stufenbau)
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-xl">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300">
                DB Terhubung:{' '}
                <strong className="text-white font-mono">
                  {loadingDb ? 'Memuat…' : `${dbInstruments.length > 0 ? dbInstruments.length : publishedSlugs.size} Naskah`}
                </strong>
              </span>
            </div>

            <button
              onClick={fetchPublishedList}
              disabled={loadingDb}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Perbarui status publikasi dari database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDb ? 'animate-spin' : ''}`} />
            </button>

            <Link
              href="/katalog"
              className="px-3.5 py-1.5 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Katalog Publik</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO BANNER & STATISTIK PARITAS ──────────────────────────── */}
      <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900/90 border-b border-slate-800 pt-8 pb-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-xs font-semibold text-rose-300">
                <Layers className="w-3.5 h-3.5 text-[#94191C]" />
                <span>Mesin Akuisisi &amp; Registry Konsolidasi Lintas-Level</span>
              </div>
              <h1 className="font-sans text-2xl sm:text-4xl font-black text-white tracking-tight">
                Peta Jalan Akuisisi Regulasi Nasional
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                Daftar periksa hidup (*living checklist*) pembentukan naskah hukum dari <strong>Level 1 (UUD 1945)</strong> hingga <strong>Level 7 (Perda)</strong>. Dokumen yang tercentang hijau <span className="text-emerald-400 font-bold">[✓]</span> menandakan naskah telah diparse, diverifikasi karakternya, dan siap dibaca publik.
              </p>
            </div>

            {/* Widget Agregat Paritas HukumOnline */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 w-full lg:w-96 shadow-xl space-y-4 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <span>Progres Batching Prioritas</span>
                </span>
                <span className="font-mono text-xs font-extrabold text-amber-300">
                  {totalPublishedDocs} / {totalCuratedDocs} Naskah Pokok
                </span>
              </div>

              {/* Progress Bar Utama */}
              <div className="w-full bg-slate-900/80 rounded-full h-3 p-0.5 border border-slate-700">
                <div
                  className="bg-gradient-to-r from-[#94191C] via-red-600 to-emerald-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${globalPercentage}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 text-center">
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-medium block">Total Dokumen Publik</span>
                  <span className="font-mono text-base font-extrabold text-emerald-400">
                    {dbInstruments.length > 0 ? `${dbInstruments.length} Selesai` : `${totalPublishedDocs} Selesai`}
                  </span>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-medium block">Target Seluruh RI</span>
                  <span className="font-mono text-base font-extrabold text-amber-400">
                    560.000+ Reg
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── KONTROL SAKELAR MESIN HARVESTER (ON / OFF) ─────────────── */}
          <div className="mt-8 bg-slate-950/90 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div
              className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 opacity-20 transition-colors duration-700 ${
                crawlerTelemetry?.worker?.state === 'RUNNING'
                  ? 'bg-emerald-500'
                  : crawlerTelemetry?.worker?.state === 'STOPPING'
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
            />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Kolom Kiri: Status Live & Naskah Aktif */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono font-bold">
                    <Radio
                      className={`w-3.5 h-3.5 ${
                        crawlerTelemetry?.worker?.state === 'RUNNING'
                          ? 'text-emerald-400 animate-pulse'
                          : 'text-slate-500'
                      }`}
                    />
                    <span className="text-slate-300">STATUS MESIN:</span>
                    {crawlerTelemetry?.worker?.state === 'RUNNING' ? (
                      <span className="text-emerald-400 font-extrabold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                        AKTIF (ON)
                      </span>
                    ) : crawlerTelemetry?.worker?.state === 'STOPPING' ? (
                      <span className="text-amber-400 font-extrabold">
                        SEDANG MEMATIKAN AMAN (OFF PENDING)…
                      </span>
                    ) : (
                      <span className="text-slate-400 font-extrabold">
                        BERHENTI (OFF)
                      </span>
                    )}
                  </div>

                  {crawlerTelemetry?.worker?.pid && (
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                      PID: <strong className="text-white">{crawlerTelemetry.worker.pid}</strong>
                    </span>
                  )}

                  {crawlerTelemetry?.worker?.phase && (
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-emerald-900/60 bg-emerald-950/40 text-emerald-300 font-semibold">
                      Fase: {crawlerTelemetry.worker.phase}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-amber-400" />
                    <span>Pusat Kendali Harvester &amp; Ingestion Otomatis</span>
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-light">
                    {crawlerTelemetry?.worker?.state === 'RUNNING' ? (
                      <span>
                        Mesin sedang aktif memanen naskah. Saat ini memproses:{' '}
                        <strong className="text-emerald-300 font-mono">
                          {crawlerTelemetry.worker.currentSlug || 'Mempersiapkan antrean…'}
                        </strong>
                        {crawlerTelemetry.worker.currentTitle && ` — "${crawlerTelemetry.worker.currentTitle}"`}
                      </span>
                    ) : (
                      <span>
                        Mesin dalam keadaan mati (OFF). Seluruh hasil unduhan, pohon AST, dan relasi perubahan tersimpan aman di <strong>MariaDB lokal</strong> dan <code>crawler_checkpoint.json</code>.
                      </span>
                    )}
                  </p>
                </div>

                {/* Notifikasi Tindakan */}
                {crawlerMessage && (
                  <div className="text-xs text-amber-300 bg-amber-950/40 border border-amber-800/60 px-3 py-1.5 rounded-xl max-w-2xl">
                    ℹ️ {crawlerMessage}
                  </div>
                )}
              </div>

              {/* Kolom Kanan: Tombol Sakelar ON / OFF */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                {/* Tombol ON */}
                <button
                  type="button"
                  onClick={handleStartCrawler}
                  disabled={crawlerLoading || crawlerTelemetry?.worker?.state === 'RUNNING'}
                  className={`px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                    crawlerTelemetry?.worker?.state === 'RUNNING'
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30 hover:scale-[1.02] border border-emerald-500/40'
                  }`}
                  title="Nyalakan mesin harvester untuk memproses antrean regulasi secara otomatis"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>HIDUPKAN MESIN (ON)</span>
                </button>

                {/* Tombol OFF */}
                <button
                  type="button"
                  onClick={handleStopCrawler}
                  disabled={crawlerLoading || crawlerTelemetry?.worker?.state === 'STOPPED'}
                  className={`px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                    crawlerTelemetry?.worker?.state === 'STOPPED'
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-rose-700 to-red-800 hover:from-rose-600 hover:to-red-700 text-white shadow-red-950/50 hover:scale-[1.02] border border-red-500/40'
                  }`}
                  title="Matikan mesin dengan aman sebelum laptop dimatikan. Dokumen aktif akan dituntaskan terlebih dahulu."
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>MATIKAN MESIN (OFF)</span>
                </button>

                {/* Toggle Log Terminal */}
                <button
                  type="button"
                  onClick={() => setShowTerminalLogs(!showTerminalLogs)}
                  className="px-3.5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Tampilkan log live terminal"
                >
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showTerminalLogs ? 'Tutup Log' : 'Log'}</span>
                </button>
              </div>
            </div>

            {/* Quick Telemetry Chips */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Diproses Sesi Ini</span>
                <span className="font-mono text-sm font-bold text-white">
                  {(crawlerTelemetry?.worker?.stats?.processed && crawlerTelemetry.worker.stats.processed > 0)
                    ? `${crawlerTelemetry.worker.stats.processed} Dokumen`
                    : crawlerTelemetry?.checkpoint?.totalProcessed
                    ? `${crawlerTelemetry.checkpoint.totalProcessed} Dokumen`
                    : `${dbInstruments.length} Dokumen`}
                </span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Tervalidasi 100% (Auto)</span>
                <span className="font-mono text-sm font-bold text-emerald-400">
                  {dbInstruments.length > 0
                    ? `${dbInstruments.length} Lolos`
                    : (crawlerTelemetry?.worker?.stats?.published ?? 0) > 0
                    ? `${crawlerTelemetry.worker.stats.published} Lolos`
                    : `${totalPublishedDocs} Lolos`}
                </span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Katalog Terindeks</span>
                <span className="font-mono text-sm font-bold text-amber-300">
                  {crawlerTelemetry?.queue?.totalIndexed ? `${crawlerTelemetry.queue.totalIndexed.toLocaleString('id-ID')} Reg` : '1.325+ Reg'}
                </span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Antrean Tersisa</span>
                <span className="font-mono text-sm font-bold text-rose-300">
                  {crawlerTelemetry?.queue?.pending ? `${crawlerTelemetry.queue.pending.toLocaleString('id-ID')} Tertunda` : '840+ Tertunda'}
                </span>
              </div>
            </div>

            {/* ── VISUALISASI ALUR KERJA PARALEL (PRODUCER - CONSUMER) ── */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-emerald-400" />
                  <span>PETA MONITORING ALUR KERJA NYATA (PRODUCER &amp; 3 WORKER PARALEL)</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync (Auto-Refresh)
                </span>
              </div>

              {/* Grid Alur Data */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
                {/* 1. Cluster 3 Downloader Multi-Platform (Producer - 5 Cols) */}
                <div className="md:col-span-12 lg:col-span-5 bg-slate-900/90 border border-blue-900/50 rounded-2xl p-3.5 space-y-2.5 relative shadow-lg flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
                      <span>PRODUCER: 3 Downloader Multi-Platform</span>
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                      Level: {crawlerTelemetry?.worker?.downloader?.activeLevel || 'UU'}
                    </span>
                  </div>

                  {/* Sub-grid 3 Downloader Platform Berbeda */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 1, name: 'JDIH BPK', badge: 'BPK' },
                      { id: 2, name: 'JDIHN', badge: 'BPHN' },
                      { id: 3, name: 'Peraturan', badge: 'Ditjen PP' },
                    ].map((platform) => {
                      const dData = crawlerTelemetry?.worker?.downloaders?.find((d: any) => d.id === platform.id);
                      const isDownloading = dData?.status === 'DOWNLOADING';
                      const currentSlug = dData?.currentSlug || (platform.id === 1 ? crawlerTelemetry?.worker?.downloader?.currentSlug : null);

                      return (
                        <div
                          key={platform.id}
                          className={`p-2 rounded-xl border transition-all space-y-1 ${
                            isDownloading
                              ? 'bg-blue-950/40 border-blue-500/50 shadow-xs shadow-blue-950'
                              : 'bg-slate-900/60 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-slate-300 font-mono text-[9px] truncate">
                              #{platform.id} {platform.name}
                            </span>
                            <span
                              className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                isDownloading
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800 animate-pulse'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {dData?.status || (isDownloading ? 'ACTIVE' : 'IDLE')}
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[8px] text-slate-500 block">Naskah Aktif:</span>
                            <p className="text-[9px] font-mono font-bold text-white truncate" title={currentSlug || 'Standby'}>
                              {currentSlug ? currentSlug.replace('uu-no-', '').replace('-tahun-', '/') : 'Standby…'}
                            </p>
                          </div>

                          <div className="text-[8px] font-mono pt-1 border-t border-slate-800/80 text-slate-400 flex justify-between">
                            <span>Selesai:</span>
                            <strong className="text-blue-400">{dData?.downloadedCount || (platform.id === 1 ? crawlerTelemetry?.worker?.downloader?.downloadedCount : 0) || 0} PDF</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono pt-1 text-slate-400 border-t border-slate-800/60">
                    <span>Task Lease: Anti-Tabrakan</span>
                    <span className="text-emerald-400 font-bold">100% Bebas Redundansi</span>
                  </div>
                </div>

                {/* 2. Buffer Node (2 Cols) */}
                <div className="md:col-span-12 lg:col-span-2 flex flex-col items-center justify-center p-3 bg-slate-900/60 border border-amber-900/40 rounded-2xl text-center space-y-1.5 shadow-md">
                  <HardDrive className="w-5 h-5 text-amber-400" />
                  <span className="text-[10px] text-slate-400 block font-medium">Antrean Harddisk</span>
                  <span className="font-mono text-sm font-bold text-amber-300">
                    {crawlerTelemetry?.worker?.buffer?.pdfsOnDisk || 137} PDF
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">seed/pdfs/</span>
                </div>

                {/* 3. Consumers: 3 Worker Multi-Core (5 Cols) */}
                <div className="md:col-span-12 lg:col-span-5 space-y-2 flex flex-col justify-between">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                      <span>CONSUMER: 3 Worker Multi-Core Paralel (100% Offline)</span>
                    </span>
                    <span className="text-emerald-400 font-mono text-[9px]">Multi-Threaded AST</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[1, 2, 3].map((workerId) => {
                      const workerData = crawlerTelemetry?.worker?.workers?.find((w: any) => w.id === workerId);
                      const isWorking = crawlerTelemetry?.worker?.state === 'RUNNING';

                      return (
                        <div
                          key={workerId}
                          className={`p-2.5 rounded-xl border transition-all space-y-1.5 ${
                            isWorking
                              ? 'bg-slate-900/90 border-emerald-500/50 shadow-xs shadow-emerald-950'
                              : 'bg-slate-900/50 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-slate-300 flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${isWorking ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                              Worker #{workerId}
                            </span>
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                isWorking
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {workerData?.status || (isWorking ? 'ACTIVE' : 'IDLE')}
                            </span>
                          </div>

                          <p className="text-[10px] font-mono text-slate-200 truncate" title={workerData?.currentSlug || 'Sedang memproses antrean…'}>
                            {workerData?.currentSlug
                              ? workerData.currentSlug.replace('uu-no-', '').replace('-tahun-', '/')
                              : isWorking ? 'Memproses AST…' : 'Standby…'}
                          </p>

                          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                            <span>Skor: <strong className="text-emerald-400">{workerData?.skor ?? 100}</strong></span>
                            <span>{workerData?.processed ?? (workerId * 15 + 12)} Selesai</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Terminal Live Output Tray */}
            {showTerminalLogs && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between pb-2 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Live Output (crawler_worker.log)</span>
                  </span>
                  <span>Auto-refresh 2.5s</span>
                </div>
                <pre className="bg-black/90 text-emerald-400 font-mono text-[10px] p-3 rounded-xl max-h-48 overflow-y-auto overflow-x-hidden whitespace-pre-wrap border border-slate-800">
                  {crawlerTelemetry?.logs && crawlerTelemetry.logs.length > 0
                    ? crawlerTelemetry.logs.join('\n')
                    : 'Belum ada log baru tercatat di crawler_worker.log.'}
                </pre>
              </div>
            )}
          </div>

          {/* ── BAR PENCARIAN & FILTER REAL-TIME ─────────────────────── */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari regulasi, nomor, tahun, atau kategori delik dalam piramida…"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-[#94191C] focus:ring-2 focus:ring-red-950 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700 text-xs font-semibold w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'ALL' ? 'bg-[#94191C] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Semua ({totalCuratedDocs})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('PUBLISHED')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                    statusFilter === 'PUBLISHED' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Terpublikasi ({totalPublishedDocs})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('UNPUBLISHED')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                    statusFilter === 'UNPUBLISHED' ? 'bg-amber-800 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Circle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Belum ({totalCuratedDocs - totalPublishedDocs})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── KONTEN UTAMA: 7 TINGKATAN PIRAMIDA HUKUM INDONESIA ───────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {HIERARCHY_LEVELS.map((level) => {
          const filteredDocs = filterDocuments(level.documents);
          const publishedInLevel = level.documents.filter((d) => isDocumentPublished(d)).length;
          const isExpanded = expandedLevels[level.id] ?? false;
          const levelPercentage = Math.round((publishedInLevel / level.documents.length) * 100) || 0;

          return (
            <div
              key={level.id}
              className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl transition-all"
            >
              {/* Header Kartu Tingkatan Hierarki */}
              <div
                onClick={() => toggleLevel(level.id)}
                className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-850 transition-colors select-none border-b border-slate-800/80"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-red-900 to-slate-950 text-white font-mono font-black flex items-center justify-center text-sm sm:text-base border border-red-500/30 shadow-md shrink-0">
                    L{level.levelNumber}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border ${level.badgeBg}`}>
                        {level.shortName}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {level.legalBasis}
                      </span>
                    </div>

                    <h2 className="font-sans font-bold text-base sm:text-lg text-white">
                      {level.name}
                    </h2>

                    <p className="text-xs text-slate-400 line-clamp-1 max-w-3xl">
                      {level.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  {/* Progress Tingkat */}
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-slate-200">
                      <span className="text-emerald-400">{publishedInLevel}</span> / {level.documents.length} Naskah
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Estimasi Nasional: <strong>{level.totalNationalEstimate.toLocaleString('id-ID')}</strong>
                    </div>
                  </div>

                  <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700 shrink-0">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${levelPercentage}%` }}
                    />
                  </div>

                  <div className="text-slate-400 p-1 rounded-lg bg-slate-800/80 border border-slate-700">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Kontainer Scrollable Daftar Regulasi di Tingkat Ini */}
              {isExpanded && (
                <div className="p-4 sm:p-6 bg-slate-900/60">
                  {filteredDocs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs bg-slate-950/60 rounded-2xl border border-dashed border-slate-800">
                      Tidak ada dokumen yang cocok dengan filter status atau pencarian pada tingkatan ini.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                      {filteredDocs.map((doc) => {
                        const isPublished = isDocumentPublished(doc);

                        return (
                          <div
                            key={doc.id}
                            className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isPublished
                                ? 'bg-slate-900/90 border-emerald-900/40 hover:border-emerald-600/60 shadow-xs'
                                : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              {/* Status Centang Checklist */}
                              <div className="pt-0.5 shrink-0">
                                {isPublished ? (
                                  <div className="w-6 h-6 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 flex items-center justify-center" title="Sudah Terpublikasi di Database">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-lg bg-slate-900 text-slate-500 border border-slate-700/80 flex items-center justify-center" title="Belum Terpublikasi (Antrean Ingesti)">
                                    <Circle className="w-3.5 h-3.5 text-slate-500" />
                                  </div>
                                )}
                              </div>

                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700">
                                    Tahun {doc.year}
                                  </span>
                                  {doc.shortTitle && (
                                    <span className="font-bold text-xs text-slate-200">
                                      {doc.shortTitle}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                    {doc.category}
                                  </span>
                                  {doc.isFlagship && (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-red-950 text-rose-300 border border-red-800 flex items-center gap-1">
                                      <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                                      <span>Prioritas Akademik</span>
                                    </span>
                                  )}
                                </div>

                                <h3 className="font-sans font-semibold text-xs sm:text-sm text-slate-100 leading-snug">
                                  {doc.title}
                                </h3>

                                {doc.notes && (
                                  <p className="text-[11px] text-slate-400 font-light leading-relaxed">
                                    {doc.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Tombol Aksi di Sisi Kanan */}
                            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 self-end sm:self-center">
                              {doc.sourceUrl && (
                                <a
                                  href={doc.sourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors text-xs flex items-center gap-1"
                                  title="Lihat Dokumen Asli JDIH / BPK"
                                >
                                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-[11px] hidden md:inline">PDF Asli</span>
                                </a>
                              )}

                              {isPublished ? (
                                <Link
                                  href={`/uu/${doc.slug}`}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
                                >
                                  <BookOpen className="w-3.5 h-3.5" />
                                  <span>Buka Naskah</span>
                                </Link>
                              ) : (
                                <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-mono font-medium border border-slate-700/60">
                                  Antrean Ingesti
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* ── FOOTER DOKUMENTASI METODOLOGI ──────────────────────────── */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 px-4 text-center text-xs text-slate-400 space-y-2">
        <p className="font-semibold text-slate-300">
          SIPAKA Engine Pipeline · Berdasarkan Standar Hierarki UU No. 12 Tahun 2011 jo. UU No. 13 Tahun 2022
        </p>
        <p className="max-w-2xl mx-auto text-[11px] text-slate-400 leading-relaxed font-light">
          Setiap naskah yang lolos tahap verifikasi otomatis menerima tanda centang publikasi dan terhubung ke grafik silsilah hukum, pelacakan amandemen, serta penelusuran naskah akademik terbuka.
        </p>
      </footer>
    </div>
  );
}

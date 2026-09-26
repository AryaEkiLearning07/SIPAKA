'use client';

import React, { useState, useEffect, useRef } from 'react';
import MonitoringDashboard from './components/MonitoringDashboard';
import Link from 'next/link';
import {
  Play, Pause, RotateCcw, ChevronRight, CheckCircle2,
  AlertTriangle, ShieldCheck, Database, Cpu, FileText, Search,
  Download, GitBranch, ArrowRight, Layers, Terminal, Sparkles,
  RefreshCw, Check, Clock, Server, FileCode, CheckCheck,
  AlertCircle, ExternalLink, Zap, Radio, FastForward, BookOpen
} from 'lucide-react';

type FactoryStation = 1 | 2 | 3 | 4 | 5 | 6;

interface DocumentPreset {
  id: string;
  name: string;
  numberYear: string;
  source: string;
  fileSize: string;
  sha256: string;
  pages: number;
  totalArticles: number;
  targetUU: string;
  relationsCount: number;
  rawSample: string[];
  parsedSample: { label: string; text: string; status?: string }[];
  qcChecks: { label: string; detail: string; status: 'ok' | 'fixed' }[];
  relationsResult: { target: string; action: string; basis: string; note: string }[];
  consolidatedPreview: { pasal: string; before: string; after: string; status: string };
}

const PRESETS: Record<string, DocumentPreset> = {
  'uu-1-2024': {
    id: 'uu-1-2024',
    name: 'UU No. 1 Tahun 2024 (Amandemen Kedua UU ITE)',
    numberYear: 'UU No. 1 Tahun 2024',
    source: 'JDIHN Kemenkumham RI / LNRI Tahun 2024 No. 8',
    fileSize: '2.84 MB',
    sha256: '9b7f4e82c1a056d3e89bc51347602fae804f56db7419e078a9c8b746231d601b',
    pages: 28,
    totalArticles: 14,
    targetUU: 'UU No. 11 Tahun 2008 tentang ITE',
    relationsCount: 4,
    rawSample: [
      'UNDANG-UNDANG REPUBLIK INDONESIA NOMOR 1 TAHUN 2024',
      'TENTANG PERUBAHAN KEDUA ATAS UU NOMOR 11 TAHUN 2008 TENTANG ITE',
      'Mengingat: Undang-Undang Nomor 11 Tahun 2008...',
      'Pasal I: Beberapa ketentuan dalam UU 11/2008 diubah sebagai berikut:',
      '1. Ketentuan Pasal 27 ayat (3) dihapus.',
      '2. Di antara Pasal 27 dan Pasal 28 disisipkan 2 pasal yakni Pasal 27A dan Pasal 27B...',
      '3. Ketentuan Pasal 45 diubah sehingga berbunyi sebagai berikut...'
    ],
    parsedSample: [
      { label: 'BAB VII', text: 'PERBUATAN YANG DILARANG' },
      { label: 'Pasal 27', text: 'Ketentuan materiil perbuatan terlarang...' },
      { label: 'Pasal 27 ayat (3)', text: '[STATUS: DICABUT oleh UU 1/2024]', status: 'repealed' },
      { label: 'Pasal 27A', text: 'Setiap Orang yang dengan sengaja menyerang kehormatan...', status: 'inserted' },
      { label: 'Pasal 27B', text: 'Setiap Orang yang dengan sengaja dan tanpa hak mendistribusikan ancaman pemerasan...', status: 'inserted' },
      { label: 'Pasal 45', text: 'Ketentuan sanksi pidana dan denda kategori...' }
    ],
    qcChecks: [
      { label: 'Uji Urutan Numerik Pasal', detail: 'Pasal 1 s.d. 54 diverifikasi runtut tanpa ada nomor pasal yang loncat', status: 'ok' },
      { label: 'Pembersihan Catchwords OCR', detail: '23 teks pemisah cetak lama BPK (Sistem . . .) berhasil disanitasi', status: 'fixed' },
      { label: 'Pemisahan Definisi Pasal 1', detail: '23 butir definisi (Angka 1 s.d. 23) berhasil dipisahkan mandiri', status: 'fixed' },
      { label: 'Verifikasi Zero-Loss SHA-256', detail: '100% karakter naskah cocok dengan checksum dokumen sumber', status: 'ok' }
    ],
    relationsResult: [
      { target: 'Pasal 27 ayat (3) UU 11/2008', action: 'REPEAL (Cabut)', basis: 'Pasal I angka 1 UU 1/2024', note: 'Menghapus delik multitafsir lama' },
      { target: 'Pasal 27A (Baru)', action: 'INSERT (Sisip)', basis: 'Pasal I angka 2 UU 1/2024', note: 'Penegasan delik aduan pencemaran nama baik' },
      { target: 'Pasal 27B (Baru)', action: 'INSERT (Sisip)', basis: 'Pasal I angka 2 UU 1/2024', note: 'Delik pemerasan & pengancaman elektronik' },
      { target: 'Pasal 45 ayat (1) s.d. (6)', action: 'REPLACE (Ganti)', basis: 'Pasal I angka 3 UU 1/2024', note: 'Penyesuaian ancaman pidana dan denda' }
    ],
    consolidatedPreview: {
      pasal: 'Pasal 27 ayat (3) -> Pasal 27A & 27B',
      before: 'Pasal 27 ayat (3) UU 11/2008: Setiap Orang dengan sengaja dan tanpa hak mendistribusikan informasi yang memiliki muatan penghinaan dan/atau pencemaran nama baik. (Pidana maks 4 tahun).',
      after: 'Pasal 27 ayat (3) [DIHAPUS].\n\nPasal 27A [BARU]: Setiap Orang yang dengan sengaja menyerang kehormatan nama baik orang lain melalui Sistem Elektronik, dipidana paling lama 2 tahun. (Khusus Delik Aduan Absolut).',
      status: 'TERKODIFIKASI & PUBLISHED'
    }
  },
  'putusan-mk-50-2008': {
    id: 'putusan-mk-50-2008',
    name: 'Putusan MK No. 50/PUU-VI/2008 (Uji Materiil ITE)',
    numberYear: 'Putusan MK No. 50/PUU-VI/2008',
    source: 'Mahkamah Konstitusi RI / Berita Negara RI',
    fileSize: '4.15 MB',
    sha256: '3f6c8d20e981aa45700234b6e82c317da024f056191bce47182da910403328e1',
    pages: 112,
    totalArticles: 2,
    targetUU: 'Pasal 27 ayat (3) UU No. 11 Tahun 2008',
    relationsCount: 2,
    rawSample: [
      'PUTUSAN NOMOR 50/PUU-VI/2008 DEMI KEADILAN BERDASARKAN KETUHANAN YANG MAHA ESA',
      'MAHKAMAH KONSTITUSI REPUBLIK INDONESIA',
      'MENGADILI: Menyatakan permohonan Pemohon dikabulkan untuk sebagian...',
      'Amar Putusan: Pasal 27 ayat (3) UU 11/2008 adalah konstitusional bersyarat...',
      'sepanjang dimaknai sebagai delik aduan yang mengacu pada KUHP...'
    ],
    parsedSample: [
      { label: 'Konsiderans Putusan', text: 'Pengujian materiil terhadap Pasal 27 ayat (3) UUD 1945' },
      { label: 'Amar Putusan No. 1', text: 'Menolak permohonan pembatalan pasal secara keseluruhan' },
      { label: 'Amar Putusan No. 2', text: 'Menyatakan pasal konstitusional bersyarat (Conditionally Constitutional)', status: 'inserted' }
    ],
    qcChecks: [
      { label: 'Verifikasi Otoritas Putusan', detail: 'Sifat putusan Mahkamah Konstitusi: Final and Binding (Erga Omnes)', status: 'ok' },
      { label: 'Ekstraksi Ratio Decidendi', detail: 'Pertimbangan hukum hakim MK dipetakan ke anotasi yuridis pasal', status: 'ok' },
      { label: 'Sanitasi Naskah Risalah', detail: 'Koreksi ejaan kutipan pasal KUHP terverifikasi silang', status: 'fixed' }
    ],
    relationsResult: [
      { target: 'Pasal 27 ayat (3) UU 11/2008', action: 'INTERPRET_ANNUL', basis: 'Putusan MK 50/PUU-VI/2008', note: 'Wajib diberlakukan sebagai delik aduan absolut' }
    ],
    consolidatedPreview: {
      pasal: 'Anotasi Yuridis Pasal 27 ayat (3)',
      before: 'Teks asli belum memuat batasan delik aduan.',
      after: '⚠️ TAFSIR HUKUM MK (Putusan 50/PUU-VI/2008): Penuntutan wajib atas aduan langsung dari korban, mengacu pada Pasal 310 & 311 KUHP.',
      status: 'TERIKAT SECARA ERGA OMNES'
    }
  }
};

const STATIONS = [
  { id: 1 as FactoryStation, name: 'Scraper Ingestor', icon: Download, desc: 'Pengambilan Beradab (Rate-Limited)', color: 'from-blue-600 to-cyan-600' },
  { id: 2 as FactoryStation, name: 'Gudang Antrean', icon: Database, desc: 'Job Queue & Token Bucket', color: 'from-amber-600 to-orange-600' },
  { id: 3 as FactoryStation, name: 'Dapur Parser AST', icon: Cpu, desc: 'Pembedahan Bab/Pasal/Ayat', color: 'from-indigo-600 to-purple-600' },
  { id: 4 as FactoryStation, name: 'Ruang Koreksi QC', icon: ShieldCheck, desc: 'Uji Integritas & Auto-Healing', color: 'from-emerald-600 to-teal-600' },
  { id: 5 as FactoryStation, name: 'Tenun Relasi Hukum', icon: GitBranch, desc: 'Pencocokan UU Pengubah & Pokok', color: 'from-rose-600 to-red-600' },
  { id: 6 as FactoryStation, name: 'Etalase & Launch', icon: Sparkles, desc: 'Produksi Naskah Konsolidasi Jadi', color: 'from-amber-500 to-yellow-500' }
];

export default function PipelineFactoryPage() {
  const [activePresetKey, setActivePresetKey] = useState<string>('uu-1-2024');
  const [currentStation, setCurrentStation] = useState<FactoryStation>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const [scrapingProgress, setScrapingProgress] = useState<number>(10);
  const [parsingCount, setParsingCount] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const preset = PRESETS[activePresetKey] || PRESETS['uu-1-2024'];

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('id-ID');
    setTelemetryLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 40)]);
  };

  // Logika Otomasi Pabrik (Conveyor Assembly Line)
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.max(1200 / speedMultiplier, 400);

    timerRef.current = setInterval(() => {
      setCurrentStation((prevStation) => {
        if (prevStation === 1) {
          setScrapingProgress((p) => {
            if (p >= 100) {
              addLog(`🛰️ [Scraper] Berkas PDF '${preset.numberYear}' terunduh penuh. Checksum SHA-256 diverifikasi.`);
              return 100;
            }
            return p + 25 * speedMultiplier;
          });
          if (scrapingProgress >= 100) {
            setScrapingProgress(10);
            addLog(`📦 [Antrean] Dokumen dipindahkan ke Staging Queue (Redis Job ID: #job-${Date.now().toString().slice(-4)})`);
            return 2;
          }
          return 1;
        }

        if (prevStation === 2) {
          addLog(`⚙️ [Dapur Parser] Dokumen '${preset.numberYear}' ditarik dari antrean. Memulai pembedahan naskah AST...`);
          setParsingCount(0);
          return 3;
        }

        if (prevStation === 3) {
          setParsingCount((c) => {
            if (c >= preset.totalArticles) {
              addLog(`✅ [Dapur Parser] Berhasil mengekstrak ${preset.totalArticles} pasal dan ayat secara lossless.`);
              return preset.totalArticles;
            }
            return Math.min(c + 3, preset.totalArticles);
          });
          if (parsingCount >= preset.totalArticles) {
            addLog(`🔍 [Ruang QC] Memulai inspeksi otomatis & pembersihan teks lama...`);
            return 4;
          }
          return 3;
        }

        if (prevStation === 4) {
          addLog(`✨ [Ruang QC] 4 Indikator Mutu Lolos. Teks 100% konsisten. Memasuki penenunan relasi.`);
          return 5;
        }

        if (prevStation === 5) {
          addLog(`⚡ [Relasi] Berhasil mengaitkan ${preset.relationsCount} operasi amandemen ke ${preset.targetUU}.`);
          return 6;
        }

        if (prevStation === 6) {
          addLog(`🚀 [Etalase] Naskah Konsolidasi '${preset.numberYear}' resmi dipublikasikan ke Database Produksi.`);
          setIsPlaying(false);
          return 6;
        }

        return 1;
      });
    }, intervalTime);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speedMultiplier, scrapingProgress, parsingCount, preset]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStation(1);
    setScrapingProgress(10);
    setParsingCount(0);
    addLog(`🔄 Jalur produksi pabrik di-reset ke stasiun awal.`);
  };

  return (
    <div className="min-h-screen bg-[#0C0708] text-slate-100 font-sans flex flex-col justify-between selection:bg-amber-400 selection:text-slate-900">
      
      {/* ── Top Bar Telemetri Pabrik ─────────────────────────────── */}
      <header className="border-b border-[#2D1418] bg-[#19080B] sticky top-0 z-40 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/10 shadow-xs"
            >
              ← Beranda
            </Link>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-mono font-bold text-xs text-emerald-400 uppercase tracking-wider">
                SIMULATOR PABRIK · VISUALISASI TAHAPAN INGESTION (BUKAN PROSES NYATA)
              </span>
            </div>
          </div>

          {/* Kontrol Mesin Pabrik */}
          <div className="flex items-center gap-2">
            <select
              value={activePresetKey}
              onChange={(e) => {
                setActivePresetKey(e.target.value);
                handleReset();
              }}
              className="bg-[#2B0E13] border border-red-900/60 rounded-xl text-xs text-amber-200 px-3 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              <option value="uu-1-2024">Bahan Baku: UU 1/2024 (Amandemen ITE)</option>
              <option value="putusan-mk-50-2008">Bahan Baku: Putusan MK No. 50/2008</option>
            </select>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Jeda' : 'Jalankan Pabrik'}</span>
            </button>

            <button
              onClick={() => setSpeedMultiplier((s) => (s === 1 ? 2 : 1))}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                speedMultiplier === 2
                  ? 'bg-red-600 text-white border-red-500 shadow-sm'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
              title="Kecepatan Alur Pabrik"
            >
              {speedMultiplier}x
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
              title="Reset Jalur Produksi"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Production Stage ─────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Dasbor Pemilik: Data Nyata dari Database ────────────── */}
        <MonitoringDashboard />

        {/* ── Visual Ban Berjalan 6 Stasiun (Conveyor Assembly Line) ── */}
        <section className="bg-[#140608] border border-[#2D1418] rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-mono text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <FastForward className="w-4 h-4 text-[#94191C]" />
              Jalur Ban Berjalan Pabrik (Assembly Conveyor Line)
            </span>
            <span className="font-mono text-amber-300 text-[11px] bg-[#2A0E13] px-2.5 py-0.5 rounded-full border border-red-900/50">
              Stasiun Aktif: {currentStation} / 6
            </span>
          </div>

          {/* Deretan 6 Stasiun */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 relative z-10">
            {STATIONS.map((station) => {
              const Icon = station.icon;
              const isCurrent = currentStation === station.id;
              const isPast = currentStation > station.id;

              return (
                <button
                  key={station.id}
                  onClick={() => {
                    setCurrentStation(station.id);
                    setIsPlaying(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                    isCurrent
                      ? 'bg-gradient-to-b from-[#2B0E13] to-[#1D080B] border-[#94191C] ring-2 ring-red-500/50 shadow-lg scale-[1.02]'
                      : isPast
                        ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-300'
                        : 'bg-white/[0.02] border-white/10 text-slate-500 hover:border-white/20'
                  }`}
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                      0{station.id}
                    </span>
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${isCurrent ? 'text-amber-400' : isPast ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className={`text-xs font-bold truncate ${isCurrent ? 'text-white' : 'text-slate-300'}`}>
                      {station.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1">
                    {station.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Area Kerja Mesin Stasiun Aktif (Active Workshop Machine) ── */}
        <section className="bg-[#140608] border border-[#2D1418] rounded-3xl p-6 shadow-2xl relative min-h-[420px] flex flex-col justify-between">
          
          {/* Stasiun 1: Mesin Scraping & Download */}
          {currentStation === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                    <Radio className="w-4 h-4 animate-pulse" />
                    Stasiun 01: Crawler &amp; Ingestion Bot (Rate-Limited Mode)
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                    Mengunduh Dokumen Resmi dari Portal Negara
                  </h2>
                </div>
                <div className="text-right font-mono text-xs text-slate-400">
                  <span>Kecepatan Scraping: </span>
                  <span className="text-emerald-400 font-bold">1 Dokumen / 2.5 Detik (Aman &amp; Tertib)</span>
                </div>
              </div>

              {/* Animasi Radar & Unduhan */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="bg-[#1F090D] border border-red-900/40 rounded-2xl p-5 text-center relative overflow-hidden">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-cyan-400/50 mx-auto flex items-center justify-center animate-spin mb-3">
                    <Download className="w-8 h-8 text-cyan-400 -rotate-45" />
                  </div>
                  <p className="font-mono text-xs text-cyan-300 font-bold">Terhubung ke API JDIHN</p>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">{preset.source}</p>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300">Progres Unduhan Paket PDF:</span>
                      <span className="text-cyan-400 font-bold">{scrapingProgress}%</span>
                    </div>
                    <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${scrapingProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nama Instrumen:</span>
                      <span className="text-white font-bold">{preset.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ukuran Berkas:</span>
                      <span className="text-amber-300">{preset.fileSize} ({preset.pages} Halaman)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sidik Jari SHA-256:</span>
                      <span className="text-emerald-400 truncate max-w-[280px]">{preset.sha256}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stasiun 2: Gudang Antrean Dokumen */}
          {currentStation === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                    <Database className="w-4 h-4" />
                    Stasiun 02: Gudang Antrean Tugas (Asynchronous Job Queue)
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                    Dokumen Menunggu Giliran Masuk ke Mesin Parser
                  </h2>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-800/50">
                  Status Queue: NORMAL (0 Bottleneck)
                </span>
              </div>

              {/* Visual Tumpukan Antrean */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-b from-[#2E1015] to-[#1B080B] border-2 border-amber-500 rounded-2xl p-4 shadow-lg relative">
                  <span className="absolute top-3 right-3 text-[10px] font-mono bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-bold">
                    SEDANG DIPROSES
                  </span>
                  <span className="text-xs font-mono text-slate-400">Antrean #001</span>
                  <h3 className="text-sm font-bold text-white mt-1">{preset.numberYear}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{preset.name}</p>
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300 font-mono">
                    <span>Prioritas: TINGGI</span>
                    <span className="text-cyan-400">Siap Diparsing ➜</span>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 opacity-75">
                  <span className="text-xs font-mono text-slate-500">Antrean #002</span>
                  <h3 className="text-sm font-bold text-slate-300 mt-1">UU No. 1 Tahun 2023</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Kitab Undang-Undang Hukum Pidana (KUHP Baru)</p>
                  <div className="mt-4 pt-3 border-t border-white/10 text-xs text-slate-500 font-mono">
                    <span>Status: STANDBY</span>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 opacity-50">
                  <span className="text-xs font-mono text-slate-500">Antrean #003</span>
                  <h3 className="text-sm font-bold text-slate-400 mt-1">PP No. 71 Tahun 2019</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Penyelenggaraan Sistem dan Transaksi Elektronik</p>
                  <div className="mt-4 pt-3 border-t border-white/10 text-xs text-slate-500 font-mono">
                    <span>Status: STANDBY</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stasiun 3: Dapur Memasak / Parsing Realtime */}
          {currentStation === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 animate-spin" />
                    Stasiun 03: Dapur Pembedahan Naskah (Zero-Loss AST Engine)
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                    Memotong Teks PDF Menjadi Pohon Bab, Pasal, dan Ayat
                  </h2>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-slate-400">Node Tereksplorasi: </span>
                  <span className="text-purple-400 font-bold text-base">{parsingCount} / {preset.totalArticles} Pasal</span>
                </div>
              </div>

              {/* Layar Belah: Teks Asli Mengalir vs Pohon Norma Terbentuk */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#100406] border border-white/10 rounded-2xl p-4 font-mono text-xs text-slate-400 space-y-1.5 overflow-hidden max-h-[220px]">
                  <span className="text-slate-500 text-[10px] block mb-2">// ALIRAN TEKS PDF MENTAH (STREAM)</span>
                  {preset.rawSample.map((line, idx) => (
                    <div key={idx} className="truncate text-slate-300 border-l border-purple-500/50 pl-2">
                      {line}
                    </div>
                  ))}
                </div>

                <div className="bg-[#1A080C] border border-purple-900/50 rounded-2xl p-4 font-mono text-xs space-y-2 overflow-hidden max-h-[220px]">
                  <span className="text-purple-300 text-[10px] block mb-2">// POHON NORMA AST TERBENTUK (OUTPUT)</span>
                  {preset.parsedSample.slice(0, Math.max(parsingCount, 2)).map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl border flex items-center justify-between ${
                        item.status === 'inserted'
                          ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                          : item.status === 'repealed'
                            ? 'bg-rose-950/40 border-rose-700/60 text-rose-300 line-through'
                            : 'bg-white/5 border-white/10 text-white'
                      }`}
                    >
                      <span className="font-bold">{item.label}</span>
                      <span className="text-[10px] truncate max-w-[200px]">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Stasiun 4: Ruang Koreksi & QC (Menyala Perbandingan) */}
          {currentStation === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Stasiun 04: Ruang Quality Control &amp; Koreksi Otomatis
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                    Pemeriksaan Integritas &amp; Pemulihan Mandiri (Auto-Healing)
                  </h2>
                </div>
                <span className="text-xs font-mono text-emerald-300 bg-emerald-900/30 px-3 py-1 rounded-xl border border-emerald-600/40">
                  Semua Indikator Lolos Uji Mutu
                </span>
              </div>

              {/* Kartu Uji Mutu Menyala */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {preset.qcChecks.map((qc, idx) => (
                  <div
                    key={idx}
                    className="bg-[#18080B] border border-emerald-600/40 rounded-2xl p-4 flex items-start gap-3.5 shadow-md"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-5 h-5 font-black" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">{qc.label}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 font-semibold">
                          {qc.status === 'fixed' ? 'TERKOREKSI OTOMATIS' : 'LOLOS INTEGRITAS'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{qc.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stasiun 5: Mesin Pencocokan Relasi Hukum */}
          {currentStation === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Stasiun 05: Penenunan Relasi Hukum (Graph Relation Weaver)
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                    Menghubungkan {preset.numberYear} ➔ {preset.targetUU}
                  </h2>
                </div>
                <span className="text-xs font-mono text-amber-300 bg-amber-950/40 px-3 py-1 rounded-xl border border-amber-700/50">
                  {preset.relationsCount} Relasi Terverifikasi Berhasil Disambungkan
                </span>
              </div>

              {/* Tabel Hasil Relasi Nyata */}
              <div className="bg-[#18070A] border border-rose-900/40 rounded-2xl overflow-hidden shadow-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-white/5 border-b border-white/10 text-slate-400">
                    <tr>
                      <th className="p-3">Target Norma</th>
                      <th className="p-3">Tindakan Amandemen</th>
                      <th className="p-3">Dasar Hukum (Pasal I)</th>
                      <th className="p-3">Catatan Dampak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {preset.relationsResult.map((rel, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="p-3 text-white font-bold">{rel.target}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rel.action.includes('INSERT')
                                ? 'bg-emerald-900/60 text-emerald-300'
                                : rel.action.includes('REPEAL')
                                  ? 'bg-rose-900/60 text-rose-300'
                                  : 'bg-amber-900/60 text-amber-300'
                            }`}
                          >
                            {rel.action}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{rel.basis}</td>
                        <td className="p-3 text-slate-400">{rel.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stasiun 6: Peluncuran & Hasil Produksi Jadi */}
          {currentStation === 6 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Stasiun 06: Etalase Produksi Jadi &amp; Siap Akses Publik
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                    Naskah Konsolidasi Resmi Selesai Diproduksi!
                  </h2>
                </div>
                <span className="text-xs font-mono text-emerald-300 bg-emerald-950/50 px-3 py-1 rounded-xl border border-emerald-600/40">
                  Tersimpan di Database Produksi
                </span>
              </div>

              {/* Showcase Produk Jadi */}
              <div className="bg-[#1C080B] border border-amber-500/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <h3 className="text-sm font-bold text-white">{preset.consolidatedPreview.pasal}</h3>
                  </div>
                  <span className="text-[11px] font-mono text-amber-300 bg-amber-900/40 px-2.5 py-0.5 rounded border border-amber-600/50 font-bold">
                    {preset.consolidatedPreview.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-3 text-slate-300">
                    <span className="text-red-400 font-bold block mb-1">✕ Naskah Sebelum Diubah:</span>
                    <p className="line-clamp-4 leading-relaxed">{preset.consolidatedPreview.before}</p>
                  </div>
                  <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-3 text-emerald-200">
                    <span className="text-emerald-400 font-bold block mb-1">✓ Naskah Sesudah Amandemen:</span>
                    <p className="line-clamp-4 leading-relaxed whitespace-pre-line">{preset.consolidatedPreview.after}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    href="/uu/ite"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white font-bold text-xs transition-all shadow-md"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Buka Naskah Hasil Produksi di Workspace Reader</span>
                  </Link>

                  <Link
                    href="/neuron"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/15 transition-all"
                  >
                    <GitBranch className="w-4 h-4 text-amber-300" />
                    <span>Lihat di Peta Silsilah Hukum</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Navigasi Manual Bawah */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-6 text-xs font-mono">
            <button
              onClick={() => {
                setCurrentStation((s) => Math.max(s - 1, 1) as FactoryStation);
                setIsPlaying(false);
              }}
              disabled={currentStation === 1}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 cursor-pointer"
            >
              ◀ Stasiun Sebelumnya
            </button>
            <span className="text-slate-400">
              Gunakan tombol di atas untuk menjalankan pabrik otomatis secara real-time
            </span>
            <button
              onClick={() => {
                setCurrentStation((s) => Math.min(s + 1, 6) as FactoryStation);
                setIsPlaying(false);
              }}
              disabled={currentStation === 6}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 cursor-pointer"
            >
              Stasiun Selanjutnya ▶
            </button>
          </div>
        </section>

        {/* ── Konsol Telemetri Live Log (Real-time Machine Logs) ───── */}
        <section className="bg-[#0F0406] border border-[#2D1418] rounded-3xl p-4 sm:p-5 shadow-xl font-mono text-xs">
          <div className="flex items-center justify-between mb-3 text-slate-400">
            <span className="flex items-center gap-2 text-white font-bold">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Konsol Telemetri Pabrik (Live Machine Event Stream)
            </span>
            <span className="text-[10px] text-slate-500">Mencatat aktivitas mesin pemroses detik-demi-detik</span>
          </div>

          <div className="bg-black/60 rounded-2xl p-3 border border-white/5 max-h-36 overflow-y-auto space-y-1 text-slate-300 scrollbar-thin">
            {telemetryLogs.length === 0 ? (
              <span className="text-slate-500 italic">Mesin standby. Tekan 'Jalankan Pabrik' untuk memulai aliran log...</span>
            ) : (
              telemetryLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  <span className="text-emerald-400">{log}</span>
                </div>
              ))
            )}
          </div>
        </section>

      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-[#2D1418] bg-[#0E0305] py-4 text-center text-xs text-slate-500 font-mono">
        SIPAKA Legal-Tech Intelligence · Automated Assembly Line Simulator
      </footer>
    </div>
  );
}

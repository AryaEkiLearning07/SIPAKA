'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Play, Pause, RotateCcw, ChevronRight, CheckCircle2,
  AlertTriangle, ShieldCheck, Database, Cpu, FileText, Search,
  Download, GitBranch, Eye, ArrowRight, Layers, Terminal, Sparkles,
  Lock, RefreshCw, Check, Clock, Server, FileCode, CheckCheck,
  AlertCircle, ExternalLink, ShieldAlert, BarChart3, BookOpen, LogIn
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type PipelineStep = 1 | 2 | 3 | 4 | 5 | 6;

interface SimulationPreset {
  id: string;
  title: string;
  sourceUrl: string;
  sourceName: string;
  regulationType: string;
  numberYear: string;
  lnNumber: string;
  tlnNumber: string;
  fileSize: string;
  sha256: string;
  rawWordCount: number;
  totalArticlesParsed: number;
  articlesModified: number;
  articlesAdded: number;
  articlesRepealed: number;
  impactedRegulationsCount: number;
  sampleArticle: {
    pasal: string;
    action: 'DIUBAH' | 'DITAMBAH' | 'DICABUT' | 'BERSYARAT_MK';
    textInduk: string;
    textAmandemen: string;
    textKonsolidasi: string;
    ratioDecidendi?: string;
  };
}

const PRESETS: Record<string, SimulationPreset> = {
  'uu-1-2024': {
    id: 'uu-1-2024',
    title: 'UU No. 1 Tahun 2024 (Perubahan Kedua UU ITE)',
    sourceUrl: 'https://jdihn.go.id/files/uu_1_2024_lnri_8.pdf',
    sourceName: 'Portal JDIHN Kemenkumham & Lembaran Negara RI',
    regulationType: 'Undang-Undang (Amandemen)',
    numberYear: 'UU No. 1 Tahun 2024',
    lnNumber: 'Lembaran Negara RI Tahun 2024 No. 8',
    tlnNumber: 'Tambahan Lembaran Negara RI No. 6916',
    fileSize: '2.84 MB',
    sha256: '9b7f4e82c1a056d3e89bc51347602fae804f56db7419e078a9c8b746231d601b',
    rawWordCount: 14820,
    totalArticlesParsed: 14,
    articlesModified: 8,
    articlesAdded: 4,
    articlesRepealed: 2,
    impactedRegulationsCount: 3,
    sampleArticle: {
      pasal: 'Pasal 27 ayat (3) -> Pasal 27A & 27B',
      action: 'DIUBAH',
      textInduk: 'Pasal 27 ayat (3) UU 11/2008:\nSetiap Orang dengan sengaja dan tanpa hak mendistribusikan dan/atau mentransmisikan dan/atau membuat dapat diaksesnya Informasi Elektronik dan/atau Dokumen Elektronik yang memiliki muatan penghinaan dan/atau pencemaran nama baik.',
      textAmandemen: 'Pasal 27 ayat (3) DICABUT. Disisipkan Pasal 27A:\nSetiap Orang yang dengan sengaja menyerang kehormatan atau nama baik orang lain dengan menuduhkan suatu hal melalui Sistem Elektronik dengan maksud agar hal tersebut diketahui umum, dipidana dengan pidana penjara paling lama 2 tahun.',
      textKonsolidasi: '[NASKAH KONSOLIDASI AKTIF]\nPasal 27 ayat (3) [DIHAPUS berdasarkan UU No. 1 Tahun 2024]\n\nPasal 27A [BARU - UU 1/2024]:\nSetiap Orang yang dengan sengaja menyerang kehormatan atau nama baik orang lain dengan menuduhkan suatu hal melalui Sistem Elektronik dengan maksud agar hal tersebut diketahui umum, dipidana penjara paling lama 2 tahun atau denda kategori II.\n(Catatan: Delik aduan absolut, hanya dapat dituntut atas persetujuan korban langsung).',
      ratioDecidendi: 'Menghilangkan sifat pasal karet multitafsir, menurunkan ancaman pidana agar tidak dapat ditahan saat penyidikan, dan menegaskan status delik aduan absolut.'
    }
  },
  'putusan-mk-50-2008': {
    id: 'putusan-mk-50-2008',
    title: 'Putusan MK No. 50/PUU-VI/2008 (Uji Materiil Pasal 27 ITE)',
    sourceUrl: 'https://mkri.id/public/content/persidangan/putusan/putusan_50_PUU-VI_2008.pdf',
    sourceName: 'Direktori Resmi Putusan Mahkamah Konstitusi RI',
    regulationType: 'Putusan Pengujian Konstitusionalitas (MK)',
    numberYear: 'Putusan MK No. 50/PUU-VI/2008',
    lnNumber: 'Berita Negara RI Tahun 2009',
    tlnNumber: 'Sifat: Final & Binding (Erga Omnes)',
    fileSize: '4.15 MB',
    sha256: '3f6c8d20e981aa45700234b6e82c317da024f056191bce47182da910403328e1',
    rawWordCount: 38450,
    totalArticlesParsed: 2,
    articlesModified: 2,
    articlesAdded: 0,
    articlesRepealed: 0,
    impactedRegulationsCount: 2,
    sampleArticle: {
      pasal: 'Pasal 27 ayat (3) jo. Pasal 45 ayat (1)',
      action: 'BERSYARAT_MK',
      textInduk: 'Pasal 27 ayat (3) UU 11/2008:\nSetiap Orang dengan sengaja dan tanpa hak mendistribusikan... muatan penghinaan dan/atau pencemaran nama baik.',
      textAmandemen: 'AMAR PUTUSAN MK:\nMenyatakan Pasal 27 ayat (3) adalah konstitusional bersyarat (conditionally constitutional) sepanjang dimaknai sebagai delik aduan (klachtdelict) yang mengacu pada Pasal 310 & 311 KUHP.',
      textKonsolidasi: '[NASKAH KONSOLIDASI DENGAN TAFSIR MK]\nPasal 27 ayat (3):\nSetiap Orang dengan sengaja dan tanpa hak mendistribusikan muatan penghinaan dan/atau pencemaran nama baik.\n⚠️ CATATAN TAFSIR MK (Putusan 50/PUU-VI/2008):\n"Wajib diberlakukan sebagai delik aduan absolut, bukan delik umum. Penuntutan batal demi hukum jika tanpa aduan korban langsung."',
      ratioDecidendi: 'Hak atas kehormatan martabat adalah hak individual asasi manusia. Penegakan hukum pidana tidak boleh diintervensi oleh pihak ketiga tanpa persetujuan korban.'
    }
  },
  'uu-1-2023': {
    id: 'uu-1-2023',
    title: 'UU No. 1 Tahun 2023 (Kitab Undang-Undang Hukum Pidana / KUHP Baru)',
    sourceUrl: 'https://jdih.setneg.go.id/view_pdf/uu_1_2023_kuhp.pdf',
    sourceName: 'JDIH Kementerian Sekretariat Negara RI',
    regulationType: 'Undang-Undang (Kodifikasi Induk)',
    numberYear: 'UU No. 1 Tahun 2023',
    lnNumber: 'Lembaran Negara RI Tahun 2023 No. 1',
    tlnNumber: 'Tambahan Lembaran Negara RI No. 6832',
    fileSize: '8.92 MB',
    sha256: 'e5b7218490a0d4c25f187a569cb84f3e6912380a91176b978ceba104a378d302',
    rawWordCount: 89400,
    totalArticlesParsed: 624,
    articlesModified: 0,
    articlesAdded: 624,
    articlesRepealed: 0,
    impactedRegulationsCount: 18,
    sampleArticle: {
      pasal: 'Buku Kesatu & Buku Kedua (624 Pasal)',
      action: 'DITAMBAH',
      textInduk: '[Naskah Lama: WvS / Wetboek van Strafrecht Staatsblad 1915 No. 732]',
      textAmandemen: 'UU 1/2023 Menggantikan seluruh WvS kolonial dengan prinsip hukum pidana modern, dekolonisasi, restorative justice, dan hukum yang hidup dalam masyarakat (living law).',
      textKonsolidasi: '[KODIFIKASI BARU BERLAKU 2 JANUARI 2026]\nSeluruh 624 Pasal tersusun dalam Buku Kesatu (Aturan Umum) dan Buku Kedua (Tindak Pidana).\nSeluruh delik undang-undang pidana khusus di luar KUHP tunduk pada Buku Kesatu UU 1/2023.',
      ratioDecidendi: 'Transisi fundamental sistem pemidanaan dari retributif (balas dendam) menjadi rehabilitatif, restoratif, dan rekonsiliatif.'
    }
  }
};

const STEP_DEFINITIONS = [
  {
    step: 1 as PipelineStep,
    title: '1. Scraping & Unduh PDF Resmi',
    subtitle: 'Crawling API JDIHN / Setneg & Direktori Putusan MK',
    icon: Download,
    shortBadge: 'Scrape'
  },
  {
    step: 2 as PipelineStep,
    title: '2. Ingestion & Registrasi Staging',
    subtitle: 'Validasi SHA-256 & Registrasi ChangeSet di Database',
    icon: Database,
    shortBadge: 'Ingest'
  },
  {
    step: 3 as PipelineStep,
    title: '3. Zero-Loss AST Parsing',
    subtitle: 'Ekstraksi Hierarki Bab -> Bagian -> Pasal -> Ayat',
    icon: Cpu,
    shortBadge: 'Parse AST'
  },
  {
    step: 4 as PipelineStep,
    title: '4. Pencocokan & Diff Engine',
    subtitle: 'Cross-Referencing Pasal Induk vs Perubahan/Putusan MK',
    icon: GitBranch,
    shortBadge: 'Match & Diff'
  },
  {
    step: 5 as PipelineStep,
    title: '5. Pre-Flight Audit & Approval',
    subtitle: '4 Syarat Wajib Lolos Verifikasi Dewan Kurator Hukum',
    icon: ShieldCheck,
    shortBadge: 'Quality Gate'
  },
  {
    step: 6 as PipelineStep,
    title: '6. Publikasi Publik (Live Catalog)',
    subtitle: 'Naskah Resmi Konsolidasi Tayang di Katalog SIPAKA',
    icon: CheckCheck,
    shortBadge: 'Live Public'
  }
];

export default function PipelineInteractiveDashboard() {
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('uu-1-2024');
  const [currentStep, setCurrentStep] = useState<PipelineStep>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'visual' | 'ast' | 'telemetry' | 'sop'>('visual');
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);

  // Status Checkbox Dewan Kurator (Quality Gates)
  const [gateChecks, setGateChecks] = useState({
    sha256Match: true,
    zeroLossPassed: true,
    hierarchySync: true,
    curatorSigned: false
  });

  const [logs, setLogs] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const preset = PRESETS[selectedPresetKey];

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          if (json.user) setCurrentUser(json.user);
        }
      } catch {
        // Tamu
      }
    })();
  }, []);

  // Update logs when step or preset changes
  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour12: false });
    let newLogs: string[] = [];

    if (currentStep === 1) {
      newLogs = [
        `[${timestamp}] [CRAWLER] Melakukan handshake HTTP GET ke ${preset.sourceUrl}`,
        `[${timestamp}] [STATUS] HTTP 200 OK — Header 'content-type: application/pdf'`,
        `[${timestamp}] [DOWNLOAD] Mengunduh payload biner ${preset.fileSize} dari ${preset.sourceName}`,
        `[${timestamp}] [METADATA] Terekstrak: ${preset.numberYear} | ${preset.lnNumber}`,
        `[${timestamp}] [PROVENANCE] URL Sumber resmi diverifikasi tersimpan di metadata ledger`
      ];
    } else if (currentStep === 2) {
      newLogs = [
        `[${timestamp}] [CRYPTO] Menghitung checksum SHA-256 naskah biner...`,
        `[${timestamp}] [HASH] SHA-256: ${preset.sha256}`,
        `[${timestamp}] [DEDUP] Memeriksa tabel registry peraturan: Kunci (${preset.regulationType}, ${preset.numberYear})`,
        `[${timestamp}] [DEDUP] Hasil: Dokumen baru terverifikasi. Tidak ada duplikasi konflik.`,
        `[${timestamp}] [STAGING] Mendaftarkan berkas ke Local Object Store: /storage/raw/${preset.id}.pdf`,
        `[${timestamp}] [DATABASE] Membuat ChangeSet draf [ID: cs-${preset.id}-001] berstatus STAGED_DRAFT`
      ];
    } else if (currentStep === 3) {
      newLogs = [
        `[${timestamp}] [AST-PARSER] Mengaktifkan PyMuPDF & Zero-Loss Lexical Tokenizer...`,
        `[${timestamp}] [SCAN] Membaca total ${preset.rawWordCount.toLocaleString('id-ID')} kata dari teks resmi`,
        `[${timestamp}] [STRUCTURE] Memetakan hierarki regulasi: BAB -> BAGIAN -> PASAL -> AYAT -> HURUF`,
        `[${timestamp}] [ZERO-LOSS] Verifikasi: 0 kata tertinggal, tingkat kehilangan 0.00% (Zero-Loss Verified)`,
        `[${timestamp}] [CLASSIFIER] Deteksi Operasi: ${preset.articlesModified} pasal diubah, ${preset.articlesAdded} pasal ditambah, ${preset.articlesRepealed} pasal dicabut`,
        `[${timestamp}] [AST-TREE] Total ${preset.totalArticlesParsed} simpul pasal hukum berhasil dikonstruksi ke dalam Abstract Syntax Tree`
      ];
    } else if (currentStep === 4) {
      newLogs = [
        `[${timestamp}] [DIFF-ENGINE] Memuat naskah induk eksisting dari basis data SIPAKA...`,
        `[${timestamp}] [MATCH] Mencocokkan simpul amandemen dengan pasal induk terkait`,
        `[${timestamp}] [CONSOLIDATION] Menerapkan operasi substitusi teks dan penomoran sisipan`,
        `[${timestamp}] [MK-WATCH] Mengaitkan putusan judicial review Mahkamah Konstitusi terkait`,
        `[${timestamp}] [HARMONISASI] Deteksi Dampak: ${preset.impactedRegulationsCount} regulasi turunan (PP/Permen) memerlukan penyesuaian cantolan`,
        `[${timestamp}] [DIFF-RESULT] Naskah konsolidasi deterministik berhasil dirajut tanpa konflik semantik`
      ];
    } else if (currentStep === 5) {
      newLogs = [
        `[${timestamp}] [PRE-FLIGHT] Mengaktifkan 4 Gerbang Validasi Pra-Publikasi (Quality Gates)...`,
        `[${timestamp}] [GATE 1] Integritas Kriptografi SHA-256: VALID (100% Cocok dengan Lembaran Negara)`,
        `[${timestamp}] [GATE 2] Zero-Loss Integrity Token Audit: VALID (0.00% Kata Tercecer)`,
        `[${timestamp}] [GATE 3] Validasi Sinkronisasi Hierarki Lintas Norma: VALID (Stufenbau Sesuai UU 12/2011)`,
        `[${timestamp}] [GATE 4] Menunggu telaah & tanda tangan digital Dewan Kurator/Editor Hukum SIPAKA...`
      ];
    } else if (currentStep === 6) {
      newLogs = [
        `[${timestamp}] [APPROVAL] Dewan Kurator menyetujui perubahan naskah [Status: APPROVED]`,
        `[${timestamp}] [PUBLISH] Menerbitkan ChangeSet ke Master Consolidated Ledger [Status: PUBLISHED]`,
        `[${timestamp}] [INDEX] Mengindeks seluruh pasal ke mesin pencarian Full-Text Search (BM25 + Semantic Vector)`,
        `[${timestamp}] [NEURON] Memperbarui graf silsilah hubungan peraturan pada Peta Silsilah Regulasi (/neuron)`,
        `[${timestamp}] [LIVE] Naskah resmi konsolidasi kini aktif 100% dan dapat diakses publik tanpa login di katalog SIPAKA`
      ];
    }

    setLogs(newLogs);
  }, [currentStep, preset]);

  // Auto-play timer handler
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= 6) {
            setIsPlaying(false);
            return 6;
          }
          if (prev === 5 && !gateChecks.curatorSigned) {
            // Otomatis tandatangani saat simulasi auto-play mencapai tahap 5
            setGateChecks((g) => ({ ...g, curatorSigned: true }));
          }
          return (prev + 1) as PipelineStep;
        });
      }, 3500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, gateChecks.curatorSigned]);

  const handleNextStep = () => {
    if (currentStep === 5 && !gateChecks.curatorSigned) {
      setGateChecks((g) => ({ ...g, curatorSigned: true }));
    }
    if (currentStep < 6) setCurrentStep((prev) => (prev + 1) as PipelineStep);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as PipelineStep);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(1);
    setGateChecks({
      sha256Match: true,
      zeroLossPassed: true,
      hierarchySync: true,
      curatorSigned: false
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      {/* ── Top Notice Bar (#861619 & Pill #6A2225) ── */}
      <div className="bg-[#861619] text-white text-xs py-1.5 px-4 sm:px-6 border-b border-[#6A2225] select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-[#6A2225] text-amber-300 px-2 py-0.5 rounded font-mono font-bold text-[10px] tracking-wide uppercase shadow-2xs">
              Simulasi ETL
            </span>
            <span className="text-white/95 text-[11px] truncate font-medium">
              Dashboard Interaktif Pipeline Ingestion, Parsing AST &amp; Konsolidasi Hukum SIPAKA
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3 text-[11px] text-white/80">
            <span>Standar: Zero-Loss Legal AST &amp; SHA-256 Ledger</span>
            <span>·</span>
            <span className="text-amber-300 font-semibold">Paritas Lembaran Negara RI</span>
          </div>
        </div>
      </div>

      {/* ── Header Area dengan Navbar Bersih ─────────── */}
      <div className="bg-[#94191C] pt-3 pb-4 border-b border-[#861619]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl shadow-md border border-slate-200/90 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-[#94191C] text-white flex items-center justify-center font-black text-base shadow-sm">
                S
              </div>
              <span className="font-sans font-black text-xl text-slate-900 tracking-tight">
                SIPAKA<span className="text-[#94191C]">.</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 sm:gap-3 text-xs sm:text-sm font-semibold">
              <Link
                href="/"
                className="text-slate-700 hover:text-[#94191C] px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Beranda
              </Link>
              <Link
                href="/katalog"
                className="text-slate-700 hover:text-[#94191C] px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Katalog JDIH
              </Link>
              <Link
                href="/pipeline"
                className="text-[#94191C] px-3 py-1.5 rounded-lg bg-red-50/80 font-bold border-b-2 border-[#94191C]"
              >
                Pipeline Ingestion
              </Link>
              <Link
                href="/neuron"
                className="text-slate-700 hover:text-[#94191C] px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Peta Silsilah
              </Link>
              <Link
                href="/tentang"
                className="text-slate-700 hover:text-[#94191C] px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Metodologi
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              {currentUser ? (
                <Link
                  href="/masuk"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-800 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-[#94191C] text-white flex items-center justify-center text-[10px]">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{currentUser.name}</span>
                </Link>
              ) : (
                <Link
                  href="/masuk"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-white" />
                  <span>Masuk / Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Subheader Hero Panel ───────────────────── */}
      <div className="bg-gradient-to-r from-[#2B0B06] via-[#861619] to-[#94191C] text-white py-6 px-4 sm:px-6 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/30 border border-white/20 text-xs font-mono text-amber-300 mb-2">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>LIVE AUTOMATED INGESTION ENGINE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Visualisator Pipeline Scraping, Parsing &amp; Konsolidasi Hukum
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
              Pantau bagaimana naskah hukum mentah ditarik dari portal resmi negara, diekstrak dengan AST Zero-Loss, dicocokkan dengan norma induk, diaudit oleh 4 gerbang mutu, hingga resmi diterbitkan ke publik.
            </p>
          </div>

          {/* Preset Selector */}
          <div className="bg-black/40 border border-white/20 p-2.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-2.5 backdrop-blur-md">
            <span className="text-xs font-semibold text-amber-200 uppercase tracking-wider font-mono">
              Dokumen Target:
            </span>
            <select
              value={selectedPresetKey}
              onChange={(e) => {
                setSelectedPresetKey(e.target.value);
                handleReset();
              }}
              className="bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              <option value="uu-1-2024">UU No. 1 Tahun 2024 (Revisi ITE)</option>
              <option value="putusan-mk-50-2008">Putusan MK No. 50/PUU-VI/2008</option>
              <option value="uu-1-2023">UU No. 1 Tahun 2023 (KUHP Baru)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Main Interactive Control Bar ──────────── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-[#94191C] hover:bg-[#861619] text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Jeda Simulasi' : 'Jalankan Otomatis'}</span>
            </button>

            <button
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Langkah Sebelumnya"
            >
              Kembali
            </button>

            <button
              onClick={handleNextStep}
              disabled={currentStep === 6}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Langkah Selanjutnya"
            >
              <span>Lanjut</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-red-700 hover:bg-red-50 transition-colors"
              title="Reset ke Langkah 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Stepper Dots / Badges */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1">
            {STEP_DEFINITIONS.map((s) => {
              const isActive = currentStep === s.step;
              const isPassed = currentStep > s.step;

              return (
                <button
                  key={s.step}
                  onClick={() => setCurrentStep(s.step)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#94191C] text-white shadow-xs'
                      : isPassed
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                        isActive ? 'bg-white text-[#94191C] font-bold' : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {s.step}
                    </span>
                  )}
                  <span>{s.shortBadge}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content Layout ────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* Step Banner Information */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-[#94191C] border border-red-200 flex items-center justify-center shrink-0 shadow-2xs">
              {React.createElement(STEP_DEFINITIONS[currentStep - 1].icon, { className: 'w-6 h-6' })}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#94191C] bg-red-100/70 px-2 py-0.5 rounded">
                  Tahap {currentStep} dari 6
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  {currentStep === 6 ? 'Status: 100% Selesai & Terpublikasi' : 'Pipeline Sedang Aktif'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {STEP_DEFINITIONS[currentStep - 1].title}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {STEP_DEFINITIONS[currentStep - 1].subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Target: <strong>{preset.numberYear}</strong> ({preset.fileSize})</span>
          </div>
        </div>

        {/* ── Dynamic Stage View Component ────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Visualizer Area (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* TAHAP 1: SCRAPING & UNDUH PDF RESMI */}
            {currentStep === 1 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Download className="w-4 h-4 text-[#94191C]" />
                    <span>Simulasi Ekstraksi dari Sumber Resmi Negara</span>
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                    HTTP 200 OK
                  </span>
                </div>

                <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-2.5 overflow-x-auto shadow-inner">
                  <div className="text-slate-400">// 1. Client Engine Mengirimkan Request HTTP Otomatis</div>
                  <div className="text-amber-400 font-bold">
                    GET {preset.sourceUrl}
                  </div>
                  <div className="text-slate-400">
                    Host: jdihn.go.id | jdih.setneg.go.id<br />
                    User-Agent: SIPAKA-LegalBot/1.2 (+https://sipaka.law/crawler)<br />
                    Accept: application/pdf, application/json<br />
                    Rate-Limiting: Adaptive (Max 3 req/detik agar ramah server negara)
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-emerald-400">
                    ✓ Respon Diterima: Ukuran Payload = {preset.fileSize} (PDF Asli Lembaran Negara RI)
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] text-slate-600 font-medium">Lembaga Penerbit</div>
                    <div className="font-bold text-xs text-slate-900 mt-1 truncate">{preset.sourceName}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] text-slate-600 font-medium">Publikasi Resmi</div>
                    <div className="font-bold text-xs text-slate-900 mt-1">{preset.lnNumber}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] text-slate-600 font-medium">Tambahan LN (TLN)</div>
                    <div className="font-bold text-xs text-slate-900 mt-1">{preset.tlnNumber}</div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Prinsip Anti-Halusinasi Sumber:</strong> Sistem SIPAKA hanya menerima berkas biner PDF asli yang diterbitkan langsung oleh kanal resmi Lembaran Negara RI atau Direktori Putusan Mahkamah Konstitusi. Tidak ada data yang bersumber dari blog atau naskah sekunder.
                  </div>
                </div>
              </div>
            )}

            {/* TAHAP 2: INGESTION & REGISTRASI STAGING */}
            {currentStep === 2 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#94191C]" />
                    <span>Cryptographic Hash &amp; Deduplication Guard</span>
                  </h3>
                  <span className="text-[11px] font-mono text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-semibold">
                    STAGED_DRAFT
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Cryptographic Checksum (SHA-256):</span>
                    <span className="text-emerald-700 font-mono font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi Unik
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 break-all select-all">
                    {preset.sha256}
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Nilai hash ini menjamin bahwa naskah fisik di server SIPAKA 100% bit-per-bit identik dengan berkas resmi negara dan tidak dapat dimanipulasi secara diam-diam.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <Lock className="w-3.5 h-3.5 text-[#94191C]" />
                      <span>Deduplication Guard</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Sistem memeriksa apakah regulasi ini sudah pernah diinput sebelumnya. Bila regulasi merupakan amandemen, sistem otomatis membuat tautan relasi (*foreign key*) ke naskah induk.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <FileCode className="w-3.5 h-3.5 text-blue-600" />
                      <span>Staging Area / ChangeSet</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Dokumen disimpan dalam tabel draf <code>ChangeSet</code> dengan status <strong>IN_REVIEW</strong>. Naskah belum langsung menggantikan peraturan publik sebelum diverifikasi kurator.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAHAP 3: ZERO-LOSS AST PARSING */}
            {currentStep === 3 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#94191C]" />
                    <span>Dekomposisi Struktur Hukum (Zero-Loss AST)</span>
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                    0.00% Word Loss
                  </span>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Total Kata Input</div>
                    <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                      {preset.rawWordCount.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Kata Terekstrak</div>
                    <div className="text-base font-black text-emerald-700 font-mono mt-0.5">
                      {preset.rawWordCount.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Simpul Pasal AST</div>
                    <div className="text-base font-black text-[#94191C] font-mono mt-0.5">
                      {preset.totalArticlesParsed} Pasal
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Integritas Parsial</div>
                    <div className="text-base font-black text-blue-700 font-mono mt-0.5">
                      100% Utuh
                    </div>
                  </div>
                </div>

                {/* Parsing Tree Visualization */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-slate-50 font-mono text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#94191C]" />
                    <span>Struktur Pohon Sintaksis Hukum (AST Result):</span>
                  </div>
                  <div className="pl-4 border-l-2 border-slate-300 space-y-1.5 text-slate-700">
                    <div>├── 📁 <strong>DOKUMEN_REGULASI</strong> [{preset.numberYear}]</div>
                    <div className="pl-4">├── 📁 <strong>BAB I: KETENTUAN UMUM</strong> (Definisi &amp; Asas)</div>
                    <div className="pl-4">
                      ├── 📁 <strong>BAB VII: PERBUATAN YANG DILARANG</strong>
                      <div className="pl-4 text-slate-600">
                        <div>├── 📄 <strong>Pasal 27</strong> (Substansi: Restrukturisasi Ayat)</div>
                        <div className="text-emerald-700 font-bold">├── ➕ <strong>Pasal 27A</strong> [SISIPAN BARU — Penyerangan Kehormatan/Nama Baik]</div>
                        <div className="text-emerald-700 font-bold">├── ➕ <strong>Pasal 27B</strong> [SISIPAN BARU — Pemerasan &amp; Pengancaman Digital]</div>
                      </div>
                    </div>
                    <div className="pl-4">
                      ├── 📁 <strong>BAB XI: KETENTUAN PIDANA</strong>
                      <div className="pl-4 text-slate-600">
                        <div className="text-blue-700 font-bold">├── ✏️ <strong>Pasal 45</strong> [PENYESUAIAN — Penurunan Ancaman Pidana Maks 2 Thn]</div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Zero-Loss Principle:</strong> Parser dilarang meringkas (*summarize*) atau mengubah tanda baca titik koma naskah. Setiap huruf dan frasa asli dipertahankan secara utuh dalam bentuk token representasi formal.
                </p>
              </div>
            )}

            {/* TAHAP 4: PENCOCOKAN & DIFF ENGINE */}
            {currentStep === 4 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-[#94191C]" />
                    <span>Pencocokan Deterministik &amp; Diff Engine Tiga Kolom</span>
                  </h3>
                  <span className="text-[11px] font-mono text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded font-semibold">
                    Side-by-Side Diff
                  </span>
                </div>

                <div className="text-xs text-slate-600">
                  Berikut adalah contoh komparasi atomik pada pasal yang diamandemen atau diputus Mahkamah Konstitusi:
                </div>

                {/* 3-Column Diff Table */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Col 1: Induk Lama */}
                  <div className="bg-red-50/70 border border-red-200 rounded-xl p-3.5 space-y-2">
                    <div className="font-bold text-red-900 flex items-center justify-between">
                      <span>Naskah Induk (Lama)</span>
                      <span className="text-[10px] bg-red-200 text-red-800 px-1.5 py-0.5 rounded font-mono">
                        Asli
                      </span>
                    </div>
                    <div className="text-slate-700 leading-relaxed line-through decoration-red-500 whitespace-pre-line text-[11px]">
                      {preset.sampleArticle.textInduk}
                    </div>
                  </div>

                  {/* Col 2: Naskah Amandemen / Putusan MK */}
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-2">
                    <div className="font-bold text-blue-900 flex items-center justify-between">
                      <span>Perubahan / Amar MK</span>
                      <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded font-mono">
                        {preset.sampleArticle.action}
                      </span>
                    </div>
                    <div className="text-slate-800 leading-relaxed whitespace-pre-line text-[11px]">
                      {preset.sampleArticle.textAmandemen}
                    </div>
                  </div>

                  {/* Col 3: Hasil Konsolidasi Baru */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                    <div className="font-bold text-emerald-900 flex items-center justify-between">
                      <span>Naskah Konsolidasi SIPAKA</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                        Aktif
                      </span>
                    </div>
                    <div className="text-slate-900 leading-relaxed whitespace-pre-line text-[11px] font-medium">
                      {preset.sampleArticle.textKonsolidasi}
                    </div>
                  </div>
                </div>

                {/* Harmonisasi Turunan Alert */}
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Deteksi Dampak Otomatis:</strong> Terdeteksi{' '}
                    <strong>{preset.impactedRegulationsCount} regulasi turunan</strong> (termasuk PP 71/2019 &amp; Permenkominfo 5/2020) yang kehilangan cantolan pasal atau membutuhkan penyesuaian harmonisasi karena perubahan norma ini.
                  </div>
                </div>
              </div>
            )}

            {/* TAHAP 5: PRE-FLIGHT AUDIT & QUALITY GATE */}
            {currentStep === 5 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#94191C]" />
                    <span>4 Gerbang Validasi Pra-Publikasi (Quality Gates)</span>
                  </h3>
                  <span className="text-[11px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold">
                    Tahap Kurasi
                  </span>
                </div>

                <div className="text-xs text-slate-600">
                  Untuk menjaga integritas ilmiah dan hukum, naskah tidak dapat diterbitkan ke publik sebelum seluruh 4 gerbang berikut berstatus <strong>VALID</strong>:
                </div>

                {/* 4 Gates Checklist */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1 text-xs">
                      <div className="font-bold text-slate-900">1. Integritas Kriptografi SHA-256</div>
                      <p className="text-slate-600 mt-0.5">
                        Hash naskah lokal cocok 100% dengan naskah PDF resmi Lembaran Negara RI. Nol manipulasi teks.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                      LOLOS
                    </span>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1 text-xs">
                      <div className="font-bold text-slate-900">2. Zero-Loss Token &amp; Word Audit</div>
                      <p className="text-slate-600 mt-0.5">
                        Jumlah kata PDF ({preset.rawWordCount.toLocaleString('id-ID')}) terbukti sama persis dengan total kata dalam simpul AST. Nol pasal tercecer.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                      LOLOS
                    </span>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1 text-xs">
                      <div className="font-bold text-slate-900">3. Validasi Hierarki Peraturan (UU 12/2011)</div>
                      <p className="text-slate-600 mt-0.5">
                        Kedudukan norma, delegasi atribusi peraturan pelaksana, dan konsistensi silsilah Stufenbau telah terpetakan tanpa konflik.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                      LOLOS
                    </span>
                  </div>

                  <div className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                    gateChecks.curatorSigned
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-amber-50/70 border-amber-300'
                  }`}>
                    {gateChecks.curatorSigned ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                    )}
                    <div className="flex-1 text-xs">
                      <div className="font-bold text-slate-900">4. Telaah &amp; Persetujuan Dewan Kurator / Editor Hukum</div>
                      <p className="text-slate-600 mt-0.5">
                        {gateChecks.curatorSigned
                          ? 'Telah diverifikasi dan ditandatangani oleh Dewan Kurator Hukum SIPAKA.'
                          : 'Memerlukan otorisasi manusia (Human-in-the-Loop) sebelum naskah dilepas ke katalog publik.'}
                      </p>
                    </div>
                    {gateChecks.curatorSigned ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                        DISETUJUI
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setGateChecks((g) => ({ ...g, curatorSigned: true }));
                          setCurrentStep(6);
                        }}
                        className="px-3 py-1 bg-[#94191C] hover:bg-[#861619] text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                      >
                        Beri Otorisasi
                      </button>
                    )}
                  </div>
                </div>

                {!gateChecks.curatorSigned && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => {
                        setGateChecks((g) => ({ ...g, curatorSigned: true }));
                        setCurrentStep(6);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>Setujui Semua Gerbang &amp; Terbitkan ke Publik (1-Click Publish)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAHAP 6: PUBLIKASI PUBLIK */}
            {currentStep === 6 && (
              <div className="bg-white rounded-2xl p-6 border border-emerald-300 shadow-sm space-y-5 bg-gradient-to-b from-emerald-50/20 to-white">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Naskah Resmi Berhasil Diterbitkan ke Publik!
                      </h3>
                      <p className="text-xs text-slate-600">
                        Status dokumen kini: <strong>PUBLISHED</strong> pada Katalog SIPAKA
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-white bg-emerald-600 px-2.5 py-0.5 rounded-full font-bold shadow-2xs">
                    PUBLISHED
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 text-white font-mono text-xs space-y-2">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Naskah Konsolidasi Kini Siap Digunakan:</span>
                  </div>
                  <div className="text-slate-300 space-y-1 text-[11px] pt-1 border-t border-slate-800">
                    <div>• URL Publik SIPAKA: <strong>https://sipaka.law/uu/ite</strong></div>
                    <div>• Rilis Versi: v2.1 (Konsolidasi UU 11/2008 + UU 19/2016 + UU 1/2024)</div>
                    <div>• Indeks Pencarian: 100% Terindeks di Full-Text &amp; Semantic Search</div>
                    <div>• Peta Silsilah: 14 Simpul Terhubung di Halaman /neuron</div>
                    <div>• Audit Trail ID: #AT-20240924-{preset.id}-STAMP-OK</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    href="/uu/ite"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Buka Reader Naskah Resmi di SIPAKA</span>
                  </Link>

                  <Link
                    href="/neuron"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-[#94191C]" />
                    <span>Lihat Peta Silsilah &amp; Dampak (/neuron)</span>
                  </Link>

                  <Link
                    href="/katalog"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Cari Peraturan Lain di Katalog</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Telemetry & Inspector (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Inspector Tab Switcher */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-100 p-1 flex items-center gap-1 border-b border-slate-200">
                <button
                  onClick={() => setActiveInspectorTab('visual')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    activeInspectorTab === 'visual'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Silsilah Alur
                </button>
                <button
                  onClick={() => setActiveInspectorTab('telemetry')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    activeInspectorTab === 'telemetry'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Log Mesin
                </button>
                <button
                  onClick={() => setActiveInspectorTab('ast')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    activeInspectorTab === 'ast'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  JSON AST
                </button>
                <button
                  onClick={() => setActiveInspectorTab('sop')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    activeInspectorTab === 'sop'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  SOP Publik
                </button>
              </div>

              <div className="p-4">
                {/* TAB 1: Silsilah Alur */}
                {activeInspectorTab === 'visual' && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-800">
                      Diagram Alir Pipeline Real-Time:
                    </div>
                    <div className="space-y-2 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {STEP_DEFINITIONS.map((s) => {
                        const isCurrent = currentStep === s.step;
                        const isDone = currentStep > s.step;

                        return (
                          <div
                            key={s.step}
                            onClick={() => setCurrentStep(s.step)}
                            className={`relative pl-8 text-xs cursor-pointer p-1.5 rounded-lg transition-all ${
                              isCurrent
                                ? 'bg-red-50 text-[#94191C] font-bold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span
                              className={`absolute left-2 top-2 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] -translate-x-1/2 ${
                                isCurrent
                                  ? 'bg-[#94191C] text-white ring-4 ring-red-100'
                                  : isDone
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-300 text-slate-700'
                              }`}
                            >
                              {isDone ? '✓' : s.step}
                            </span>
                            <div className="leading-tight">{s.title}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 2: Log Mesin Telemetri */}
                {activeInspectorTab === 'telemetry' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-[#94191C]" />
                        <span>Live Execution Logs</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Stream OK</span>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-3 font-mono text-[11px] text-slate-300 h-64 overflow-y-auto space-y-1.5 shadow-inner">
                      {logs.map((l, idx) => (
                        <div key={idx} className="leading-tight">
                          {l}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: JSON AST Inspector */}
                {activeInspectorTab === 'ast' && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-800">
                      Struktur JSON AST Terkompilasi:
                    </div>
                    <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl text-[10px] font-mono h-64 overflow-y-auto shadow-inner leading-relaxed">
{JSON.stringify(
  {
    schema_version: '3.2.0-legal-ast',
    document_id: preset.id,
    type: preset.regulationType,
    number: preset.numberYear,
    provenance_hash: preset.sha256,
    word_integrity: {
      input_words: preset.rawWordCount,
      output_words: preset.rawWordCount,
      loss_rate: '0.00%'
    },
    articles_count: preset.totalArticlesParsed,
    sample_node: {
      pasal: preset.sampleArticle.pasal,
      operation: preset.sampleArticle.action,
      ratio_decidendi: preset.sampleArticle.ratioDecidendi
    },
    curation_status: currentStep === 6 ? 'PUBLISHED' : 'IN_REVIEW'
  },
  null,
  2
)}
                    </pre>
                  </div>
                )}

                {/* TAB 4: SOP Publik */}
                {activeInspectorTab === 'sop' && (
                  <div className="space-y-3 text-xs text-slate-700">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#94191C]" />
                      <span>Standar Operasional Prosedur (SOP)</span>
                    </div>
                    <ol className="list-decimal pl-4 space-y-2 leading-relaxed text-[11px]">
                      <li>
                        <strong>Validitas Dokumen:</strong> Berkas PDF wajib diunduh dari portal pemerintah (JDIHN/Setneg) dan dicocokkan SHA-256.
                      </li>
                      <li>
                        <strong>Parsing Tanpa Halusinasi:</strong> Menggunakan Rule-Based parser, bukan LLM generatif bebas, agar kata undang-undang tidak diubah.
                      </li>
                      <li>
                        <strong>Pencocokan Multi-Layer:</strong> Memadukan pasal induk, amandemen, dan putusan MK yang berlaku secara hierarkis.
                      </li>
                      <li>
                        <strong>Human Approval:</strong> Naskah konsolidasi wajib ditinjau oleh Dewan Editor/Dosen sebelum disetujui untuk tayang publik.
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* Hubungi Dewan Kurator Card */}
            <div className="bg-gradient-to-br from-red-50 to-amber-50 border border-red-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-xs text-[#94191C]">
                <ShieldCheck className="w-4 h-4 text-[#94191C]" />
                <span>Transparansi Naskah Akademik</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                Seluruh tahapan konsolidasi di SIPAKA dapat diaudit kembali oleh dosen, mahasiswa, hakim, maupun peneliti hukum menggunakan nomor SHA-256 dan naskah resmi Lembaran Negara RI.
              </p>
              <div className="pt-1">
                <Link
                  href="/tentang"
                  className="text-xs font-bold text-[#94191C] hover:underline flex items-center gap-1"
                >
                  <span>Baca Metodologi Konsolidasi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="bg-[#2B0B06] text-white/90 text-xs py-8 px-4 sm:px-6 mt-12 border-t border-[#6A2225]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#94191C] text-white flex items-center justify-center font-black text-sm">
              S
            </div>
            <div>
              <div className="font-bold text-white text-sm">SIPAKA — Sistem Informasi Pelacakan Amandemen &amp; Kodifikasi</div>
              <div className="text-white/70 text-[11px]">
                Platform Riset Hukum &amp; Version Control Regulasi Indonesia · Fakultas Hukum
              </div>
            </div>
          </div>
          <div className="text-white/70 text-[11px] text-center md:text-right">
            Naskah Konsolidasi Deterministik Berbasis Lembaran Negara RI · Non-Commercial Academic Research
          </div>
        </div>
      </footer>
    </div>
  );
}

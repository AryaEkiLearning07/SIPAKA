'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, ArrowRight, Scale, BookOpen, Network, CheckCircle2,
  ShieldCheck, FileText, Cpu, ChevronRight, Sparkles, Layers,
  Clock, AlertCircle, LogIn, User, Filter, Check, Eye, Database,
  Award
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type LegalCluster = 'SEMUA' | 'PIDANA' | 'PERDATA' | 'HTN' | 'BISNIS' | 'SIBER' | 'HAM' | 'INTERNASIONAL';

interface LawItem {
  id: string;
  nomor: string;
  judul: string;
  cluster: LegalCluster;
  clusterLabel: string;
  hierarchyType?: string;
  status: 'TERSEDIA' | 'PROSES_INPUT';
  progressPercent: number;
  terinputLabel: string;
  kurangLabel: string;
  slug?: string;
  catatanKurasi: string;
}

interface HierarchyTier {
  id: string;
  code: string;
  label: string;
  basis: string;
  totalPeraturan: number;
  tersedia: number;
  prosesInput: number;
  contoh: string;
  statusKesiapan: string;
  badgeClass: string;
}

const HIERARCHY_TIERS: HierarchyTier[] = [
  {
    id: 'uud45',
    code: 'UUD 1945',
    label: 'Undang-Undang Dasar NRI 1945',
    basis: 'Tingkat I (Staatsfundamentalnorm)',
    totalPeraturan: 1,
    tersedia: 1,
    prosesInput: 0,
    contoh: 'UUD 1945 (Naskah Asli & Perubahan I, II, III, IV)',
    statusKesiapan: '100% Selesai & Terverifikasi',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    id: 'tap-mpr',
    code: 'TAP MPR',
    label: 'Ketetapan MPR',
    basis: 'Tingkat II (Staatsgrundgesetz)',
    totalPeraturan: 139,
    tersedia: 24,
    prosesInput: 115,
    contoh: 'TAP MPR I/MPR/2003 (Peninjauan Materi TAP MPRS/MPR 1960-2002)',
    statusKesiapan: 'Proses Kurasi Naskah Sejarah',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  {
    id: 'uu-perpu',
    code: 'UU / PERPU',
    label: 'Undang-Undang & Perpu',
    basis: 'Tingkat III (Formell Gesetz)',
    totalPeraturan: 1980,
    tersedia: 120,
    prosesInput: 1860,
    contoh: 'UU 11/2008 jo. UU 1/2024 (ITE), UU 1/2023 (KUHP), UU 39/1999 (HAM)',
    statusKesiapan: 'Fokus Utama Konsolidasi Digital',
    badgeClass: 'bg-red-100 text-[#94191C] border-red-300',
  },
  {
    id: 'pp',
    code: 'PP',
    label: 'Peraturan Pemerintah',
    basis: 'Tingkat IV (Verordnung)',
    totalPeraturan: 4520,
    tersedia: 85,
    prosesInput: 4435,
    contoh: 'PP 71/2019 (PSTE - Pelaksana UU ITE), PP Pelaksana KUHP Baru',
    statusKesiapan: 'Digitalisasi Pemetaan Delegasi',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    id: 'perpres',
    code: 'PERPRES',
    label: 'Peraturan Presiden',
    basis: 'Tingkat V (Autonome Satzung)',
    totalPeraturan: 3100,
    tersedia: 42,
    prosesInput: 3058,
    contoh: 'Perpres Tata Kelola Siber & Pelindungan Infrastruktur Informasi Vital',
    statusKesiapan: 'Sinkronisasi Delegasi UU Induk',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    id: 'permen',
    code: 'PERMEN',
    label: 'Peraturan Menteri',
    basis: 'Tingkat VI (Aturan Pelaksana Teknis Sektoral)',
    totalPeraturan: 12400,
    tersedia: 60,
    prosesInput: 12340,
    contoh: 'Permenkominfo 5/2020 jo. Permenkominfo 10/2021 (PSE Lingkup Privat)',
    statusKesiapan: 'Proses Ekstraksi Klausul Teknis',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  {
    id: 'perban',
    code: 'PERBAN',
    label: 'Peraturan Badan / Lembaga',
    basis: 'Tingkat VII (Regulasi Otoritas Independen)',
    totalPeraturan: 2800,
    tersedia: 18,
    prosesInput: 2782,
    contoh: 'Peraturan BSSN, Peraturan OJK, Peraturan Bank Indonesia',
    statusKesiapan: 'Pemetaan Delegasi Khusus Otoritas',
    badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  },
  {
    id: 'perda-prov',
    code: 'PERDA PROV',
    label: 'Peraturan Daerah Provinsi',
    basis: 'Tingkat VIII (Otonomi Daerah Provinsi)',
    totalPeraturan: 8900,
    tersedia: 30,
    prosesInput: 8870,
    contoh: 'Perda RTRW & Pajak/Retribusi Daerah 38 Provinsi',
    statusKesiapan: 'Tahap Agregasi Data JDIH Daerah',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    id: 'perda-kota',
    code: 'PERDA KOTA',
    label: 'Perda Kabupaten / Kota',
    basis: 'Tingkat IX (Otonomi Daerah Kab/Kota)',
    totalPeraturan: 45000,
    tersedia: 45,
    prosesInput: 44955,
    contoh: 'Perda Ketertiban Umum, PBG & Tata Ruang 514 Kab/Kota',
    statusKesiapan: 'Integrasi Bertahap JDIHN Nasional',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
  },
];

const LAW_CATALOG: LawItem[] = [
  {
    id: 'uu-ite',
    nomor: 'UU No. 11/2008 jo. UU 1/2024',
    judul: 'Informasi dan Transaksi Elektronik (UU ITE)',
    cluster: 'SIBER',
    clusterLabel: 'Hukum Siber & Teknologi',
    hierarchyType: 'UU / PERPU',
    status: 'TERSEDIA',
    progressPercent: 100,
    terinputLabel: '54 dari 54 Pasal Konsolidasi Selesai',
    kurangLabel: 'Kekurangan: 0 Pasal (Data Lengkap 100%)',
    slug: '/uu/ite',
    catatanKurasi: 'Naskah konsolidasi mutakhir dengan penanda perubahan UU 19/2016 dan UU 1/2024 siap dibaca.',
  },
  {
    id: 'uud-1945',
    nomor: 'UUD NRI Tahun 1945',
    judul: 'Undang-Undang Dasar Negara Republik Indonesia Tahun 1945',
    cluster: 'HTN',
    clusterLabel: 'Tata Kelola Negara',
    hierarchyType: 'UUD 1945',
    status: 'TERSEDIA',
    progressPercent: 100,
    terinputLabel: '37 Pasal, 3 Aturan Peralihan, 2 Aturan Tambahan Selesai',
    kurangLabel: 'Kekurangan: 0 Pasal (Naskah Resmi Selesai 100%)',
    catatanKurasi: 'Konsolidasi menyeluruh 4 tahapan perubahan UUD 1945 (Tahun 1999, 2000, 2001, dan 2002).',
  },
  {
    id: 'uu-ham',
    nomor: 'UU No. 39 Tahun 1999',
    judul: 'Hak Asasi Manusia (UU HAM)',
    cluster: 'HAM',
    clusterLabel: 'Hukum HAM',
    hierarchyType: 'UU / PERPU',
    status: 'PROSES_INPUT',
    progressPercent: 62,
    terinputLabel: '66 dari 106 Pasal Terinput',
    kurangLabel: 'Kurang: 40 Pasal (Bab IX Komisi HAM & Bab X Partisipasi Masyarakat)',
    catatanKurasi: 'Proses sinkronisasi dengan instrumen ratifikasi konvensi internasional dan kovenan hak sipil-politik.',
  },
  {
    id: 'uu-perjanjian-internasional',
    nomor: 'UU No. 24 Tahun 2000',
    judul: 'Perjanjian Internasional (UU PI)',
    cluster: 'INTERNASIONAL',
    clusterLabel: 'Hukum Internasional',
    hierarchyType: 'UU / PERPU',
    status: 'PROSES_INPUT',
    progressPercent: 55,
    terinputLabel: '12 dari 22 Pasal Terinput',
    kurangLabel: 'Kurang: 10 Pasal (Bab V Pengesahan Perjanjian & Bab VI Penyimpanan Dokumen)',
    catatanKurasi: 'Penyusunan matriks ratifikasi traktat internasional dan harmonisasi dengan Pasal 11 UUD 1945.',
  },
  {
    id: 'kuhp-baru',
    nomor: 'UU No. 1 Tahun 2023',
    judul: 'Kitab Undang-Undang Hukum Pidana (KUHP Nasional)',
    cluster: 'PIDANA',
    clusterLabel: 'Hukum Pidana',
    hierarchyType: 'UU / PERPU',
    status: 'PROSES_INPUT',
    progressPercent: 68,
    terinputLabel: '424 dari 624 Pasal Terinput',
    kurangLabel: 'Kurang: 200 Pasal (Bab XVI - XXXVII Tindak Pidana Khusus)',
    catatanKurasi: 'Sedang dalam proses digitalisasi dan verifikasi pasal demi pasal oleh kurator.',
  },
  {
    id: 'kuhperdata',
    nomor: 'Burgerlijk Wetboek (BW)',
    judul: 'Kitab Undang-Undang Hukum Perdata (KUHPerdata)',
    cluster: 'PERDATA',
    clusterLabel: 'Hukum Perdata',
    hierarchyType: 'UU / PERPU',
    status: 'PROSES_INPUT',
    progressPercent: 45,
    terinputLabel: 'Buku I (Orang) & Buku II (Benda) Terinput',
    kurangLabel: 'Kurang: Buku III (Perikatan) & Buku IV (Pembuktian)',
    catatanKurasi: 'Proses penyesuaian istilah hukum klasik dan anotasi yurisprudensi Mahkamah Agung.',
  },
  {
    id: 'uu-tipikor',
    nomor: 'UU No. 31/1999 jo. UU 20/2001',
    judul: 'Pemberantasan Tindak Pidana Korupsi (UU Tipikor)',
    cluster: 'PIDANA',
    clusterLabel: 'Hukum Pidana',
    hierarchyType: 'UU / PERPU',
    status: 'PROSES_INPUT',
    progressPercent: 41,
    terinputLabel: '18 dari 44 Pasal Terinput',
    kurangLabel: 'Kurang: 26 Pasal (Ketentuan Pidana Tambahan & Pembuktian)',
    catatanKurasi: 'Sedang dilakukan perbandingan delik suap dan kerugian keuangan negara.',
  },
  {
    id: 'uu-mk',
    nomor: 'UU No. 24/2003 stdd UU 7/2020',
    judul: 'Mahkamah Konstitusi (UU MK)',
    cluster: 'HTN',
    clusterLabel: 'Tata Kelola Negara',
    hierarchyType: 'UU / PERPU',
    status: 'PROSES_INPUT',
    progressPercent: 72,
    terinputLabel: '62 dari 87 Pasal Terinput',
    kurangLabel: 'Kurang: 25 Pasal (Hukum Acara Sengketa Lembaga Negara)',
    catatanKurasi: 'Harmonisasi putusan pembatalan masa jabatan dan syarat batas usia hakim konstitusi.',
  },
  {
    id: 'uu-kepailitan',
    nomor: 'UU No. 37 Tahun 2004',
    judul: 'Kepailitan dan Penundaan Kewajiban Pembayaran Utang',
    cluster: 'BISNIS',
    clusterLabel: 'Hukum Bisnis',
    hierarchyType: 'UU / PERPU',
    status: 'PROSES_INPUT',
    progressPercent: 48,
    terinputLabel: '142 dari 305 Pasal Terinput',
    kurangLabel: 'Kurang: 163 Pasal (Bab III Prosedur PKPU & Rapat Kreditor)',
    catatanKurasi: 'Penataan alur pendaftaran kurator dan batas waktu moratorium peradilan niaga.',
  },
  {
    id: 'uu-pdp',
    nomor: 'UU No. 27 Tahun 2022',
    judul: 'Pelindungan Data Pribadi (UU PDP)',
    cluster: 'SIBER',
    clusterLabel: 'Hukum Siber & Teknologi',
    hierarchyType: 'UU / PERPU',
    status: 'PROSES_INPUT',
    progressPercent: 82,
    terinputLabel: '62 dari 76 Pasal Terinput',
    kurangLabel: 'Kurang: 14 Pasal (Bab XIV Ketentuan Sanksi & Lembaga PDP)',
    catatanKurasi: 'Finalisasi matriks kepatuhan pengendali data pribadi spesifik dan umum.',
  },
  {
    id: 'uu-pemilu',
    nomor: 'UU No. 7 Tahun 2017',
    judul: 'Pemilihan Umum (UU Pemilu)',
    cluster: 'HTN',
    clusterLabel: 'Tata Kelola Negara',
    hierarchyType: 'UU / PERPU',
    status: 'PROSES_INPUT',
    progressPercent: 32,
    terinputLabel: '175 dari 548 Pasal Terinput',
    kurangLabel: 'Kurang: 373 Pasal (Regulasi Teknis Sengketa PHPU & Kampanye)',
    catatanKurasi: 'Penyusunan sinkronisasi pasal dengan puluhan Putusan Mahkamah Konstitusi terbaru.',
  },
  {
    id: 'uu-cipta-kerja',
    nomor: 'UU No. 6 Tahun 2023',
    judul: 'Penetapan Perpu Cipta Kerja Menjadi Undang-Undang',
    cluster: 'BISNIS',
    clusterLabel: 'Hukum Bisnis',
    hierarchyType: 'UU / PERPU',
    status: 'PROSES_INPUT',
    progressPercent: 58,
    terinputLabel: '10 dari 16 Kluster Terinput',
    kurangLabel: 'Kurang: 6 Kluster (Ketenagakerjaan & Kemudahan Berusaha)',
    catatanKurasi: 'Uji konsistensi amendemen omnibus terhadap 78 undang-undang sektoral terdampak.',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeCluster, setActiveCluster] = useState<LegalCluster>('SEMUA');
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          if (json.user) {
            setCurrentUser(json.user);
          }
        }
      } catch {
        // Tamu / belum login
      }
    })();
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      router.push(`/katalog?q=${encodeURIComponent(searchKeyword.trim())}`);
    } else {
      router.push('/katalog');
    }
  };

  const filteredLaws = activeCluster === 'SEMUA'
    ? LAW_CATALOG
    : LAW_CATALOG.filter((item) => item.cluster === activeCluster);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      {/* ── Top Notice Bar (Palet Sesuai Lampiran: #861619 & Pill #6A2225) ── */}
      <div className="bg-[#861619] text-white text-xs py-1.5 px-4 sm:px-6 border-b border-[#6A2225] select-none">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-[#6A2225] text-amber-300 px-2 py-0.5 rounded font-mono font-bold text-[10px] tracking-wide uppercase shadow-2xs">
              Terbaru
            </span>
            <span className="text-white/95 text-[11px] truncate font-medium">
              Sistem Informasi Pelacakan Amandemen &amp; Kodifikasi (SIPAKA) · Akses Terbuka Tanpa Login
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3 text-[11px] text-white/80">
            <span>Standar Naskah: Lembaran Negara RI (LNRI)</span>
            <span>·</span>
            <span className="text-amber-300 font-semibold">UUD 1945 s.d. Perda</span>
          </div>
        </div>
      </div>

      {/* ── Header Area dengan Navbar Tunggal Bersih & Utuh ─────────── */}
      <div className="bg-[#94191C] pt-3 pb-4 border-b border-[#861619]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl shadow-md border border-slate-200/90 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
            {/* Brand Logo di dalam Navbar */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-[#94191C] text-white flex items-center justify-center font-black text-base shadow-sm">
                S
              </div>
              <span className="font-sans font-black text-xl text-slate-900 tracking-tight">
                SIPAKA<span className="text-[#94191C]">.</span>
              </span>
            </Link>

            {/* Navigasi Utama */}
            <nav className="hidden md:flex items-center gap-1 sm:gap-4 text-xs sm:text-sm font-semibold">
              <Link
                href="/"
                className="text-[#94191C] px-3 py-1.5 rounded-lg bg-red-50/80 font-bold border-b-2 border-[#94191C]"
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
                className="text-slate-700 hover:text-[#94191C] px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
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

            {/* Tombol Masuk / Login Sisi Kanan */}
            <div className="flex items-center gap-3">
              {currentUser ? (
                <Link
                  href="/masuk"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-800 transition-colors"
                  title={`Masuk sebagai ${currentUser.name}`}
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

      {/* ── Hero Section (Bersih, Elegan, Terfokus pada Pencarian) ───── */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-[#94191C] via-[#861619] to-[#2B0B06] pt-10 pb-12 sm:pt-14 sm:pb-16 text-white border-b border-[#2B0B06]">
          {/* Subtle Ambient Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
            {/* Pill Atas */}
            <div className="inline-flex items-center gap-2 p-1 pl-3 pr-3.5 rounded-full bg-black/30 border border-white/20 text-xs font-medium text-white shadow-md mb-4 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Akses Terbuka Publik Tanpa Login</span>
              <span className="text-white/40">·</span>
              <span className="text-amber-300 font-mono font-semibold">Naskah Konsolidasi Deterministik</span>
            </div>

            {/* Headline Utama */}
            <h1 className="font-sans text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
              Sistem Informasi Pelacakan{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-100 drop-shadow-sm">
                Amandemen &amp; Kodifikasi
              </span>
            </h1>

            <p className="mt-3.5 text-sm sm:text-base leading-relaxed text-white/90 max-w-2xl mx-auto font-sans font-light">
              Membaca naskah konsolidasi undang-undang Indonesia pada versi tahun mana pun secara deterministik.
              Disajikan rapi layaknya dokumen naskah hukum asli dengan penanda warna amandemen yang bersih.
            </p>

            {/* Hero Search Box Putih Bersih dengan Tombol Merah Marun */}
            <form onSubmit={handleHeroSearch} className="mt-6 max-w-2xl mx-auto relative flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Cari undang-undang, nomor, tahun, atau topik delik hukum…"
                className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-white border border-white/40 shadow-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-amber-300/30 focus:border-[#94191C] transition-all font-medium"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-5 bg-[#94191C] hover:bg-[#861619] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <span>Cari</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Shortcut Chips Langsung di Bawah Kotak Pencarian */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto text-xs font-medium">
              <span className="text-white/70 text-[11px] font-semibold uppercase tracking-wider mr-1">
                Pintasan Cepat:
              </span>
              {[
                { label: 'Hukum Pidana', cluster: 'PIDANA' as LegalCluster, query: 'pidana' },
                { label: 'Hukum Perdata', cluster: 'PERDATA' as LegalCluster, query: 'perdata' },
                { label: 'Hukum HAM', cluster: 'HAM' as LegalCluster, query: 'ham' },
                { label: 'Hukum Internasional', cluster: 'INTERNASIONAL' as LegalCluster, query: 'internasional' },
                { label: 'Tata Kelola Negara', cluster: 'HTN' as LegalCluster, query: 'tata negara' },
                { label: 'Hukum Bisnis', cluster: 'BISNIS' as LegalCluster, query: 'bisnis' },
                { label: 'Siber & Teknologi', cluster: 'SIBER' as LegalCluster, query: 'siber' },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => {
                    setActiveCluster(chip.cluster);
                    const el = document.getElementById('seksi-katalog-hukum');
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/25 hover:bg-black/40 border border-white/20 text-white/95 hover:text-amber-300 transition-all text-xs font-semibold backdrop-blur-xs cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── SEKSI BARU: Status Kelengkapan & Hierarki Perundang-Undangan Indonesia ── */}
        <section className="py-10 sm:py-14 bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#94191C] bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                  <Layers className="w-3.5 h-3.5 text-[#94191C]" />
                  <span>Transparansi Silsilah Hierarki (UU No. 12/2011 jo. UU 13/2022)</span>
                </div>
                <h2 className="font-sans text-2xl font-extrabold text-slate-900 tracking-tight mt-2">
                  Daftar Hierarki Peraturan &amp; Status Kelengkapan Data
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                  Kami menyajikan transparansi penuh atas seluruh tingkatan tata urutan peraturan perundang-undangan di Indonesia. Regulasi yang belum 100% lengkap ditampilkan secara terbuka mengenai berapa yang sudah tersedia dan berapa yang sedang dalam antrean proses input data kurator.
                </p>
              </div>

              <Link
                href="/neuron"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm shrink-0"
              >
                <Network className="w-3.5 h-3.5 text-amber-300" />
                <span>Buka Visual Peta Silsilah</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Grid Kartu Tingkatan Hierarki */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {HIERARCHY_TIERS.map((tier) => {
                const percent = Math.min(100, Math.round((tier.tersedia / tier.totalPeraturan) * 100));
                const isComplete = tier.prosesInput === 0;

                return (
                  <div
                    key={tier.id}
                    className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-red-300 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Badge Kode Tingkat & Basis Teori */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[11px] font-mono font-extrabold px-2.5 py-0.5 rounded-lg border ${tier.badgeClass}`}>
                          {tier.code}
                        </span>
                        <span className="text-[10px] font-mono font-medium text-slate-500 truncate max-w-[170px]" title={tier.basis}>
                          {tier.basis}
                        </span>
                      </div>

                      {/* Nama Tingkatan */}
                      <h3 className="font-sans font-bold text-sm text-slate-900 leading-snug">
                        {tier.label}
                      </h3>

                      {/* Status Kesiapan */}
                      <div className="mt-2.5 flex items-center gap-1.5">
                        {isComplete ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {tier.statusKesiapan}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {tier.statusKesiapan}
                          </span>
                        )}
                      </div>

                      {/* Angka Transparansi: Tersedia vs Kekurangan */}
                      <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="font-medium">Tersedia di Platform:</span>
                          <span className="font-mono font-bold text-emerald-700">
                            {tier.tersedia.toLocaleString('id-ID')} instrumen
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Dalam Proses Input:</span>
                          <span className={`font-mono font-bold ${isComplete ? 'text-slate-400' : 'text-[#94191C]'}`}>
                            {tier.prosesInput > 0 ? `${tier.prosesInput.toLocaleString('id-ID')} instrumen` : 'Nol (Lengkap)'}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isComplete ? 'bg-emerald-500' : 'bg-[#94191C]'
                            }`}
                            style={{ width: `${Math.max(4, percent)}%` }}
                          />
                        </div>
                      </div>

                      {/* Contoh Instrumen Regulasi */}
                      <p className="mt-3 text-[11px] text-slate-500 leading-normal">
                        <span className="font-semibold text-slate-700">Contoh:</span> {tier.contoh}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        href={`/katalog?q=${encodeURIComponent(tier.code)}`}
                        className="text-xs font-bold text-[#94191C] hover:text-[#861619] inline-flex items-center gap-1"
                      >
                        <span>Cari di Katalog</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                      <span className="text-[10px] font-mono text-slate-400">
                        Total est. {tier.totalPeraturan.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Bagian Kluster Hukum & Status Transparansi Input Data ── */}
        <section id="seksi-katalog-hukum" className="py-10 sm:py-14 bg-slate-50 border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#94191C] bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                  <Database className="w-3.5 h-3.5 text-[#94191C]" />
                  <span>Katalog Regulasi &amp; Status Digitalisasi</span>
                </div>
                <h2 className="font-sans text-2xl font-extrabold text-slate-900 tracking-tight mt-2">
                  Daftar Undang-Undang Berdasarkan Bidang Hukum
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Pilih kluster hukum di bawah untuk memfilter. Undang-undang yang belum 100% lengkap menampilkan rincian progres dan jumlah kekurangan yang sedang dalam proses input data.
                </p>
              </div>

              {/* Filter Pills dengan Tema Merah Marun Termasuk HAM & Internasional */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl border border-slate-300/60 text-xs font-medium">
                {(
                  [
                    { id: 'SEMUA', label: 'Semua Bidang' },
                    { id: 'PIDANA', label: 'Hukum Pidana' },
                    { id: 'PERDATA', label: 'Hukum Perdata' },
                    { id: 'HAM', label: 'Hukum HAM' },
                    { id: 'INTERNASIONAL', label: 'Internasional' },
                    { id: 'HTN', label: 'Tata Kelola Negara' },
                    { id: 'BISNIS', label: 'Hukum Bisnis' },
                    { id: 'SIBER', label: 'Siber & Teknologi' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCluster(tab.id)}
                    className={`px-3 py-1.5 rounded-lg transition-all text-xs font-semibold cursor-pointer ${
                      activeCluster === tab.id
                        ? 'bg-[#94191C] text-white shadow-sm font-bold'
                        : 'text-slate-700 hover:text-[#94191C] hover:bg-white/80'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Kartu Undang-Undang dengan Transparansi Input Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredLaws.map((law) => {
                const isReady = law.status === 'TERSEDIA';

                return (
                  <div
                    key={law.id}
                    className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                      isReady
                        ? 'bg-gradient-to-b from-white to-red-50/20 border-red-300 shadow-md hover:shadow-lg'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    <div className="p-5">
                      {/* Header Kartu: Kategori & Status Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {law.clusterLabel}
                        </span>

                        {isReady ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Tersedia 100%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Dalam Proses Input Data
                          </span>
                        )}
                      </div>

                      {/* Judul & Nomor UU */}
                      <div className="text-xs font-mono font-semibold text-slate-500 mb-1">
                        {law.nomor}
                      </div>
                      <h3 className="font-sans font-bold text-base text-slate-900 leading-snug">
                        {law.judul}
                      </h3>

                      {/* Bar Progres Digitalisasi */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-600 font-medium">Progres Digitalisasi:</span>
                          <span className={`font-mono font-bold ${isReady ? 'text-emerald-700' : 'text-[#94191C]'}`}>
                            {law.progressPercent}%
                          </span>
                        </div>

                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isReady ? 'bg-emerald-500' : 'bg-[#94191C]'
                            }`}
                            style={{ width: `${law.progressPercent}%` }}
                          />
                        </div>

                        {/* Rincian Status: Terinput & Kekurangan */}
                        <div className="mt-3 space-y-1 text-xs">
                          <div className="flex items-start gap-1.5 text-slate-700">
                            <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isReady ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className="leading-tight">{law.terinputLabel}</span>
                          </div>

                          <div className="flex items-start gap-1.5">
                            {isReady ? (
                              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{law.kurangLabel}</span>
                              </div>
                            ) : (
                              <div className="flex items-start gap-1.5 text-amber-900 font-medium bg-amber-50/80 p-1.5 rounded-lg border border-amber-200/80 w-full">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                                <span className="leading-tight text-[11px]">{law.kurangLabel}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Catatan Kurasi */}
                        <p className="mt-2 text-[11px] text-slate-500 leading-normal line-clamp-2">
                          {law.catatanKurasi}
                        </p>
                      </div>
                    </div>

                    {/* Tombol Tindakan */}
                    <div className="p-4 bg-slate-50 border-t border-slate-200">
                      {isReady && law.slug ? (
                        <Link
                          href={law.slug}
                          className="w-full inline-flex items-center justify-center gap-2 bg-[#94191C] hover:bg-[#861619] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Baca Mode Asli (Terkonsolidasi)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-slate-500 py-1">
                          <span className="flex items-center gap-1.5 text-[11px] text-amber-900 font-medium">
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            Antrean Kurator: Batch #{law.id.slice(0, 4)}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">Segera Hadir</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Mockup Pratinjau Mode Baca Word-Style ─────────────────── */}
        <section className="py-12 sm:py-16 bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#94191C] bg-red-50 px-3 py-1 rounded-full border border-red-200">
                Pengalaman Membaca Naskah Asli
              </span>
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
                Dirancang Senyaman Membaca Dokumen Microsoft Word
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600">
                Bagian tengah adalah lembaran kertas naskah hukum resmi, dilengkapi daftar isi bab/pasal interaktif di kiri, dan keterangan amandemen serta aturan terdampak di kanan.
              </p>
            </div>

            {/* Interactive Preview Mockup Box */}
            <div className="bg-white rounded-3xl border border-slate-300 shadow-xl overflow-hidden">
              <div className="h-10 bg-[#861619] text-white px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-300/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-300/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-300/80" />
                  <span className="ml-2 font-mono text-[11px] text-white/90">SIPAKA Workspace Reader · Salinan Lembaran Negara</span>
                </div>
                <div className="text-xs font-semibold text-amber-200 font-mono">
                  UU No. 11/2008 jo. UU 1/2024
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[400px]">
                {/* Mockup Kiri: Daftar Isi */}
                <div className="md:col-span-3 border-r border-slate-200 bg-slate-50/70 p-4 space-y-3">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    Daftar Isi Norma
                  </div>
                  <div className="space-y-1 text-xs font-sans">
                    <div className="p-2 rounded-lg bg-red-50 text-[#94191C] font-semibold border-l-2 border-[#94191C]">
                      BAB I Ketentuan Umum
                    </div>
                    <div className="pl-4 py-1 text-slate-600">Pasal 1 (Definisi)</div>
                    <div className="pl-4 py-1 text-slate-600">Pasal 2 (Yurisdiksi)</div>
                    <div className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium">
                      BAB VII Perbuatan yang Dilarang
                    </div>
                    <div className="pl-4 py-1 text-[#94191C] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Pasal 27 (Kesusilaan)
                    </div>
                    <div className="pl-4 py-1 text-[#94191C] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Pasal 27A (Penghinaan)
                    </div>
                  </div>
                </div>

                {/* Mockup Tengah: Full Paper Word */}
                <div className="md:col-span-6 bg-slate-200/60 p-6 flex justify-center items-center">
                  <div className="bg-white w-full rounded-sm shadow-md border border-slate-300 p-6 space-y-4 font-serif text-xs leading-relaxed">
                    <div className="text-center pb-3 border-b border-slate-800">
                      <p className="font-sans font-bold uppercase text-[10px] tracking-widest text-slate-700">Presiden Republik Indonesia</p>
                      <p className="font-sans font-extrabold text-xs text-slate-900 mt-1">Undang-Undang Nomor 11 Tahun 2008</p>
                    </div>

                    {/* Pasal Normal */}
                    <div className="space-y-1">
                      <p className="font-sans font-bold text-slate-900">Pasal 1</p>
                      <p className="text-slate-700 text-justify">Dalam Undang-Undang ini yang dimaksud dengan Informasi Elektronik adalah satu atau sekumpulan data elektronik…</p>
                    </div>

                    {/* Pasal dengan Tanda Warna Halus */}
                    <div className="border-l-4 border-emerald-500 pl-3 bg-emerald-50/30 py-1 rounded-r space-y-1">
                      <div className="flex items-center justify-between font-sans">
                        <span className="font-bold text-slate-900">Pasal 27A</span>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">🟢 Sisipan Baru (UU 1/2024)</span>
                      </div>
                      <p className="text-slate-800 text-justify">Setiap Orang yang dengan sengaja menyerang kehormatan atau nama baik orang lain dengan menuduhkan suatu hal…</p>
                    </div>
                  </div>
                </div>

                {/* Mockup Kanan: Panel Asisten Ringkasan */}
                <div className="md:col-span-3 border-l border-slate-200 bg-white p-4 space-y-4 text-xs font-sans">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                      Asisten &amp; Ringkasan
                    </span>
                    <h4 className="font-bold text-slate-900 mt-1">Pasal 27A (Aktif)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Disisipkan oleh UU No. 1 Tahun 2024</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-[11px]">
                    <span className="font-bold text-slate-700 block">Legenda Penanda Warna:</span>
                    <p className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 shrink-0" />
                      Hijau: Sisipan Baru (2024)
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 shrink-0" />
                      Kuning: Redaksi Diubah
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 shrink-0" />
                      Merah: Dicabut / Dihapus
                    </p>
                  </div>

                  <Link
                    href="/uu/ite"
                    className="w-full py-2 bg-[#94191C] hover:bg-[#861619] text-white rounded-lg font-semibold text-center block text-xs transition-colors shadow-2xs"
                  >
                    Buka Mode Baca Penuh ➔
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3 Langkah Alur Penggunaan Platform ───────────────────── */}
        <section className="py-12 sm:py-16 bg-slate-50 border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Alur Kerja Cepat &amp; Efisien
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600">
                Dari pencarian undang-undang hingga analisis silsilah hukum, semuanya terintegrasi tanpa hambatan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Langkah 1 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative">
                <div className="w-9 h-9 rounded-xl bg-[#94191C] text-white font-mono font-bold flex items-center justify-center text-xs mb-3 shadow-sm">
                  01
                </div>
                <h3 className="font-sans font-bold text-base text-slate-900 mb-1.5">
                  Cari di Katalog JDIH
                </h3>
                <p className="text-xs leading-relaxed text-slate-600">
                  Cari peraturan berdasarkan kata kunci nomor UU, tahun, atau topik delik hukum melalui pencarian terpadu.
                </p>
              </div>

              {/* Langkah 2 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative">
                <div className="w-9 h-9 rounded-xl bg-[#94191C] text-white font-mono font-bold flex items-center justify-center text-xs mb-3 shadow-sm">
                  02
                </div>
                <h3 className="font-sans font-bold text-base text-slate-900 mb-1.5">
                  Buka Mode Baca Asli
                </h3>
                <p className="text-xs leading-relaxed text-slate-600">
                  Naskah tampil rapi layaknya dokumen Word resmi. Perubahan amandemen cukup ditandai garis warna halus agar nyaman dibaca.
                </p>
              </div>

              {/* Langkah 3 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative">
                <div className="w-9 h-9 rounded-xl bg-[#94191C] text-white font-mono font-bold flex items-center justify-center text-xs mb-3 shadow-sm">
                  03
                </div>
                <h3 className="font-sans font-bold text-base text-slate-900 mb-1.5">
                  Silsilah &amp; Aturan Terdampak
                </h3>
                <p className="text-xs leading-relaxed text-slate-600">
                  Klik pasal amandemen untuk melihat riwayat putusan MK, dasar hukum perubahan, serta seluruh PP dan Permen yang terdampak.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3 Pilar Keunggulan Akademik ──────────────────────────── */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mb-3" />
                <h4 className="font-sans font-bold text-sm text-slate-900 mb-1">
                  100% Deterministik
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Semua naskah direkonstruksi murni dari data Lembaran Negara resmi. Nol karangan mesin, nol asumsi spekulatif.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
                <ShieldCheck className="w-6 h-6 text-[#94191C] mb-3" />
                <h4 className="font-sans font-bold text-sm text-slate-900 mb-1">
                  Integritas Kriptografi SHA-256
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dokumen sumber primer di-hash secara kriptografis dan diverifikasi menggunakan *golden test suite* berparitas karakter.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
                <Network className="w-6 h-6 text-[#94191C] mb-3" />
                <h4 className="font-sans font-bold text-sm text-slate-900 mb-1">
                  Hierarki Teori Stufenbau
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Memetakan relasi hierarki antara Putusan Mahkamah Konstitusi, Undang-Undang Pokok, PP, dan Peraturan Menteri.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer Bernuansa Mahogani Gelap (#2B0B06 & #1E0507) ─── */}
      <footer className="border-t border-[#3A0F08] bg-[#1E0507] text-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/70">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#94191C] flex items-center justify-center text-white font-bold text-[10px]">
              S
            </div>
            <span>SIPAKA · Sistem Informasi Pelacakan Amandemen, Kodifikasi, dan Advokasi</span>
          </div>
          <div className="flex items-center gap-4 text-white/80">
            <Link href="/katalog" className="hover:text-amber-300 transition-colors">Katalog JDIH</Link>
            <Link href="/neuron" className="hover:text-amber-300 transition-colors">Peta Silsilah</Link>
            <Link href="/tentang" className="hover:text-amber-300 transition-colors">Metodologi</Link>
            <Link href="/masuk" className="hover:text-amber-300 transition-colors">Masuk Akun</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

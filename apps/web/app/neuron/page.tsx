'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, BookOpen, Layers, CheckCircle2, AlertTriangle,
  Scale, FileText, ChevronRight, ExternalLink, GitBranch,
  ShieldAlert, Sparkles, Table2, GitGraph, Cpu
} from 'lucide-react';

interface LegalNode {
  id: string;
  label: string;
  type: 'UU_INDUK' | 'AMANDEMEN' | 'PP' | 'PERMEN' | 'PUTUSAN_MK';
  level: string;
  title: string;
  year: number;
  status: 'STABIL' | 'TERDAMPAK' | 'BATAL_BERSYARAT';
  statusLabel: string;
  delegasiBasis?: string;
  pasalTerdampak?: string[];
  description: string;
  harmonisasiRekomendasi?: string;
  linkSlug?: string;
}

interface HarmonisasiRow {
  pasalUu: string;
  statusUuTerbaru: string;
  aturanTurunan: string;
  pasalTurunan: string;
  potensiKonflik: string;
  rekomendasi: string;
}

const NODES_DATA: LegalNode[] = [
  {
    id: 'mk-50-2008',
    label: 'Putusan MK No. 50/PUU-VI/2008',
    type: 'PUTUSAN_MK',
    level: 'Tingkat I: Pengujian Konstitusionalitas (Mahkamah Konstitusi)',
    year: 2008,
    status: 'STABIL',
    statusLabel: 'Ditolak — Norma Tetap Berlaku; Tafsir Delik Aduan Ditegaskan',
    title: 'Pengujian Materiil Konstitusionalitas Pasal 27 ayat (3) UU ITE terhadap UUD 1945',
    description: 'Mahkamah Konstitusi MENOLAK permohonan pengujian untuk seluruhnya sehingga Pasal 27 ayat (3) tetap berlaku. Dalam pertimbangannya, MK menegaskan delik penghinaan dan pencemaran nama baik dalam ketentuan tersebut bersifat delik materiel aduan absolut (klachtdelict) yang merujuk pada Pasal 310 dan Pasal 311 KUHP — tafsir yang kemudian dikodifikasi dalam Penjelasan UU No. 19 Tahun 2016.',
    delegasiBasis: 'Pasal 24C ayat (1) UUD 1945',
    pasalTerdampak: ['Pasal 27 ayat (3)', 'Pasal 45 ayat (1)'],
    harmonisasiRekomendasi: 'Setiap proses penyidikan kepolisian dan dakwaan jaksa penuntut umum wajib mensyaratkan adanya pengaduan langsung dari korban (bukan laporan pihak ketiga).',
  },
  {
    id: 'uu-11-2008',
    label: 'UU No. 11 Tahun 2008',
    type: 'UU_INDUK',
    level: 'Tingkat II: Undang-Undang Pokok (Induk Kodifikasi)',
    year: 2008,
    status: 'STABIL',
    statusLabel: 'Naskah Pokok (Telah Diubah 2x)',
    title: 'Undang-Undang tentang Informasi dan Transaksi Elektronik',
    description: 'Pondasi hukum siber pertama di Indonesia yang mengatur alat bukti elektronik, tanda tangan digital, penyelenggaraan transaksi daring, serta delik perbuatan yang dilarang di ruang digital.',
    delegasiBasis: 'Pasal 5 ayat (1) dan Pasal 20 UUD 1945',
    linkSlug: 'ite',
    harmonisasiRekomendasi: 'Seluruh regulasi turunan (PP dan Peraturan Menteri) berpijak pada pasal delegasi atribusi undang-undang ini.',
  },
  {
    id: 'uu-19-2016',
    label: 'UU No. 19 Tahun 2016',
    type: 'AMANDEMEN',
    level: 'Tingkat II: Amandemen Pertama',
    year: 2016,
    status: 'STABIL',
    statusLabel: 'Amandemen Historis',
    title: 'Perubahan Atas Undang-Undang Nomor 11 Tahun 2008 tentang ITE',
    description: 'Menindaklanjuti Putusan MK No. 50/PUU-VI/2008 dengan menurunkan ancaman pidana Pasal 27 ayat (3) dari 6 tahun menjadi 4 tahun (sehingga tersangka tidak dapat ditahan saat penyidikan) serta mempertegas sifat delik aduan.',
    delegasiBasis: 'Amandemen Pasal 27 ayat (3), Pasal 31, Pasal 40, Pasal 45 UU ITE',
    linkSlug: 'ite',
    harmonisasiRekomendasi: 'Telah terintegrasi ke dalam naskah konsolidasi per 2016.',
  },
  {
    id: 'uu-1-2024',
    label: 'UU No. 1 Tahun 2024',
    type: 'AMANDEMEN',
    level: 'Tingkat II: Amandemen Kedua (Hukum Positif Berlaku)',
    year: 2024,
    status: 'STABIL',
    statusLabel: 'Revisi Terkini (Berlaku)',
    title: 'Perubahan Kedua Atas Undang-Undang Nomor 11 Tahun 2008 tentang ITE',
    description: 'Restrukturisasi radikal atas kluster delik konten ilegal: memecah Pasal 27, menyisipkan Pasal 27A (penyerangan kehormatan) dan Pasal 27B (pemerasan/pengancaman), memperketat pembuktian kerusuhan (Pasal 28 ayat 3), serta mewajibkan proteksi anak dalam penyelenggaraan sistem elektronik.',
    delegasiBasis: 'Pembaruan UU 11/2008 & penyesuaian asas KUHP Nasional (UU 1/2023)',
    linkSlug: 'ite',
    harmonisasiRekomendasi: 'Memerlukan pembaharuan aturan pelaksana pada tingkat Peraturan Pemerintah agar selaras dengan delik baru.',
  },
  {
    id: 'pp-71-2019',
    label: 'PP No. 71 Tahun 2019',
    type: 'PP',
    level: 'Tingkat III: Peraturan Pemerintah (Aturan Pelaksana)',
    year: 2019,
    status: 'TERDAMPAK',
    statusLabel: 'Terdampak Revisi UU 1/2024',
    title: 'Penyelenggaraan Sistem dan Transaksi Elektronik (PSTE)',
    description: 'Mengatur klasifikasi Penyelenggara Sistem Elektronik (PSE Lingkup Publik dan Privat), tata kelola data pribadi, penempatan pusat data (data center), dan kewajiban penapisan/moderasi konten yang dilarang.',
    delegasiBasis: 'Atribusi dari Pasal 17 ayat (3), Pasal 22, dan Pasal 40 UU ITE 2008',
    pasalTerdampak: ['Pasal 5 (Konten yang Dilarang)', 'Pasal 21 (Pendaftaran PSE)', 'Pasal 96 (Sanksi Administratif)'],
    harmonisasiRekomendasi: 'Definisi "konten yang dilarang" dalam Pasal 5 PP 71/2019 masih merujuk rumusan lama Pasal 27 UU ITE 2008. Pemerintah wajib merevisi PP ini agar sinkron dengan batasan delik Pasal 27A dan Pasal 27B pada UU 1/2024.',
  },
  {
    id: 'permen-5-2020',
    label: 'Permenkominfo No. 5 Tahun 2020',
    type: 'PERMEN',
    level: 'Tingkat IV: Peraturan Menteri (Aturan Teknis Lapangan)',
    year: 2020,
    status: 'TERDAMPAK',
    statusLabel: 'Terdampak Harmonisasi Teknis',
    title: 'Penyelenggara Sistem Elektronik Lingkup Privat',
    description: 'Petunjuk teknis pendaftaran PSE privat domestik/asing, kewajiban permohonan pemutusan akses (takedown) konten dalam kurun waktu 1x24 jam (atau 4 jam untuk konten mendesak), serta pemberian akses data ke penegak hukum.',
    delegasiBasis: 'Delegasi teknis dari Pasal 6 dan Pasal 9 PP 71/2019',
    pasalTerdampak: ['Pasal 9 ayat (3)', 'Pasal 13 (Kriteria Konten Meresahkan)'],
    harmonisasiRekomendasi: 'Frasa "meresahkan masyarakat dan mengganggu ketertiban umum" rentan multitafsir pasca UU 1/2024 mensyaratkan timbulnya kerusuhan fisik nyata (bukan sekadar keresahan abstrak). Perlu penyesuaian SOP takedown konten.',
  },
];

const MATRIKS_HARMONISASI: HarmonisasiRow[] = [
  {
    pasalUu: 'Pasal 27 ayat (3) UU 11/2008 → Dipecah ke Pasal 27A & 27B UU 1/2024',
    statusUuTerbaru: 'Pencemaran nama baik dipisah dari pemerasan/pengancaman. Unsur "menyerang kehormatan demi kepentingan umum" dikecualikan.',
    aturanTurunan: 'PP No. 71/2019',
    pasalTurunan: 'Pasal 5 ayat (1) & (2)',
    potensiKonflik: 'PP 71/2019 masih memakai istilah umum "informasi yang melanggar kesusilaan/penghinaan" tanpa klausul pengecualian pembelaan diri.',
    rekomendasi: 'Harmonisasi definisi konten terlarang di PP 71/2019 agar tidak terjadi pemblokiran sepihak atas kritik publik yang sah.',
  },
  {
    pasalUu: 'Pasal 28 ayat (3) UU 1/2024 (Pemberitahuan Bohong yang Memicu Kerusuhan)',
    statusUuTerbaru: 'Wajib ada akibat nyata: "kerusuhan fisik di masyarakat" (delik materiil).',
    aturanTurunan: 'Permenkominfo No. 5/2020',
    pasalTurunan: 'Pasal 9 ayat (4) huruf a',
    potensiKonflik: 'Permenkominfo masih menggunakan frasa "meresahkan masyarakat" sebagai dasar takedown cepat 4 jam.',
    rekomendasi: 'Menyesuaikan pedoman takedown Kementerian Komdigi agar selaras dengan standar pembuktian kerusuhan pada UU 1/2024.',
  },
  {
    pasalUu: 'Pasal 16A UU 1/2024 (Kewajiban Pelindungan Anak di Ruang Siber)',
    statusUuTerbaru: 'Norma baru mewajibkan PSE menyediakan fitur ramah anak dan verifikasi batas usia.',
    aturanTurunan: 'PP No. 71/2019',
    pasalTurunan: 'Belum diatur secara spesifik',
    potensiKonflik: 'Ketiadaan petunjuk teknis verifikasi usia dan sanksi operasional PSE ramah anak.',
    rekomendasi: 'Pemerintah perlu menerbitkan PP Perubahan atas PP 71/2019 atau Permen tersendiri terkait tata kelola pelindungan anak di ruang digital.',
  },
];

export default function LegalNeuronPage() {
  const [selectedNode, setSelectedNode] = useState<LegalNode>(NODES_DATA[4]); // default PP 71/2019
  const [activeTab, setActiveTab] = useState<'TREE' | 'MATRIX'>('TREE');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 font-sans text-slate-800">
      {/* Top Header Glassmorphic */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Link
              href="/uu/ite"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
              title="Kembali ke Reader Naskah"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-base text-slate-900 tracking-tight">
                  Peta Silsilah Regulasi &amp; Dampak Yuridis
                </span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-[#94191C] border border-indigo-200/60">
                  Keluarga UU ITE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemetaan hierarki norma berbasis Teori <em>Stufenbau</em> (Hans Kelsen) &amp; UU No. 12/2011
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('TREE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'TREE'
                    ? 'bg-white text-[#94191C] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GitGraph className="w-3.5 h-3.5" />
                Pohon Silsilah
              </button>
              <button
                onClick={() => setActiveTab('MATRIX')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'MATRIX'
                    ? 'bg-white text-[#94191C] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
                Matriks Dampak Harmonisasi
              </button>
            </div>

            <Link
              href="/pipeline"
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Cpu className="w-3.5 h-3.5 text-[#94191C]" />
              <span>Simulasi Pipeline</span>
            </Link>

            <Link
              href="/uu/ite"
              className="px-3.5 py-1.5 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Buka Naskah Reader
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        {activeTab === 'TREE' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Kolom Kiri: Pohon Hierarki Terstruktur (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Info Bar */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                <Scale className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-slate-700">
                  <span className="font-bold text-slate-900">Prinsip Hirarki Peraturan Perundang-undangan:</span> Aturan pada tingkat lebih rendah (PP dan Permen) tidak boleh bertentangan dengan norma induknya (UU). Klik kartu regulasi di bawah untuk menginspeksi dampak perubahan terhadap pasal terkait.
                </div>
              </div>

              {/* Tingkat I: Putusan Mahkamah Konstitusi */}
              <div className="relative">
                <div className="text-2xs font-mono font-bold uppercase tracking-wider text-rose-700 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Tingkat I · Uji Materiil Mahkamah Konstitusi
                </div>
                <div
                  onClick={() => setSelectedNode(NODES_DATA[0])}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedNode.id === NODES_DATA[0].id
                      ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                        {NODES_DATA[0].statusLabel}
                      </span>
                      <h3 className="font-sans font-bold text-sm text-slate-900 mt-1.5">
                        {NODES_DATA[0].label}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {NODES_DATA[0].title}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                  </div>
                </div>

                {/* Connector Line ke UU */}
                <div className="w-0.5 h-6 bg-slate-300 mx-auto my-2" />
              </div>

              {/* Tingkat II: Rantai Undang-Undang Pokok & Amandemen */}
              <div className="relative bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                <div className="text-2xs font-mono font-bold uppercase tracking-wider text-[#94191C] mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  Tingkat II · Garis Silsilah Amandemen Undang-Undang
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* UU 11/2008 Pokok */}
                  <div
                    onClick={() => setSelectedNode(NODES_DATA[1])}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedNode.id === NODES_DATA[1].id
                        ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        Naskah Pokok
                      </span>
                      <h4 className="font-sans font-bold text-xs text-slate-900 mt-2">
                        UU 11/2008
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        UU Pokok ITE
                      </p>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-semibold mt-3 block">
                      Tahun 2008
                    </span>
                  </div>

                  {/* UU 19/2016 Amandemen I */}
                  <div
                    onClick={() => setSelectedNode(NODES_DATA[2])}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedNode.id === NODES_DATA[2].id
                        ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-[#94191C]">
                        Amandemen I
                      </span>
                      <h4 className="font-sans font-bold text-xs text-slate-900 mt-2">
                        UU 19/2016
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Penurunan Pidana Delik
                      </p>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-semibold mt-3 block">
                      Tahun 2016
                    </span>
                  </div>

                  {/* UU 1/2024 Amandemen II */}
                  <div
                    onClick={() => setSelectedNode(NODES_DATA[3])}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedNode.id === NODES_DATA[3].id
                        ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                        Amandemen II (Positif)
                      </span>
                      <h4 className="font-sans font-bold text-xs text-slate-900 mt-2">
                        UU 1/2024
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Restrukturisasi Delik
                      </p>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold mt-3 block">
                      Tahun 2024
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Alur Silsilah: 2008 ➔ 2016 ➔ 2024</span>
                  <Link href="/uu/ite" className="text-indigo-600 font-semibold hover:underline">
                    Lihat Naskah Konsolidasi →
                  </Link>
                </div>
              </div>

              {/* Connector Line ke PP */}
              <div className="w-0.5 h-6 bg-slate-300 mx-auto my-2" />

              {/* Tingkat III: Peraturan Pemerintah (PP) */}
              <div className="relative">
                <div className="text-2xs font-mono font-bold uppercase tracking-wider text-emerald-700 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Tingkat III · Peraturan Pelaksana (Peraturan Pemerintah)
                </div>
                <div
                  onClick={() => setSelectedNode(NODES_DATA[4])}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedNode.id === NODES_DATA[4].id
                      ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          ⚠️ Terdampak Revisi UU 1/2024
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Tahun 2019</span>
                      </div>
                      <h3 className="font-sans font-bold text-sm text-slate-900 mt-1.5">
                        {NODES_DATA[4].label} (PSTE)
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {NODES_DATA[4].title}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                  </div>
                </div>

                {/* Connector Line ke Permen */}
                <div className="w-0.5 h-6 bg-slate-300 mx-auto my-2" />
              </div>

              {/* Tingkat IV: Peraturan Menteri (Permen) */}
              <div className="relative">
                <div className="text-2xs font-mono font-bold uppercase tracking-wider text-amber-700 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  Tingkat IV · Peraturan Pelaksana Teknis (Peraturan Menteri)
                </div>
                <div
                  onClick={() => setSelectedNode(NODES_DATA[5])}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedNode.id === NODES_DATA[5].id
                      ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          ⚠️ Terdampak Harmonisasi
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Tahun 2020</span>
                      </div>
                      <h3 className="font-sans font-bold text-sm text-slate-900 mt-1.5">
                        {NODES_DATA[5].label}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {NODES_DATA[5].title}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Panel Detail & Dampak Yuridis (5 cols) */}
            <div className="lg:col-span-5 lg:sticky lg:top-20">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-h-[calc(100vh-6rem)] overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-500 font-mono">
                      Analisis Yuridis Dokumen
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#94191C] bg-indigo-50 px-2 py-0.5 rounded">
                    {selectedNode.type}
                  </span>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="font-sans font-bold text-lg text-slate-900">
                      {selectedNode.label}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedNode.title}
                    </p>
                  </div>

                  {/* Status Banner */}
                  <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                    selectedNode.status === 'TERDAMPAK'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : selectedNode.status === 'BATAL_BERSYARAT'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5 mb-1">
                      {selectedNode.status === 'TERDAMPAK' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                      {selectedNode.status === 'BATAL_BERSYARAT' && <ShieldAlert className="w-4 h-4 text-rose-600" />}
                      {selectedNode.status === 'STABIL' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      Status: {selectedNode.statusLabel}
                    </div>
                    {selectedNode.delegasiBasis && (
                      <div className="text-[11px] opacity-90 mt-1 font-mono">
                        Dasar Legalitas: {selectedNode.delegasiBasis}
                      </div>
                    )}
                  </div>

                  {/* Deskripsi */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block mb-1.5">
                      Ruang Lingkup &amp; Ratio Legis:
                    </span>
                    <p className="text-xs leading-relaxed text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {selectedNode.description}
                    </p>
                  </div>

                  {/* Rekomendasi Harmonisasi */}
                  {selectedNode.harmonisasiRekomendasi && (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 font-mono block mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Catatan Kesenjangan / Harmonisasi:
                      </span>
                      <p className="text-xs leading-relaxed text-slate-700 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/70">
                        {selectedNode.harmonisasiRekomendasi}
                      </p>
                    </div>
                  )}

                  {/* Action Link */}
                  <div className="pt-2">
                    <Link
                      href={selectedNode.linkSlug ? `/uu/${selectedNode.linkSlug}` : '/uu/ite'}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-[#94191C] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                    >
                      <BookOpen className="w-4 h-4" />
                      Buka Naskah Konsolidasi Terkait
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Tab 2: Matriks Harmonisasi Antar-Tingkat Regulasi */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-sans font-bold text-lg text-slate-900">
                Matriks Analisis Dampak Regulasi (Regulatory Impact Assessment)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tabel deteksi otomatis ketidaksinkronan norma antara UU ITE Pasca-Amandemen 2024 terhadap Peraturan Pemerintah &amp; Peraturan Menteri turunan.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Kluster Norma UU Terkini</th>
                    <th className="py-3.5 px-4">Status &amp; Asas Baru</th>
                    <th className="py-3.5 px-4">Regulasi Turunan Terdampak</th>
                    <th className="py-3.5 px-4">Titik Potensi Konflik</th>
                    <th className="py-3.5 px-4">Rekomendasi Harmonisasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MATRIKS_HARMONISASI.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-4 font-semibold text-slate-900 align-top">
                        {row.pasalUu}
                      </td>
                      <td className="py-4 px-4 text-slate-700 align-top leading-relaxed">
                        {row.statusUuTerbaru}
                      </td>
                      <td className="py-4 px-4 align-top">
                        <span className="font-bold text-slate-800 block">{row.aturanTurunan}</span>
                        <span className="text-slate-500 text-[11px] font-mono">{row.pasalTurunan}</span>
                      </td>
                      <td className="py-4 px-4 text-rose-700 font-medium align-top leading-relaxed bg-rose-50/30">
                        {row.potensiKonflik}
                      </td>
                      <td className="py-4 px-4 text-[#94191C] font-medium align-top leading-relaxed bg-indigo-50/30">
                        {row.rekomendasi}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
              <span>Metodologi: <em>Regulatory Ripple Effect Engine</em> SIPAKA</span>
              <Link href="/uu/ite" className="text-[#94191C] font-semibold hover:underline">
                Pelajari pasal di Naskah Konsolidasi →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

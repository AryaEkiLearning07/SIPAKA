'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search, BookOpen, ArrowRight, Scale, Filter,
  CheckCircle2, AlertTriangle, RotateCcw, Calendar,
  FileText, History, Gavel, ChevronDown, Check, SlidersHorizontal
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface LawItem {
  id: string;
  slug: string;
  type: string; // 'Undang-Undang' | 'Peraturan Pemerintah' | 'UUD 1945' | dll
  number: number | string;
  year: number;
  title: string;
  shortTitle?: string;
  status: 'BERLAKU' | 'DIUBAH' | 'DICABUT';
  promulgatedAt: string;
  lnNumber?: string;
  tlnNumber?: string;
  field: string; // 'Pidana' | 'Siber & Teknologi' | 'Tata Negara' | 'Bisnis' | 'HAM'
  description: string;
  amendedBy?: string[]; // Peraturan yang mengubah
  amends?: string[];    // Peraturan yang diubah
  implementingRegs?: string[]; // Aturan pelaksana (PP / Permen)
  mkRulings?: string[]; // Putusan MK terkait
  totalArticles?: number;
}

const HUKUMONLINE_STYLE_LAWS: LawItem[] = [
  {
    id: 'uu-11-2008',
    slug: 'ite',
    type: 'Undang-Undang',
    number: 11,
    year: 2008,
    title: 'Informasi dan Transaksi Elektronik',
    shortTitle: 'UU ITE',
    status: 'DIUBAH',
    promulgatedAt: '21 April 2008',
    lnNumber: 'LNRI Tahun 2008 No. 58',
    tlnNumber: 'TLNRI No. 4843',
    field: 'Siber & Teknologi',
    description: 'Mengatur mengenai yurisdiksi ekstrateritorial, pengakuan alat bukti elektronik, penyelenggaraan sertifikasi elektronik, dan delik siber termasuk kesusilaan serta pencemaran nama baik.',
    amendedBy: [
      'UU No. 19 Tahun 2016 (Amandemen I)',
      'UU No. 1 Tahun 2024 (Amandemen II)'
    ],
    implementingRegs: [
      'PP No. 71 Tahun 2019 tentang PSTE',
      'PP No. 82 Tahun 2012 tentang PSTE (Dicabut)'
    ],
    mkRulings: [
      'Putusan MK No. 50/PUU-VI/2008 (Uji Materi Pasal 27 Ayat 3)',
      'Putusan MK No. 20/PUU-XIV/2016 (Alat Bukti Penyadapan)'
    ],
    totalArticles: 54,
  },
  {
    id: 'uu-1-2024',
    slug: 'ite',
    type: 'Undang-Undang',
    number: 1,
    year: 2024,
    title: 'Perubahan Kedua atas Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik',
    shortTitle: 'UU 1/2024 (Amandemen II ITE)',
    status: 'BERLAKU',
    promulgatedAt: '2 Januari 2024',
    lnNumber: 'LNRI Tahun 2024 No. 1',
    tlnNumber: 'TLNRI No. 6907',
    field: 'Siber & Teknologi',
    description: 'Menata ulang delik pencemaran nama baik pada Pasal 27 ayat (3), menyisipkan norma baru Pasal 27A & 27B, memperketat delik pemberitaan bohong bermuatan kerusuhan, dan kewajiban pelindungan anak di ruang siber.',
    amends: ['UU No. 11 Tahun 2008 stdd UU No. 19 Tahun 2016'],
    totalArticles: 14,
  },
  {
    id: 'uu-1-2023',
    slug: 'ite',
    type: 'Undang-Undang',
    number: 1,
    year: 2023,
    title: 'Kitab Undang-Undang Hukum Pidana (KUHP Nasional)',
    shortTitle: 'KUHP Baru',
    status: 'BERLAKU',
    promulgatedAt: '2 Januari 2023',
    lnNumber: 'LNRI Tahun 2023 No. 1',
    tlnNumber: 'TLNRI No. 6842',
    field: 'Pidana',
    description: 'Rekodifikasi hukum pidana materiil nasional Indonesia yang menggantikan Wetboek van Strafrecht (WvS 1915). Mengadopsi prinsip legalitas materiil, sanksi kerja sosial, pidana pengawasan, dan keadilan restoratif.',
    amendedBy: [],
    implementingRegs: ['Rancangan Peraturan Pemerintah Pelaksana KUHP Nasional'],
    totalArticles: 624,
  },
  {
    id: 'uu-27-2022',
    slug: 'ite',
    type: 'Undang-Undang',
    number: 27,
    year: 2022,
    title: 'Pelindungan Data Pribadi (UU PDP)',
    shortTitle: 'UU PDP',
    status: 'BERLAKU',
    promulgatedAt: '17 Oktober 2022',
    lnNumber: 'LNRI Tahun 2022 No. 196',
    tlnNumber: 'TLNRI No. 6820',
    field: 'Siber & Teknologi',
    description: 'Mengatur hak subjek data, kewajiban dan tanggung jawab pengendali data serta prosesor data, penunjukan Data Protection Officer (DPO), mekanisme transfer data internasional, serta sanksi administratif dan pidana penyalahgunaan data.',
    totalArticles: 76,
  },
  {
    id: 'uu-6-2023',
    slug: 'ite',
    type: 'Undang-Undang',
    number: 6,
    year: 2023,
    title: 'Penetapan Peraturan Pemerintah Pengganti Undang-Undang Nomor 2 Tahun 2022 tentang Cipta Kerja Menjadi Undang-Undang',
    shortTitle: 'UU Cipta Kerja',
    status: 'BERLAKU',
    promulgatedAt: '31 Maret 2023',
    lnNumber: 'LNRI Tahun 2023 No. 41',
    tlnNumber: 'TLNRI No. 6856',
    field: 'Bisnis',
    description: 'Regulasi omnibus law komprehensif yang mengubah, menyelaraskan, dan mencabut ketentuan dalam 78 undang-undang sektoral terkait perizinan berusaha, ketenagakerjaan, perpajakan, dan investasi.',
    mkRulings: [
      'Putusan MK No. 91/PUU-XVIII/2020 (Uji Formil UU 11/2020 Inkonstitusional Bersyarat)',
      'Putusan MK No. 168/PUU-XXI/2023 (Uji Materi Kluster Ketenagakerjaan)'
    ],
    totalArticles: 186,
  },
  {
    id: 'uu-31-1999',
    slug: 'ite',
    type: 'Undang-Undang',
    number: 31,
    year: 1999,
    title: 'Pemberantasan Tindak Pidana Korupsi',
    shortTitle: 'UU Tipikor',
    status: 'DIUBAH',
    promulgatedAt: '16 Agustus 1999',
    lnNumber: 'LNRI Tahun 1999 No. 140',
    tlnNumber: 'TLNRI No. 3874',
    field: 'Pidana',
    description: 'Mengatur delik korupsi kerugian keuangan negara, suap-menyuap, gratifikasi, pemerasan dalam jabatan, serta perluasan subjek hukum korporasi dan pembuktian terbalik terbatas.',
    amendedBy: ['UU No. 20 Tahun 2001 (Perubahan atas UU 31/1999)'],
    mkRulings: [
      'Putusan MK No. 003/PUU-IV/2006 (Uji Materi Frasa Melawan Hukum Materiil)',
      'Putusan MK No. 25/PUU-XIV/2016 (Penafsiran Kerugian Negara Nyata / Actual Loss)'
    ],
    totalArticles: 44,
  },
  {
    id: 'uu-39-1999',
    slug: 'ite',
    type: 'Undang-Undang',
    number: 39,
    year: 1999,
    title: 'Hak Asasi Manusia (UU HAM)',
    shortTitle: 'UU HAM',
    status: 'BERLAKU',
    promulgatedAt: '23 September 1999',
    lnNumber: 'LNRI Tahun 1999 No. 165',
    tlnNumber: 'TLNRI No. 3886',
    field: 'HAM',
    description: 'Payung hukum penegakan hak asasi manusia di Indonesia, mengatur hak untuk hidup, hak berkeluarga, hak mengembangkan diri, kebebasan pribadi, rasa aman, kesejahteraan, serta kewenangan Komnas HAM.',
    totalArticles: 106,
  },
  {
    id: 'pp-71-2019',
    slug: 'ite',
    type: 'Peraturan Pemerintah',
    number: 71,
    year: 2019,
    title: 'Penyelenggaraan Sistem dan Transaksi Elektronik',
    shortTitle: 'PP PSTE',
    status: 'BERLAKU',
    promulgatedAt: '10 Oktober 2019',
    lnNumber: 'LNRI Tahun 2019 No. 185',
    tlnNumber: 'TLNRI No. 6400',
    field: 'Siber & Teknologi',
    description: 'Aturan turunan pelaksanaan UU ITE yang mengatur tata kelola pendaftaran PSE lingkup publik dan privat, penempatan pusat data, sertifikasi elektronik, dan mekanisme pemutusan akses konten digital.',
    amends: ['PP No. 82 Tahun 2012 (Dicabut dan Digantikan)'],
    totalArticles: 104,
  },
  {
    id: 'uud-1945',
    slug: 'ite',
    type: 'UUD 1945',
    number: '1945',
    year: 1945,
    title: 'Undang-Undang Dasar Negara Republik Indonesia Tahun 1945',
    shortTitle: 'UUD NRI 1945',
    status: 'BERLAKU',
    promulgatedAt: '18 Agustus 1945',
    lnNumber: 'Lembaran Negara No. 75 Tahun 1959',
    field: 'Tata Negara',
    description: 'Konstitusi hukum tertinggi Republik Indonesia yang memuat staatsfundamentalnorm, sistem pemerintahan, pembagian kekuasaan lembaga negara, jaminan hak warga negara, dan 4 tahapan amandemen komprehensif (1999–2002).',
    totalArticles: 37,
  }
];

function HukumonlineCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState<string>('SEMUA');
  const [selectedStatus, setSelectedStatus] = useState<string>('SEMUA');
  const [selectedField, setSelectedField] = useState<string>('SEMUA');
  const [sortBy, setSortBy] = useState<'relevan' | 'terbaru' | 'terlama'>('relevan');
  const [laws, setLaws] = useState<LawItem[]>(HUKUMONLINE_STYLE_LAWS);
  const [openSections, setOpenSections] = useState<{ status: boolean; type: boolean; field: boolean }>({
    status: false,
    type: false,
    field: false,
  });

  const toggleSection = (key: 'status' | 'type' | 'field') => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Ambil data dari server jika API siap
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/instruments`);
        if (res.ok) {
          const json = await res.json();
          if (!cancelled && Array.isArray(json?.data) && json.data.length > 0) {
            // merge data jika perlu
          }
        }
      } catch {
        // fallback to HUKUMONLINE_STYLE_LAWS
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Filter & Sort Logika ala Pusat Data Hukumonline
  const filteredAndSortedLaws = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = laws.filter((item) => {
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.shortTitle && item.shortTitle.toLowerCase().includes(q)) ||
        `${item.number}`.includes(q) ||
        `${item.year}`.includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.field && item.field.toLowerCase().includes(q));

      const matchType =
        selectedType === 'SEMUA' ||
        item.type.toLowerCase() === selectedType.toLowerCase();

      const matchStatus =
        selectedStatus === 'SEMUA' || item.status === selectedStatus;

      const matchField =
        selectedField === 'SEMUA' ||
        (item.field && item.field.toLowerCase() === selectedField.toLowerCase());

      return matchQuery && matchType && matchStatus && matchField;
    });

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === 'terbaru') return b.year - a.year;
      if (sortBy === 'terlama') return a.year - b.year;
      return 0; // relevan
    });
  }, [laws, query, selectedType, selectedStatus, selectedField, sortBy]);

  const resetAllFilters = () => {
    setQuery('');
    setSelectedType('SEMUA');
    setSelectedStatus('SEMUA');
    setSelectedField('SEMUA');
    setSortBy('relevan');
  };

  const isFiltered = query || selectedType !== 'SEMUA' || selectedStatus !== 'SEMUA' || selectedField !== 'SEMUA';

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FA] font-sans text-slate-800">
      {/* ── Kotak Pencarian Terpadu Atas (Style Hukumonline Header) ── */}

      {/* ── Kotak Pencarian Terpadu Atas (Style Hukumonline Header) ── */}
      <div className="bg-[#94191C] text-white py-6 border-b border-[#861619]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-4xl">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
              Pusat Data &amp; Pencarian Peraturan Perundang-undangan
            </h1>
            <p className="text-xs sm:text-sm text-white/80 font-light mb-4">
              Cari undang-undang, nomor, tahun, atau kata kunci pasal. Buka langsung naskah konsolidasi deterministik.
            </p>

            <form onSubmit={handleSearchSubmit} className="relative flex items-center shadow-lg rounded-xl">
              <Search className="w-5 h-5 absolute left-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ketik judul undang-undang, nomor, tahun (misal: ITE, 11 2008, KUHP, PDP, Korupsi)…"
                className="w-full pl-12 pr-24 py-3 bg-white text-slate-900 placeholder:text-slate-400 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-amber-300/40"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Hapus
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* ── Main 2-Column Content Layout (Persis Hukumonline Pro) ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ════ KOLOM KIRI: Sidebar Filter Terstruktur (Hukumonline Style) ════ */}
          <aside className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                <SlidersHorizontal className="w-4 h-4 text-[#94191C]" />
                Filter Peraturan
              </div>
              {isFiltered && (
                <button
                  onClick={resetAllFilters}
                  className="text-[11px] font-semibold text-[#94191C] hover:text-[#861619] flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>

            {/* 1. Filter Status Keberlakuan (Collapsible, Default Tertutup) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('status')}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Status Keberlakuan
                  </span>
                  {selectedStatus !== 'SEMUA' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 font-mono">
                      1 Aktif
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    openSections.status ? 'rotate-180 text-slate-700' : ''
                  }`}
                />
              </button>

              {openSections.status && (
                <div className="p-2 pt-0 space-y-1 text-xs border-t border-slate-100 mt-1">
                  {[
                    { value: 'SEMUA', label: 'Semua Status' },
                    { value: 'BERLAKU', label: '🟢 Berlaku / Utuh' },
                    { value: 'DIUBAH', label: '🟡 Telah Diubah (Konsolidasi)' },
                    { value: 'DICABUT', label: '🔴 Dicabut / Tidak Berlaku' },
                  ].map((st) => {
                    const isSelected = selectedStatus === st.value;
                    return (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() => setSelectedStatus(st.value)}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-red-50/90 text-[#94191C] font-bold border border-red-200/80 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <span>{st.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#94191C]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Filter Bentuk / Jenis Peraturan (Collapsible, Default Tertutup) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('type')}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Bentuk Peraturan
                  </span>
                  {selectedType !== 'SEMUA' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-[#94191C] font-mono">
                      1 Aktif
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    openSections.type ? 'rotate-180 text-slate-700' : ''
                  }`}
                />
              </button>

              {openSections.type && (
                <div className="p-2 pt-0 space-y-1 text-xs border-t border-slate-100 mt-1">
                  {[
                    { value: 'SEMUA', label: 'Semua Bentuk' },
                    { value: 'Undang-Undang', label: 'Undang-Undang (UU)' },
                    { value: 'Peraturan Pemerintah', label: 'Peraturan Pemerintah (PP)' },
                    { value: 'UUD 1945', label: 'UUD 1945' },
                  ].map((tp) => {
                    const isSelected = selectedType === tp.value;
                    return (
                      <button
                        key={tp.value}
                        type="button"
                        onClick={() => setSelectedType(tp.value)}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-red-50/90 text-[#94191C] font-bold border border-red-200/80 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <span>{tp.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#94191C]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Filter Bidang Hukum (Collapsible, Default Tertutup) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('field')}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Bidang Hukum
                  </span>
                  {selectedField !== 'SEMUA' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-[#94191C] font-mono">
                      1 Aktif
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    openSections.field ? 'rotate-180 text-slate-700' : ''
                  }`}
                />
              </button>

              {openSections.field && (
                <div className="p-2 pt-0 space-y-1 text-xs border-t border-slate-100 mt-1">
                  {[
                    { value: 'SEMUA', label: 'Semua Bidang' },
                    { value: 'Pidana', label: 'Hukum Pidana' },
                    { value: 'Siber & Teknologi', label: 'Siber & Teknologi' },
                    { value: 'Tata Negara', label: 'Hukum Tata Negara' },
                    { value: 'Bisnis', label: 'Hukum Bisnis & Niaga' },
                    { value: 'HAM', label: 'Hak Asasi Manusia' },
                  ].map((fd) => {
                    const isSelected = selectedField === fd.value;
                    return (
                      <button
                        key={fd.value}
                        type="button"
                        onClick={() => setSelectedField(fd.value)}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-red-50/90 text-[#94191C] font-bold border border-red-200/80 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <span>{fd.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#94191C]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* ════ KOLOM KANAN: List Hasil Peraturan Ala Hukumonline ════ */}
          <section className="lg:col-span-9 space-y-4">
            {/* Header Hasil Pencarian & Sorting */}
            <div className="bg-white rounded-2xl border border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="text-xs text-slate-600">
                Menemukan <strong className="text-slate-900 font-mono text-sm">{filteredAndSortedLaws.length}</strong> peraturan perundang-undangan
                {query && <span> untuk &ldquo;<strong className="text-slate-900">{query}</strong>&rdquo;</span>}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Urutkan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-[#94191C]/20 cursor-pointer"
                >
                  <option value="relevan">Paling Relevan</option>
                  <option value="terbaru">Tahun Terbaru</option>
                  <option value="terlama">Tahun Terlama</option>
                </select>
              </div>
            </div>

            {/* List Item Peraturan */}
            {filteredAndSortedLaws.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-[#94191C] mx-auto mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-sans font-bold text-base text-slate-900">
                  Tidak ada peraturan yang cocok
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Coba sesuaikan kata kunci pencarian atau reset filter yang sedang aktif.
                </p>
                <button
                  onClick={resetAllFilters}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#94191C] text-white text-xs font-semibold hover:bg-[#861619] transition-colors cursor-pointer"
                >
                  Tampilkan Semua Peraturan
                </button>
              </div>
            ) : (
              filteredAndSortedLaws.map((law) => {
                return (
                  <article
                    key={law.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-[#94191C]/50 hover:shadow-md transition-all group"
                  >
                    {/* Baris Atas: Nomor Peraturan & Badge Status Keberlakuan */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-slate-900 tracking-wide bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                          {law.type} Nomor {law.number} Tahun {law.year}
                        </span>
                        {law.field && (
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {law.field}
                          </span>
                        )}
                      </div>

                      {/* Badge Keberlakuan Ala Hukumonline */}
                      <div>
                        {law.status === 'BERLAKU' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Masih Berlaku
                          </span>
                        )}
                        {law.status === 'DIUBAH' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Telah Diubah (Konsolidasi Aktif)
                          </span>
                        )}
                        {law.status === 'DICABUT' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Dicabut / Tidak Berlaku
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Judul Resmi Peraturan */}
                    <div className="mb-2">
                      <Link href={`/uu/${law.slug}`} className="block group-hover:text-[#94191C] transition-colors">
                        <h2 className="font-sans font-bold text-base sm:text-lg text-slate-900 leading-snug">
                          {law.title}
                        </h2>
                      </Link>
                    </div>

                    {/* Metadata Resmi: Tanggal & Lembaran Negara */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] text-slate-500 font-medium mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Diundangkan: {law.promulgatedAt}
                      </span>
                      {law.lnNumber && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          {law.lnNumber}
                        </span>
                      )}
                      {law.tlnNumber && (
                        <span className="text-slate-400">· {law.tlnNumber}</span>
                      )}
                    </div>

                    {/* Ringkasan Abstrak Pokok Aturan */}
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-4">
                      {law.description}
                    </p>

                    {/* Silsilah Relasi Hukum Ala Hukumonline (Riwayat Perubahan & Putusan MK) */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1.5 text-[11px] mb-4">
                      {law.amendedBy && law.amendedBy.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-amber-800 shrink-0 flex items-center gap-1">
                            <History className="w-3 h-3" />
                            Diubah Oleh:
                          </span>
                          <span className="text-slate-700 font-medium">
                            {law.amendedBy.join(' · ')}
                          </span>
                        </div>
                      )}

                      {law.amends && law.amends.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-blue-800 shrink-0 flex items-center gap-1">
                            <History className="w-3 h-3" />
                            Mengubah:
                          </span>
                          <span className="text-slate-700 font-medium">
                            {law.amends.join(' · ')}
                          </span>
                        </div>
                      )}

                      {law.implementingRegs && law.implementingRegs.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-indigo-800 shrink-0 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Aturan Pelaksana:
                          </span>
                          <span className="text-slate-700 font-medium">
                            {law.implementingRegs.join(' · ')}
                          </span>
                        </div>
                      )}

                      {law.mkRulings && law.mkRulings.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-rose-800 shrink-0 flex items-center gap-1">
                            <Gavel className="w-3 h-3" />
                            Putusan MK Terkait:
                          </span>
                          <span className="text-slate-700 font-medium">
                            {law.mkRulings.join(' · ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tombol Aksi Buka Naskah Asli di Workspace Baca */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="text-[11px] text-slate-500 font-medium">
                        Total {law.totalArticles || 54} Pasal Konsolidasi Tersedia
                      </div>

                      <Link
                        href={`/uu/${law.slug}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer group-hover:scale-102"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Buka Workspace Naskah Asli</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-[#3A0F08] bg-[#1E0507] text-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/70">
          <div>
            SIPAKA · Sistem Informasi Pelacakan Amandemen, Kodifikasi, dan Advokasi
          </div>
          <div className="flex items-center gap-4 text-white/80">
            <Link href="/" className="hover:text-amber-300 transition-colors">Beranda</Link>
            <Link href="/katalog" className="hover:text-amber-300 transition-colors">Pusat Data Peraturan</Link>
            <Link href="/neuron" className="hover:text-amber-300 transition-colors">Peta Silsilah</Link>
            <Link href="/tentang" className="hover:text-amber-300 transition-colors">Metodologi</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function SearchCatalogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans text-xs text-slate-500">
        Memuat data pencarian peraturan…
      </div>
    }>
      <HukumonlineCatalogContent />
    </Suspense>
  );
}

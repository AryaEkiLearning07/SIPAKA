'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search, BookOpen, ArrowRight,
  AlertTriangle, RotateCcw, Calendar,
  FileText, History, Gavel, ChevronDown, Check, SlidersHorizontal,
  X, Layers, Clock, Sparkles, Download
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface LawItem {
  id: string;
  slug: string;
  type: string;
  number: number | string;
  year: number;
  title: string;
  shortTitle?: string;
  status: 'BERLAKU' | 'DIUBAH' | 'DICABUT';
  promulgatedAt: string;
  lnNumber?: string;
  tlnNumber?: string;
  field?: string;
  description?: string;
  pdfUrl?: string;
  amendedBy?: string[];
  amends?: string[];
  mkRulings?: string[];
  totalArticles?: number;
}

/** Normalise respons /api/v1/instruments ke LawItem[] */
function normaliseLaws(data: Record<string, unknown>[]): LawItem[] {
  return data.map((item) => ({
    id: String(item.id ?? `${item.type}-${item.number}-${item.year}`),
    slug: String(item.slug ?? ''),
    type: item.type === 'UU' ? 'Undang-Undang'
        : item.type === 'PP' ? 'Peraturan Pemerintah'
        : String(item.type ?? 'UU'),
    number: item.number as number,
    year: item.year as number,
    title: String(item.title ?? ''),
    shortTitle: item.shortTitle ? String(item.shortTitle) : undefined,
    status: (['BERLAKU', 'DIUBAH', 'DICABUT'].includes(String(item.status))
      ? item.status : 'BERLAKU') as LawItem['status'],
    promulgatedAt: item.promulgatedAt
      ? new Date(String(item.promulgatedAt)).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric',
        })
      : '',
    lnNumber: item.lnNumber ? `LNRI No. ${item.lnNumber}` : undefined,
    tlnNumber: item.tlnNumber ? `TLNRI No. ${item.tlnNumber}` : undefined,
    field: item.field ? String(item.field) : undefined,
    description: item.description ? String(item.description) : undefined,
    pdfUrl: item.pdfUrl ? String(item.pdfUrl) : undefined,
    amendedBy: Array.isArray(item.amendingInstruments) ? (item.amendingInstruments as string[]) : [],
    totalArticles: item.totalArticles as number | undefined,
  }));
}

/** Inferensi bidang / topik hukum dari teks judul atau metadata */
function inferLegalField(law: LawItem): string {
  if (law.field) return law.field;
  const str = `${law.title} ${law.slug} ${law.shortTitle || ''}`.toLowerCase();
  if (str.includes('pidana') || str.includes('kuhp')) return 'Hukum Pidana & Kodifikasi';
  if (str.includes('elektronik') || str.includes('ite') || str.includes('data pribadi') || str.includes('siber')) return 'Teknologi Informasi & Siber';
  if (str.includes('perseroan') || str.includes('bisnis') || str.includes('perdagangan') || str.includes('konsumen')) return 'Hukum Bisnis & Korporasi';
  if (str.includes('cipta kerja') || str.includes('tenaga kerja') || str.includes('buruh')) return 'Ketenagakerjaan & Investasi';
  if (str.includes('korupsi') || str.includes('kpk') || str.includes('tipikor')) return 'Pemberantasan Tindak Pidana Korupsi';
  if (str.includes('pemerintahan') || str.includes('daerah') || str.includes('pemda') || str.includes('pilkada')) return 'Hukum Tata Negara & Otonomi';
  if (str.includes('kesehatan') || str.includes('medis')) return 'Kesehatan & Farmasi';
  return 'Regulasi Nasional';
}

/** Resolusi nomenklatur resmi, tentang, dan nama populer sesuai standar baku JDIH & Hukumonline */
function getLegalIdentity(law: LawItem): {
  officialTitle: string;
  tentang: string;
  popularName?: string;
} {
  const popularMap: Record<string, string> = {
    'uu-1-2023': 'KUHP Baru',
    'uu-27-2022': 'UU PDP',
    'uu-11-2008': 'UU ITE',
    'ite': 'UU ITE',
    'uu-19-2016': 'Amandemen 1 UU ITE',
    'uu-1-2024': 'Amandemen 2 UU ITE',
    'uu-40-2007': 'UU PT',
    'uu-8-1999': 'UUPK',
    'uu-11-2020': 'UU Cipta Kerja',
  };

  const officialTitle = `${law.type} Nomor ${law.number} Tahun ${law.year}`;
  const pop = popularMap[law.slug] || popularMap[law.id];

  // 1. Ekstrak dari frasa "tentang ..." jika ada
  const m = law.title.match(/tentang\s+(.+)$/i);
  if (m && m[1].trim()) {
    const rawTopic = m[1].trim().replace(/\s+[|–\-]\s+.*$/i, '').trim();
    return {
      officialTitle,
      tentang: rawTopic,
      popularName: pop,
    };
  }

  // 2. Jika title di database bukan sekadar "Undang-Undang Nomor X..."
  const isGeneric = law.title.match(/^(?:Undang-Undang|UU)\s+(?:Nomor|No\.?)\s*\d+\s+Tahun\s+\d+$/i);
  if (!isGeneric && law.title.trim()) {
    return {
      officialTitle,
      tentang: law.title.trim(),
      popularName: pop,
    };
  }

  // 3. Fallback
  return {
    officialTitle,
    tentang: pop || 'Naskah Regulasi Lembaran Negara RI',
    popularName: pop,
  };
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState<string>('SEMUA');
  const [selectedStatus, setSelectedStatus] = useState<string>('SEMUA');
  const [selectedConsolidation, setSelectedConsolidation] = useState<string>('SEMUA');
  const [selectedField, setSelectedField] = useState<string>('SEMUA');
  const [selectedEra, setSelectedEra] = useState<string>('SEMUA');
  const [customYearMin, setCustomYearMin] = useState<string>('');
  const [customYearMax, setCustomYearMax] = useState<string>('');
  const [sortBy, setSortBy] = useState<'relevan' | 'terbaru' | 'terlama' | 'pasal_terbanyak'>('relevan');
  const [laws, setLaws] = useState<LawItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiDown, setApiDown] = useState(false);
  const [searchMode, setSearchMode] = useState<'METADATA' | 'PROVISIONS'>('METADATA');
  const [provisionResults, setProvisionResults] = useState<any[]>([]);
  const [isSearchingProvisions, setIsSearchingProvisions] = useState<boolean>(false);

  // Debounced search isi pasal (full-text provision search)
  useEffect(() => {
    if (searchMode !== 'PROVISIONS' || !query.trim() || query.trim().length < 2) {
      setProvisionResults([]);
      setIsSearchingProvisions(false);
      return;
    }

    let cancelled = false;
    setIsSearchingProvisions(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/search/provisions?q=${encodeURIComponent(query.trim())}&limit=60`);
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) {
            setProvisionResults(json.results ?? []);
          }
        }
      } catch {
        if (!cancelled) setProvisionResults([]);
      } finally {
        if (!cancelled) setIsSearchingProvisions(false);
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, searchMode]);

  // Kelompokkan hasil temuan pasal per slug undang-undang
  const provisionsBySlug = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const r of provisionResults) {
      const s = r.instrument?.slug;
      if (!s) continue;
      if (!map[s]) map[s] = [];
      map[s].push(r);
    }
    return map;
  }, [provisionResults]);

  const [openSections, setOpenSections] = useState({
    type: true,
    status: true,
    consolidation: true,
    field: true,
    era: false,
  });

  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => { setQuery(initialQuery); }, [initialQuery]);

  // Fetch live dari API
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/instruments`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setLaws(normaliseLaws(Array.isArray(json?.data) ? json.data : []));
          setApiDown(false);
        }
      } catch {
        if (!cancelled) setApiDown(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Dynamic counter helpers
  const countByType = useMemo(() => {
    const map: Record<string, number> = { SEMUA: laws.length, UU: 0, PP: 0, PERDA: 0 };
    for (const l of laws) {
      if (l.type.toLowerCase().includes('undang')) map['UU'] = (map['UU'] || 0) + 1;
      else if (l.type.toLowerCase().includes('pemerintah')) map['PP'] = (map['PP'] || 0) + 1;
      else if (l.type.toLowerCase().includes('daerah')) map['PERDA'] = (map['PERDA'] || 0) + 1;
    }
    return map;
  }, [laws]);

  const countByStatus = useMemo(() => {
    const map: Record<string, number> = { SEMUA: laws.length, BERLAKU: 0, DIUBAH: 0, DICABUT: 0 };
    for (const l of laws) {
      if (map[l.status] !== undefined) map[l.status]++;
    }
    return map;
  }, [laws]);

  const countByConsolidation = useMemo(() => {
    let amended = 0;
    let original = 0;
    for (const l of laws) {
      const hasAm = (l.amendedBy && l.amendedBy.length > 0) || l.status === 'DIUBAH';
      if (hasAm) amended++;
      else original++;
    }
    return { SEMUA: laws.length, AMENDED_ONLY: amended, ORIGINAL_ONLY: original };
  }, [laws]);

  const countByField = useMemo(() => {
    const map: Record<string, number> = { SEMUA: laws.length };
    for (const l of laws) {
      const f = inferLegalField(l);
      map[f] = (map[f] || 0) + 1;
    }
    return map;
  }, [laws]);

  const countByEra = useMemo(() => {
    let lima = 0, reformasi = 0, orba = 0, orla = 0;
    for (const l of laws) {
      if (l.year >= 2021) lima++;
      if (l.year >= 1998) reformasi++;
      if (l.year >= 1966 && l.year < 1998) orba++;
      if (l.year >= 1945 && l.year < 1966) orla++;
    }
    return { SEMUA: laws.length, '5_TAHUN': lima, REFORMASI: reformasi, ORDE_BARU: orba, ORDE_LAMA: orla };
  }, [laws]);

  const filteredAndSortedLaws = useMemo(() => {
    const q = query.trim().toLowerCase();
    const minYr = customYearMin ? parseInt(customYearMin, 10) : null;
    const maxYr = customYearMax ? parseInt(customYearMax, 10) : null;

    // Jika mode pencarian isi pasal aktif dan ada query
    if (searchMode === 'PROVISIONS' && q.length >= 2) {
      const provisionMatched = laws.filter((item) => !!provisionsBySlug[item.slug]);
      if (sortBy === 'terbaru') return [...provisionMatched].sort((a, b) => b.year - a.year || Number(b.number) - Number(a.number));
      if (sortBy === 'terlama') return [...provisionMatched].sort((a, b) => a.year - b.year || Number(a.number) - Number(b.number));
      if (sortBy === 'pasal_terbanyak') return [...provisionMatched].sort((a, b) => (provisionsBySlug[b.slug]?.length || 0) - (provisionsBySlug[a.slug]?.length || 0));
      return provisionMatched;
    }

    const result = laws.filter((item) => {
      // 1. Search Query
      const matchQuery = !q
        || item.title.toLowerCase().includes(q)
        || (item.shortTitle?.toLowerCase().includes(q) ?? false)
        || String(item.number).includes(q)
        || String(item.year).includes(q)
        || (item.description?.toLowerCase().includes(q) ?? false)
        || (item.field?.toLowerCase().includes(q) ?? false);

      // 2. Type / Hierarchy
      const matchType = selectedType === 'SEMUA'
        || (selectedType === 'UU' && item.type.toLowerCase().includes('undang'))
        || (selectedType === 'PP' && item.type.toLowerCase().includes('pemerintah'))
        || (selectedType === 'PERDA' && item.type.toLowerCase().includes('daerah'))
        || item.type.toLowerCase() === selectedType.toLowerCase();

      // 3. Status
      const matchStatus = selectedStatus === 'SEMUA' || item.status === selectedStatus;

      // 4. Consolidation History
      const hasAm = (item.amendedBy && item.amendedBy.length > 0) || item.status === 'DIUBAH';
      const matchConsolidation = selectedConsolidation === 'SEMUA'
        || (selectedConsolidation === 'AMENDED_ONLY' && hasAm)
        || (selectedConsolidation === 'ORIGINAL_ONLY' && !hasAm);

      // 5. Legal Field
      const inferredField = inferLegalField(item);
      const matchField = selectedField === 'SEMUA'
        || inferredField.toLowerCase() === selectedField.toLowerCase()
        || (item.field?.toLowerCase() === selectedField.toLowerCase());

      // 6. Era & Year Range
      let matchEra = true;
      if (selectedEra === '5_TAHUN') matchEra = item.year >= 2021;
      else if (selectedEra === 'REFORMASI') matchEra = item.year >= 1998;
      else if (selectedEra === 'ORDE_BARU') matchEra = item.year >= 1966 && item.year < 1998;
      else if (selectedEra === 'ORDE_LAMA') matchEra = item.year >= 1945 && item.year < 1966;

      let matchCustomYear = true;
      if (minYr !== null && !isNaN(minYr) && item.year < minYr) matchCustomYear = false;
      if (maxYr !== null && !isNaN(maxYr) && item.year > maxYr) matchCustomYear = false;

      return matchQuery && matchType && matchStatus && matchConsolidation && matchField && matchEra && matchCustomYear;
    });

    if (sortBy === 'terbaru') return [...result].sort((a, b) => b.year - a.year || Number(b.number) - Number(a.number));
    if (sortBy === 'terlama') return [...result].sort((a, b) => a.year - b.year || Number(a.number) - Number(b.number));
    if (sortBy === 'pasal_terbanyak') return [...result].sort((a, b) => (b.totalArticles || 0) - (a.totalArticles || 0));
    return result;
  }, [laws, query, searchMode, provisionsBySlug, selectedType, selectedStatus, selectedConsolidation, selectedField, selectedEra, customYearMin, customYearMax, sortBy]);

  const resetAllFilters = () => {
    setQuery('');
    setSelectedType('SEMUA');
    setSelectedStatus('SEMUA');
    setSelectedConsolidation('SEMUA');
    setSelectedField('SEMUA');
    setSelectedEra('SEMUA');
    setCustomYearMin('');
    setCustomYearMax('');
    setSortBy('relevan');
  };

  const isFiltered = !!(
    query ||
    selectedType !== 'SEMUA' ||
    selectedStatus !== 'SEMUA' ||
    selectedConsolidation !== 'SEMUA' ||
    selectedField !== 'SEMUA' ||
    selectedEra !== 'SEMUA' ||
    customYearMin ||
    customYearMax
  );

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FA] font-sans text-slate-800">
      {/* Header Pencarian */}
      <div className="bg-[#94191C] text-white py-6 border-b border-[#861619]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-4xl">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
              Pusat Data &amp; Pencarian Peraturan Perundang-undangan
            </h1>
            <p className="text-xs sm:text-sm text-white/80 font-light mb-4">
              Cari undang-undang, nomor, tahun, atau kata kunci pasal. Buka langsung naskah konsolidasi deterministik.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="relative flex items-center shadow-lg rounded-xl">
              <Search className="w-5 h-5 absolute left-4 text-slate-400" />
              <input
                type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  searchMode === 'PROVISIONS'
                    ? 'Ketik materi muatan isi pasal (misal: pencemaran nama baik, ganti rugi, direksi, rahasia)…'
                    : 'Ketik judul undang-undang, nomor, tahun (misal: UU 1 2024, KUHP, ITE)…'
                }
                className="w-full pl-12 pr-24 py-3 bg-white text-slate-900 placeholder:text-slate-400 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-amber-300/40"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')}
                  className="absolute right-3 px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
                  Hapus
                </button>
              )}
            </form>

            {/* Toggle Mode Pencarian: Judul vs Isi Pasal */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
              <button
                type="button"
                onClick={() => setSearchMode(searchMode === 'METADATA' ? 'PROVISIONS' : 'METADATA')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  searchMode === 'PROVISIONS'
                    ? 'bg-amber-300 text-slate-950 shadow-sm ring-2 ring-amber-400/50'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cari di Seluruh Teks Isi Pasal (Full-Text)</span>
                {searchMode === 'PROVISIONS' && (
                  <span className="bg-[#94191C] text-amber-300 text-[10px] px-1.5 py-0.2 rounded font-mono uppercase">
                    Aktif
                  </span>
                )}
              </button>
              {isSearchingProvisions ? (
                <span className="text-amber-200 text-xs flex items-center gap-1 animate-pulse">
                  Menelusuri ribuan ketentuan pasal…
                </span>
              ) : searchMode === 'PROVISIONS' && query.trim().length >= 2 ? (
                <span className="text-white/80 text-xs">
                  Ditemukan {provisionResults.length} ketentuan pasal di {Object.keys(provisionsBySlug).length} undang-undang
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Banner error API */}
      {apiDown && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          API tidak terjangkau — pastikan server berjalan dan database sudah di-seed (<code>pnpm db:seed</code>).
        </div>
      )}

      {/* Layout 2 Kolom */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Filter */}
          <aside className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                <SlidersHorizontal className="w-4 h-4 text-[#94191C]" />
                Filter
              </div>
              {isFiltered && (
                <button onClick={resetAllFilters} className="text-[11px] font-semibold text-[#94191C] hover:text-[#861619] flex items-center gap-1 cursor-pointer">
                  <RotateCcw className="w-3 h-3" />Reset
                </button>
              )}
            </div>

            {/* 1. Bentuk & Hierarki Peraturan */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('type')}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-[#94191C]" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Bentuk Peraturan</span>
                  {selectedType !== 'SEMUA' && (
                    <span className="text-[10px] font-bold px-1.5 rounded bg-red-100 text-[#94191C] font-mono">1 Aktif</span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openSections.type ? 'rotate-180' : ''}`} />
              </button>
              {openSections.type && (
                <div className="p-2 pt-0 space-y-1 text-xs border-t border-slate-100 mt-1">
                  {[
                    { value: 'SEMUA', label: 'Semua Bentuk', count: countByType.SEMUA },
                    { value: 'UU', label: 'Undang-Undang (UU)', count: countByType.UU },
                    { value: 'PP', label: 'Peraturan Pemerintah (PP)', count: countByType.PP },
                    { value: 'PERDA', label: 'Peraturan Daerah (Perda)', count: countByType.PERDA },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedType(opt.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-all cursor-pointer ${
                        selectedType === opt.value
                          ? 'bg-red-50/90 text-[#94191C] font-bold border border-red-200/80'
                          : 'text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{opt.label}</span>
                        <span className="text-[10px] font-mono text-slate-400">({opt.count || 0})</span>
                      </span>
                      {selectedType === opt.value && <Check className="w-3.5 h-3.5 text-[#94191C]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Status Keberlakuan Hukum */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('status')}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Gavel className="w-3.5 h-3.5 text-[#94191C]" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Status Keberlakuan</span>
                  {selectedStatus !== 'SEMUA' && (
                    <span className="text-[10px] font-bold px-1.5 rounded bg-red-100 text-[#94191C] font-mono">1 Aktif</span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openSections.status ? 'rotate-180' : ''}`} />
              </button>
              {openSections.status && (
                <div className="p-2 pt-0 space-y-1 text-xs border-t border-slate-100 mt-1">
                  {[
                    { value: 'SEMUA', label: 'Semua Status', count: countByStatus.SEMUA },
                    { value: 'BERLAKU', label: '🟢 Masih Berlaku', count: countByStatus.BERLAKU },
                    { value: 'DIUBAH', label: '🟡 Telah Diubah', count: countByStatus.DIUBAH },
                    { value: 'DICABUT', label: '🔴 Dicabut', count: countByStatus.DICABUT },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedStatus(opt.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-all cursor-pointer ${
                        selectedStatus === opt.value
                          ? 'bg-red-50/90 text-[#94191C] font-bold border border-red-200/80'
                          : 'text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{opt.label}</span>
                        <span className="text-[10px] font-mono text-slate-400">({opt.count || 0})</span>
                      </span>
                      {selectedStatus === opt.value && <Check className="w-3.5 h-3.5 text-[#94191C]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Riwayat Konsolidasi & Amandemen */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('consolidation')}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-[#94191C]" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Riwayat Konsolidasi</span>
                  {selectedConsolidation !== 'SEMUA' && (
                    <span className="text-[10px] font-bold px-1.5 rounded bg-red-100 text-[#94191C] font-mono">1 Aktif</span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openSections.consolidation ? 'rotate-180' : ''}`} />
              </button>
              {openSections.consolidation && (
                <div className="p-2 pt-0 space-y-1 text-xs border-t border-slate-100 mt-1">
                  {[
                    { value: 'SEMUA', label: 'Semua Regulasi', count: countByConsolidation.SEMUA },
                    { value: 'AMENDED_ONLY', label: '⚡ Pernah Diamandemen', count: countByConsolidation.AMENDED_ONLY },
                    { value: 'ORIGINAL_ONLY', label: '📄 Naskah Induk Murni', count: countByConsolidation.ORIGINAL_ONLY },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedConsolidation(opt.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-all cursor-pointer ${
                        selectedConsolidation === opt.value
                          ? 'bg-red-50/90 text-[#94191C] font-bold border border-red-200/80'
                          : 'text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{opt.label}</span>
                        <span className="text-[10px] font-mono text-slate-400">({opt.count || 0})</span>
                      </span>
                      {selectedConsolidation === opt.value && <Check className="w-3.5 h-3.5 text-[#94191C]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Bidang Hukum & Sektoral */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('field')}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#94191C]" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Bidang Hukum</span>
                  {selectedField !== 'SEMUA' && (
                    <span className="text-[10px] font-bold px-1.5 rounded bg-red-100 text-[#94191C] font-mono">1 Aktif</span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openSections.field ? 'rotate-180' : ''}`} />
              </button>
              {openSections.field && (
                <div className="p-2 pt-0 space-y-1 text-xs border-t border-slate-100 mt-1 max-h-56 overflow-y-auto">
                  {[
                    { value: 'SEMUA', label: 'Semua Bidang' },
                    { value: 'Hukum Pidana & Kodifikasi', label: '🏛️ Pidana & Kodifikasi' },
                    { value: 'Teknologi Informasi & Siber', label: '🌐 Teknologi & Siber' },
                    { value: 'Hukum Bisnis & Korporasi', label: '🏢 Bisnis & Korporasi' },
                    { value: 'Ketenagakerjaan & Investasi', label: '💼 Tenaga Kerja & Investasi' },
                    { value: 'Hukum Tata Negara & Otonomi', label: '⚖️ Tata Negara & Otonomi' },
                    { value: 'Kesehatan & Farmasi', label: '🏥 Kesehatan & Farmasi' },
                    { value: 'Pemberantasan Tindak Pidana Korupsi', label: '🛡️ Tipikor & Penegakan' },
                    { value: 'Regulasi Nasional', label: '📑 Regulasi Umum' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedField(opt.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-all cursor-pointer ${
                        selectedField === opt.value
                          ? 'bg-red-50/90 text-[#94191C] font-bold border border-red-200/80'
                          : 'text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="truncate">{opt.label}</span>
                        <span className="text-[10px] font-mono text-slate-400">({countByField[opt.value] || (opt.value === 'SEMUA' ? countByField.SEMUA : 0)})</span>
                      </span>
                      {selectedField === opt.value && <Check className="w-3.5 h-3.5 text-[#94191C] shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Periode Waktu & Era Sejarah */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('era')}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#94191C]" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Periode &amp; Tahun</span>
                  {(selectedEra !== 'SEMUA' || customYearMin || customYearMax) && (
                    <span className="text-[10px] font-bold px-1.5 rounded bg-red-100 text-[#94191C] font-mono">1 Aktif</span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openSections.era ? 'rotate-180' : ''}`} />
              </button>
              {openSections.era && (
                <div className="p-3 pt-0 space-y-2 text-xs border-t border-slate-100 mt-1">
                  <div className="space-y-1">
                    {[
                      { value: 'SEMUA', label: 'Semua Tahun', count: countByEra.SEMUA },
                      { value: '5_TAHUN', label: '5 Tahun Terakhir (2021–2026)', count: countByEra['5_TAHUN'] },
                      { value: 'REFORMASI', label: 'Era Reformasi (1998–skrg)', count: countByEra.REFORMASI },
                      { value: 'ORDE_BARU', label: 'Era Orde Baru (1966–1998)', count: countByEra.ORDE_BARU },
                      { value: 'ORDE_LAMA', label: 'Era Kemerdekaan (1945–1966)', count: countByEra.ORDE_LAMA },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setSelectedEra(opt.value); setCustomYearMin(''); setCustomYearMax(''); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-all cursor-pointer ${
                          selectedEra === opt.value && !customYearMin && !customYearMax
                            ? 'bg-red-50/90 text-[#94191C] font-bold border border-red-200/80'
                            : 'text-slate-600 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <span>{opt.label}</span>
                        <span className="text-[10px] font-mono text-slate-400">({opt.count || 0})</span>
                      </button>
                    ))}
                  </div>

                  {/* Input Rentang Tahun Kustom */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1.5">Rentang Tahun Kustom:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={customYearMin}
                        onChange={(e) => { setCustomYearMin(e.target.value); setSelectedEra('SEMUA'); }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#94191C]"
                      />
                      <span className="text-slate-400 text-xs">—</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={customYearMax}
                        onChange={(e) => { setCustomYearMax(e.target.value); setSelectedEra('SEMUA'); }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#94191C]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* List Hasil */}
          <section className="lg:col-span-9 space-y-4">
            {/* Header Hasil & Pengurutan */}
            <div className="bg-white rounded-2xl border border-slate-200 px-5 py-3.5 shadow-2xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  {isLoading ? (
                    'Memuat data peraturan dari database…'
                  ) : (
                    <>
                      <strong className="text-slate-900 font-mono text-sm">{filteredAndSortedLaws.length}</strong> peraturan ditemukan
                      {query && <> untuk &ldquo;<strong className="text-slate-900">{query}</strong>&rdquo;</>}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Urutkan:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="relevan">Paling Relevan</option>
                    <option value="terbaru">Tahun Terbaru (2025 → 1945)</option>
                    <option value="terlama">Tahun Terlama (1945 → 2025)</option>
                    <option value="pasal_terbanyak">Pasal Terbanyak</option>
                  </select>
                </div>
              </div>

              {/* Bar Filter Aktif (Pills) */}
              {isFiltered && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-bold text-slate-400 font-mono uppercase mr-1">Filter Aktif:</span>
                  {selectedType !== 'SEMUA' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                      Bentuk: {selectedType}
                      <button onClick={() => setSelectedType('SEMUA')} className="hover:text-red-700 cursor-pointer"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {selectedStatus !== 'SEMUA' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                      Status: {selectedStatus}
                      <button onClick={() => setSelectedStatus('SEMUA')} className="hover:text-red-700 cursor-pointer"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {selectedConsolidation !== 'SEMUA' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
                      {selectedConsolidation === 'AMENDED_ONLY' ? '⚡ Pernah Diamandemen' : '📄 Naskah Murni'}
                      <button onClick={() => setSelectedConsolidation('SEMUA')} className="hover:text-red-700 cursor-pointer"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {selectedField !== 'SEMUA' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                      Bidang: {selectedField}
                      <button onClick={() => setSelectedField('SEMUA')} className="hover:text-red-700 cursor-pointer"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {selectedEra !== 'SEMUA' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                      Era: {selectedEra}
                      <button onClick={() => setSelectedEra('SEMUA')} className="hover:text-red-700 cursor-pointer"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {(customYearMin || customYearMax) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                      Tahun: {customYearMin || '...'} s.d. {customYearMax || '...'}
                      <button onClick={() => { setCustomYearMin(''); setCustomYearMax(''); }} className="hover:text-red-700 cursor-pointer"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  <button
                    onClick={resetAllFilters}
                    className="text-[11px] font-bold text-[#94191C] hover:underline ml-auto cursor-pointer"
                  >
                    Hapus Semua
                  </button>
                </div>
              )}
            </div>

            {/* Loading Skeleton */}
            {isLoading && [1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-full mb-1" />
                <div className="h-3 bg-slate-100 rounded w-5/6" />
              </div>
            ))}

            {/* Empty State */}
            {!isLoading && filteredAndSortedLaws.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-[#94191C] mx-auto mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-sans font-bold text-base text-slate-900">
                  {apiDown ? 'Database tidak terjangkau' : 'Tidak ada peraturan yang cocok'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {apiDown
                    ? 'Jalankan server API dan pastikan database sudah di-seed: pnpm db:seed'
                    : 'Coba sesuaikan kata kunci atau reset filter.'}
                </p>
                {!apiDown && (
                  <button onClick={resetAllFilters} className="mt-4 px-4 py-2 rounded-xl bg-[#94191C] text-white text-xs font-semibold hover:bg-[#861619] transition-colors cursor-pointer">
                    Tampilkan Semua
                  </button>
                )}
              </div>
            )}

            {/* List */}
            {!isLoading && filteredAndSortedLaws.map((law) => {
              const identity = getLegalIdentity(law);
              const fieldName = inferLegalField(law);
              const isAmended = law.amendedBy && law.amendedBy.length > 0;

              return (
                <article
                  key={law.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-[#94191C]/50 hover:shadow-md transition-all group relative overflow-hidden"
                >
                  {/* Top Bar: Nomenklatur Singkat, Bidang Hukum, & Status Keberlakuan */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100/90 px-2.5 py-0.5 rounded border border-slate-200">
                        {law.type} {law.number}/{law.year}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        {fieldName}
                      </span>
                      {identity.popularName && (
                        <span className="text-[11px] font-bold text-[#94191C] bg-red-50 px-2.5 py-0.5 rounded border border-red-200">
                          {identity.popularName}
                        </span>
                      )}
                    </div>
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
                          Telah Diubah
                        </span>
                      )}
                      {law.status === 'DICABUT' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Dicabut
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Judul Resmi Peraturan (Standar Format JDIH & Hukumonline) */}
                  <div className="mb-1.5">
                    <Link href={`/uu/${law.slug}`} className="block group-hover:text-[#94191C] transition-colors">
                      <h2 className="font-sans font-extrabold text-base sm:text-lg text-slate-900 leading-snug">
                        {identity.officialTitle}
                      </h2>
                    </Link>
                  </div>

                  {/* TENTANG: Substansi Pokok Peraturan (Tampil di Bawah Judul Sesuai Standar Nasional) */}
                  <div className="mb-3.5 flex items-start gap-1.5 text-sm leading-relaxed">
                    <span className="font-mono text-xs uppercase tracking-wider font-bold text-slate-400 shrink-0 pt-0.5">TENTANG:</span>
                    <span className="font-bold text-slate-800 group-hover:text-[#94191C] transition-colors">
                      {identity.tentang}
                    </span>
                  </div>

                  {/* Preview Singkat: Menjelaskan Ini Aturan Tentang Apa */}
                  <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80 mb-3.5 text-xs leading-relaxed">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px] mb-1 uppercase tracking-wider">
                      <FileText className="w-3.5 h-3.5 text-[#94191C]" />
                      <span>Ringkasan &amp; Ruang Lingkup:</span>
                    </div>
                    <p className="line-clamp-2 text-slate-600">
                      {law.description || (
                        isAmended
                          ? `Regulasi pokok ini telah mengalami amandemen hukum. Buka naskah konsolidasi untuk menelusuri rumusan norma sebelum dan sesudah perubahan secara deterministik.`
                          : `Mengatur asas, ketentuan umum, hak serta kewajiban hukum, dan tata tertib regulasi nasional dalam bidang ${fieldName.toLowerCase()}.`
                      )}
                    </p>
                  </div>

                  {/* Metadata Baris: Tanggal Pengundangan, LN/TLN, dan Jumlah Ketentuan */}
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] text-slate-500 font-medium mb-3">
                    {law.promulgatedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Diundangkan: {law.promulgatedAt}
                      </span>
                    )}
                    {law.lnNumber && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        {law.lnNumber}
                      </span>
                    )}
                    {law.tlnNumber && (
                      <span className="text-slate-400">· {law.tlnNumber}</span>
                    )}
                    {law.totalArticles && law.totalArticles > 0 ? (
                      <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono text-[10px]">
                        {law.totalArticles.toLocaleString('id-ID')} Ketentuan/Pasal
                      </span>
                    ) : null}
                    {law.pdfUrl && (
                      <a
                        href={law.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#94191C] hover:text-[#861619] hover:underline"
                        title="Unduh salinan resmi Lembaran Negara RI (PDF)"
                      >
                        <Download className="w-3.5 h-3.5 text-[#94191C]" />
                        <span>Unduh PDF LNRI</span>
                      </a>
                    )}
                  </div>

                  {/* Hasil Temuan Isi Pasal Terkait (Full-Text Search) */}
                  {provisionsBySlug[law.slug] && provisionsBySlug[law.slug].length > 0 && (
                    <div className="mt-3 mb-4 p-3.5 sm:p-4 rounded-xl bg-amber-50/70 border border-amber-200/90 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#94191C]" />
                          <span>Ditemukan {provisionsBySlug[law.slug].length} pasal memuat &quot;{query}&quot;:</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 font-normal">Klik untuk membuka pasal</span>
                      </div>
                      <div className="space-y-1.5">
                        {provisionsBySlug[law.slug].slice(0, 3).map((pRes) => (
                          <Link
                            key={pRes.id}
                            href={`/uu/${law.slug}?focus=${encodeURIComponent(pRes.canonicalPath)}`}
                            className="block p-2.5 rounded-lg bg-white border border-amber-200 hover:border-[#94191C] hover:shadow-xs transition-all text-xs group cursor-pointer"
                          >
                            <div className="flex items-center justify-between font-bold text-slate-900 text-xs mb-1">
                              <span className="text-[#94191C] group-hover:underline flex items-center gap-1">
                                <span>{pRes.label}</span>
                                {pRes.title && <span className="text-slate-500 font-normal">({pRes.title})</span>}
                              </span>
                              <span className="text-[10px] font-mono font-semibold text-slate-400 group-hover:text-[#94191C] transition-colors">
                                Buka Norma →
                              </span>
                            </div>
                            <p className="text-[11.5px] text-slate-700 leading-relaxed font-serif line-clamp-2">
                              {pRes.content}
                            </p>
                          </Link>
                        ))}
                        {provisionsBySlug[law.slug].length > 3 && (
                          <p className="text-[10.5px] text-amber-900 font-medium text-right pt-0.5">
                            + {provisionsBySlug[law.slug].length - 3} ketentuan pasal lainnya
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Riwayat Amandemen Jika Ada */}
                  {isAmended && (
                    <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200/80 mb-4">
                      <div className="flex items-start gap-2 text-[11px]">
                        <span className="font-bold text-amber-800 shrink-0 flex items-center gap-1">
                          <History className="w-3 h-3" />
                          Diubah Oleh:
                        </span>
                        <span className="text-amber-950 font-medium">
                          {law.amendedBy?.join(' · ')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Footer Aksi */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                      {law.totalArticles && law.totalArticles > 0 ? (
                        <>
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Naskah konsolidasi siap ditelusuri</span>
                        </>
                      ) : (
                        <>
                          <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-amber-800">Menunggu digitalisasi naskah / kurasi</span>
                        </>
                      )}
                    </div>
                    {law.totalArticles && law.totalArticles > 0 ? (
                      <Link
                        href={`/uu/${law.slug}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Buka Naskah</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <a
                        href={law.pdfUrl || `https://peraturan.bpk.go.id/Search?keywords=${encodeURIComponent(law.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        <span>Unduh PDF LNRI</span>
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      </main>

      <footer className="border-t border-[#3A0F08] bg-[#1E0507] text-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/70">
          <div>SIPAKA · Sistem Informasi Pelacakan Amandemen, Kodifikasi, dan Advokasi</div>
          <div className="flex items-center gap-4 text-white/80">
            <Link href="/" className="hover:text-amber-300 transition-colors">Beranda</Link>
            <Link href="/katalog" className="hover:text-amber-300 transition-colors">Pusat Data</Link>
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
        Memuat data peraturan…
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}

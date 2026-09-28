'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  HARMONISASI_DATASETS, 
  HarmonisasiDataset, 
  HarmonisasiRow 
} from './neuron-data';
import { 
  Search, 
  Filter, 
  AlertCircle, 
  ArrowUpRight, 
  CheckCircle2, 
  ShieldAlert, 
  FileText, 
  Scale, 
  Layers,
  HelpCircle
} from 'lucide-react';

export default function MatriksHarmonisasi() {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(HARMONISASI_DATASETS[0].id);
  const [urgensiFilter, setUrgensiFilter] = useState<'ALL' | 'KRITIS' | 'TINGGI' | 'SEDANG'>('ALL');
  const [kategoriFilter, setKategoriFilter] = useState<'ALL' | 'DELEGASI_KOSONG' | 'KONFLIK_NORMA' | 'PERUBAHAN_ASAS' | 'PUTUSAN_MK'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentDataset = useMemo(() => {
    return HARMONISASI_DATASETS.find((d) => d.id === selectedDatasetId) || HARMONISASI_DATASETS[0];
  }, [selectedDatasetId]);

  const filteredRows = useMemo(() => {
    return currentDataset.rows.filter((row) => {
      // Urgensi filter
      if (urgensiFilter !== 'ALL' && row.urgensi !== urgensiFilter) return false;
      // Kategori filter
      if (kategoriFilter !== 'ALL' && row.kategori !== kategoriFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          row.pasalUu.toLowerCase().includes(q) ||
          row.statusUuTerbaru.toLowerCase().includes(q) ||
          row.aturanTurunan.toLowerCase().includes(q) ||
          row.pasalTurunan.toLowerCase().includes(q) ||
          row.potensiKonflik.toLowerCase().includes(q) ||
          row.rekomendasi.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [currentDataset, urgensiFilter, kategoriFilter, searchQuery]);

  // Statistik dataset aktif
  const stats = useMemo(() => {
    const total = currentDataset.rows.length;
    const kritis = currentDataset.rows.filter((r) => r.urgensi === 'KRITIS').length;
    const tinggi = currentDataset.rows.filter((r) => r.urgensi === 'TINGGI').length;
    const sedang = currentDataset.rows.filter((r) => r.urgensi === 'SEDANG').length;
    return { total, kritis, tinggi, sedang };
  }, [currentDataset]);

  return (
    <div className="space-y-6">
      {/* Selector Undang-Undang Pokok */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Stufenbau Ripple Effect Engine
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#94191C] border border-red-200">
                Regulatory Impact Matrix
              </span>
            </div>
            <h2 className="font-sans font-bold text-lg text-slate-900">
              Matriks Analisis Dampak Regulasi &amp; Delegasi Turunan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih undang-undang pokok untuk mengaudit ketidaksinkronan norma vertikal (PP &amp; Permen) serta kekosongan aturan pelaksana.
            </p>
          </div>

          {/* Quick link ke Naskah Konsolidasi */}
          <Link
            href={`/uu/${currentDataset.slug}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white text-xs font-semibold shadow-xs transition-colors self-start md:self-auto shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            Buka Naskah Konsolidasi
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Tab Cards Pemilih Instrumen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {HARMONISASI_DATASETS.map((ds) => {
            const isSelected = ds.id === selectedDatasetId;
            return (
              <button
                key={ds.id}
                onClick={() => {
                  setSelectedDatasetId(ds.id);
                  setSearchQuery('');
                }}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#94191C] bg-red-50/40 ring-1 ring-[#94191C]/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">
                      {ds.nomorTahun}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#94191C]" />
                    )}
                  </div>
                  <h3 className={`font-bold text-xs ${isSelected ? 'text-[#94191C]' : 'text-slate-900'}`}>
                    {ds.label}
                  </h3>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100">
                  <span>{ds.rows.length} Kluster Dampak</span>
                  <span className="font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                    {ds.rows.filter(r => r.urgensi === 'KRITIS').length} Kritis
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kontrol Filter & Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Input Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari pasal, nama aturan turunan, atau kata kunci potensi konflik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#94191C] focus:ring-1 focus:ring-[#94191C] outline-hidden transition-all text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Filter Urgensi */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Urgensi:
          </span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setUrgensiFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                urgensiFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              onClick={() => setUrgensiFilter('KRITIS')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                urgensiFilter === 'KRITIS' ? 'bg-rose-50 text-rose-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kritis ({stats.kritis})
            </button>
            <button
              onClick={() => setUrgensiFilter('TINGGI')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                urgensiFilter === 'TINGGI' ? 'bg-amber-50 text-amber-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tinggi ({stats.tinggi})
            </button>
          </div>
        </div>

        {/* Filter Kategori */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value as any)}
            className="text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-700 font-medium focus:outline-hidden focus:border-[#94191C]"
          >
            <option value="ALL">Semua Kategori Risiko</option>
            <option value="DELEGASI_KOSONG">Kekosongan Aturan Pelaksana</option>
            <option value="KONFLIK_NORMA">Konflik Vertikal Norma</option>
            <option value="PERUBAHAN_ASAS">Perubahan Asas / Paradigma</option>
            <option value="PUTUSAN_MK">Dampak Putusan MK</option>
          </select>
        </div>
      </div>

      {/* Tabel Matriks */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">{currentDataset.label}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{currentDataset.deskripsi}</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Menampilkan {filteredRows.length} dari {currentDataset.rows.length} temuan
          </span>
        </div>

        {filteredRows.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Tidak ada baris matriks yang cocok dengan kriteria pencarian dan filter aktif.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-[22%]">Kluster Norma UU Terkini</th>
                  <th className="py-3.5 px-4 w-[20%]">Status &amp; Asas Baru</th>
                  <th className="py-3.5 px-4 w-[20%]">Regulasi Turunan Terdampak</th>
                  <th className="py-3.5 px-4 w-[18%]">Titik Potensi Konflik</th>
                  <th className="py-3.5 px-4 w-[20%]">Rekomendasi Harmonisasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    {/* Kluster Norma UU */}
                    <td className="py-4 px-4 align-top">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                            row.urgensi === 'KRITIS'
                              ? 'bg-rose-100 text-rose-800'
                              : row.urgensi === 'TINGGI'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            URGENSI {row.urgensi}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {row.kategori === 'DELEGASI_KOSONG' ? 'Kekosongan PP'
                              : row.kategori === 'KONFLIK_NORMA' ? 'Konflik Norma'
                              : row.kategori === 'PERUBAHAN_ASAS' ? 'Pergeseran Asas'
                              : 'Putusan MK'}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 leading-snug">
                          {row.pasalUu}
                        </p>
                      </div>
                    </td>

                    {/* Status & Asas Baru */}
                    <td className="py-4 px-4 text-slate-700 align-top leading-relaxed">
                      {row.statusUuTerbaru}
                    </td>

                    {/* Regulasi Turunan Terdampak */}
                    <td className="py-4 px-4 align-top">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="font-bold text-slate-800 block text-xs">
                          {row.aturanTurunan}
                        </span>
                        <span className="text-slate-500 text-[11px] font-mono block">
                          {row.pasalTurunan}
                        </span>
                      </div>
                    </td>

                    {/* Potensi Konflik */}
                    <td className="py-4 px-4 align-top leading-relaxed bg-rose-50/20">
                      <div className="flex items-start gap-1.5 text-rose-800">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                        <span className="font-medium text-xs">
                          {row.potensiKonflik}
                        </span>
                      </div>
                    </td>

                    {/* Rekomendasi Harmonisasi */}
                    <td className="py-4 px-4 align-top leading-relaxed bg-red-50/20">
                      <div className="flex items-start gap-1.5 text-[#94191C]">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#94191C]" />
                        <span className="font-medium text-xs">
                          {row.rekomendasi}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-400" />
            <span>
              Metodologi: <em>Regulatory Ripple Effect Engine</em> &amp; Teori <em>Stufenbau</em> Hans Kelsen
            </span>
          </div>
          <Link
            href={`/uu/${currentDataset.slug}`}
            className="text-[#94191C] font-semibold hover:underline inline-flex items-center gap-1"
          >
            Pelajari pasal di Naskah Konsolidasi {currentDataset.shortTitle} →
          </Link>
        </div>
      </div>
    </div>
  );
}

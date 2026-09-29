'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GitBranch, Network, ArrowRight, CheckCircle2,
  AlertTriangle, BookOpen, ExternalLink, RefreshCw,
  Search, ShieldCheck, Tag, Layers, CornerDownRight, FileCode
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface MutationItem {
  id: string;
  operationType: string;
  targetArticle: string;
  targetCanonicalPath?: string;
  sourceReference: string;
  amendingInstrument: string;
  amendingYear?: number;
  previousContent?: string | null;
  newContent?: string | null;
}

interface RelatedLawItem {
  law: string;
  slug: string;
  relation: string;
  description: string;
  year?: number;
}

interface GenealogyData {
  id: string;
  slug: string;
  officialTitle: string;
  title: string;
  shortTitle?: string;
  status: string;
  confidenceScore?: number;
  totalArticles: number;
  totalMutations: number;
  mutations: MutationItem[];
  relatedLaws: RelatedLawItem[];
}

const PRESET_LAWS = [
  { slug: 'ite', label: 'UU ITE (Pilot Konsolidasi)', year: 2008, number: 11 },
  { slug: 'uu-1-2023', label: 'UU 1/2023 (KUHP Baru)', year: 2023, number: 1 },
  { slug: 'uu-27-2022', label: 'UU PDP (Perlindungan Data Pribadi)', year: 2022, number: 27 },
  { slug: 'uu-40-2007', label: 'UU PT (Perseroan Terbatas)', year: 2007, number: 40 },
  { slug: 'uu-8-1999', label: 'UU Perlindungan Konsumen (UUPK)', year: 1999, number: 8 },
];

export default function LawConnectivityTrackerTab() {
  const [selectedSlug, setSelectedSlug] = useState<string>('ite');
  const [genealogy, setGenealogy] = useState<GenealogyData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeMutationType, setActiveMutationType] = useState<string>('ALL');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/monitoring/genealogy/${selectedSlug}`);
        if (res.ok) {
          const json = await res.json();
          if (active && json.data) {
            setGenealogy(json.data);
          }
        }
      } catch {
        // diam saat offline
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [selectedSlug]);

  const filteredMutations = (genealogy?.mutations || []).filter((m) => {
    if (activeMutationType === 'ALL') return true;
    return m.operationType === activeMutationType;
  });

  return (
    <div className="space-y-6">
      {/* Header Tab */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
              <Network className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-bold uppercase text-slate-400">
              Pelacakan Mutasi &amp; Jaring Relasi Antar-UU
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            Tracking Mutasi Pasal &amp; Silsilah Regulasi Terkait
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Mendeteksi secara presisi di mana saja pasal berubah, jenis mutasinya (disisip, diganti, atau dicabut), serta menghubungkan korelasinya dengan undang-undang lain.
          </p>
        </div>

        {/* Dropdown Pemilih UU */}
        <div className="flex items-center gap-2 bg-[#0F1420] border border-white/10 p-1.5 rounded-2xl">
          <span className="text-xs font-mono text-slate-400 pl-2">Pilih UU:</span>
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            aria-label="Pilih Undang-Undang Target"
            className="bg-black/50 text-white border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-rose-500 cursor-pointer"
          >
            {PRESET_LAWS.map((l) => (
              <option key={l.slug} value={l.slug} className="bg-slate-900">
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-xs font-mono animate-pulse flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
          <span>Memuat silsilah dan mutasi dari database...</span>
        </div>
      ) : genealogy ? (
        <>
          {/* Kartu Ringkasan Status 1 UU Ini */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Total Mutasi Pasal</span>
              <span className="text-2xl font-black text-rose-400">{genealogy.totalMutations} Perubahan</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">terekam di change_operations</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Status Keberlakuan</span>
              <span className={`text-xl font-black ${
                genealogy.status === 'DIUBAH' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {genealogy.status}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">hukum positif aktif</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Total Pasal / Node</span>
              <span className="text-2xl font-black text-white">{genealogy.totalArticles} Node</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">di tabel provisions</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Korelasi UU Terkait</span>
              <span className="text-2xl font-black text-cyan-400">{genealogy.relatedLaws.length} Regulasi</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">terhubung di graf</span>
            </div>
          </div>

          {/* Seksi 1: Di Mana Saja Perubahannya & Jenisnya Apa? */}
          <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/5 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-rose-400" />
                  <span>Peta Lokasi Mutasi Perubahan dalam UU Ini (Di Mana Saja &amp; Jenisnya Apa)</span>
                </h3>
                <p className="text-xs text-slate-400">Setiap perubahan pasal terikat pada klausul amandemen sumber yang sah.</p>
              </div>

              {/* Filter Jenis Mutasi */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-mono">
                {(['ALL', 'ADD_PROVISION', 'REPLACE_PROVISION', 'REPEAL_PROVISION'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveMutationType(t)}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                      activeMutationType === t
                        ? 'bg-white/10 text-white'
                        : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    {t === 'ALL' ? 'Semua' :
                     t === 'ADD_PROVISION' ? 'Sisip (ADD)' :
                     t === 'REPLACE_PROVISION' ? 'Ganti (REPLACE)' :
                     'Cabut (REPEAL)'}
                  </button>
                ))}
              </div>
            </div>

            {filteredMutations.length > 0 ? (
              <div className="space-y-3 font-mono text-xs">
                {filteredMutations.map((mut, idx) => (
                  <div
                    key={mut.id + idx}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors flex flex-col gap-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          mut.operationType.includes('ADD') ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                          mut.operationType.includes('REPLACE') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {mut.operationType}
                        </span>
                        <span className="text-sm font-black text-white">{mut.targetArticle}</span>
                        {mut.targetCanonicalPath && (
                          <span className="text-slate-500 text-[10px]">({mut.targetCanonicalPath})</span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400">
                        Dasar: <strong className="text-slate-200">{mut.sourceReference}</strong>
                        <span className="text-slate-500 ml-1">({mut.amendingInstrument})</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-[11px] text-slate-300 flex items-start gap-2">
                      <CornerDownRight className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        {mut.operationType === 'REPEAL_PROVISION' ? (
                          <span className="text-rose-300 font-bold">
                            Norma ini telah DICABUT dan dinyatakan tidak mempunyai kekuatan hukum mengikat.
                          </span>
                        ) : mut.operationType === 'ADD_PROVISION' ? (
                          <span className="text-cyan-300 font-bold">
                            Pasal baru yang disisipkan untuk mengisi kekosongan hukum materiil.
                          </span>
                        ) : (
                          <span className="text-amber-300 font-bold">
                            Rumusan teks digantikan sepenuhnya untuk menyesuaikan sanksi dan ketertiban hukum.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 font-mono text-xs">
                Tidak ada mutasi perubahan untuk jenis ini pada regulasi pokok tersebut.
              </div>
            )}
          </div>

          {/* Seksi 2: Korelasi Jaring Relasi Antar-UU (Graf & Hubungan Eksternal) */}
          <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-cyan-400" />
                  <span>Korelasi Jaring Relasi dengan Undang-Undang Lain</span>
                </h3>
                <p className="text-xs text-slate-400">Hubungan vertikal amandemen dan hubungan horizontal perujukan pasal.</p>
              </div>

              <Link
                href={`/uu/${genealogy.slug}`}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#94191C] to-rose-700 hover:from-[#A81F23] hover:to-rose-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <span>Buka Reader Naskah</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
              {genealogy.relatedLaws.map((rel, idx) => (
                <div
                  key={rel.slug + idx}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-all flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rel.relation === 'AMANDEMEN_PENGUBAH' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        rel.relation === 'MENGUBAH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        {rel.relation}
                      </span>
                      {rel.year && <span className="text-[10px] text-slate-500">Tahun {rel.year}</span>}
                    </div>

                    <h4 className="font-bold text-white text-xs line-clamp-1">{rel.law}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{rel.description}</p>
                  </div>

                  <div className="pt-2 border-t border-white/5 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>Slug: {rel.slug}</span>
                    <span className="text-cyan-400 font-bold">Terhubung ✓</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, BookOpen, ArrowRight, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import {
  POPULAR_LEGAL_ALIASES,
  checkAliasAndTypo,
  calculateRelevanceScore,
  LegalAlias,
} from '@/app/utils/smart-search';

export interface AutocompleteLawItem {
  id: string;
  slug: string;
  type: string;
  number: number | string;
  year: number;
  title: string;
  shortTitle?: string;
  status: string;
  totalArticles?: number;
  description?: string;
}

interface SearchAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit?: (e: React.FormEvent) => void;
  laws?: AutocompleteLawItem[];
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  showQuickPills?: boolean;
}

export default function SearchAutocompleteDropdown({
  value,
  onChange,
  onSubmit,
  laws = [],
  placeholder = 'Cari undang-undang, nomor, tahun, atau topik hukum… (mis. KUHP, ITE, Cipta Kerja)',
  autoFocus = false,
  className = '',
  showQuickPills = true,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Deteksi typo dan alias dari input
  const { matchedAlias, suggestedCorrection } = checkAliasAndTypo(value);

  // Ambil top suggestions terurut relevansi
  const suggestions = React.useMemo(() => {
    const q = value.trim();
    if (!q || laws.length === 0) return [];

    const scored = laws
      .map((law) => {
        const score = calculateRelevanceScore(law, q, matchedAlias);
        return { law, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 6).map((item) => item.law);
  }, [value, laws, matchedAlias]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLaw = (slug: string) => {
    setIsOpen(false);
    router.push(`/uu/${slug}`);
  };

  const handleApplyCorrection = (correction: string) => {
    onChange(correction);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* ── Input Bar ── */}
      <form
        onSubmit={(e) => {
          setIsOpen(false);
          if (onSubmit) onSubmit(e);
        }}
        className="relative flex items-center w-full"
      >
        <Search className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className="w-full pl-12 pr-24 py-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-[#94191C]/20 focus:border-[#94191C] transition-all font-medium"
        />
        <button
          type="submit"
          className="absolute right-2 top-2 bottom-2 px-4 bg-[#94191C] hover:bg-[#861619] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <span>Cari</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* ── Dropdown Hasil Cerdas / Autocomplete ── */}
      {isOpen && value.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-[100] overflow-hidden divide-y divide-slate-100 flex flex-col max-h-[460px]">
          {/* Typo Correction Banner jika ada */}
          {suggestedCorrection && suggestedCorrection.toLowerCase() !== value.trim().toLowerCase() && (
            <div className="p-3 bg-amber-50/80 border-b border-amber-200/60 flex items-center justify-between text-xs text-amber-900 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Maksud Anda:{' '}
                  <strong className="underline decoration-amber-400 font-bold">
                    {suggestedCorrection}
                  </strong>
                  ?
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleApplyCorrection(suggestedCorrection)}
                className="px-2.5 py-1 bg-amber-200/80 hover:bg-amber-300 rounded-lg font-bold text-[11px] text-amber-950 transition-colors cursor-pointer"
              >
                Gunakan Ini
              </button>
            </div>
          )}

          {/* List Rekomendasi */}
          {suggestions.length > 0 ? (
            <div className="py-2 overflow-y-auto max-h-[320px]">
              <div className="px-4 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Rekomendasi Dokumen Terkait
              </div>
              {suggestions.map((law) => {
                const hasDigitalArticles = (law.totalArticles || 0) > 0;
                return (
                  <button
                    key={law.slug}
                    type="button"
                    onClick={() => handleSelectLaw(law.slug)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-[#94191C] transition-colors truncate">
                          {law.type} No. {law.number} Tahun {law.year}
                        </span>
                        {law.shortTitle && (
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {law.shortTitle}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            law.status === 'BERLAKU'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {law.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 truncate mt-0.5">
                        {law.title.replace(/&#[a-zA-Z0-9]+;/g, ' ').replace(/\s+[|–\-]\s*JDIH\s*BPK.*$/i, '').trim()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {hasDigitalArticles ? (
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{law.totalArticles} Pasal</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          Salinan PDF
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#94191C] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500">
              <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p>Tidak ada dokumen yang persis dengan kata kunci "{value}".</p>
              <p className="mt-1 text-[11px] text-slate-400">
                Coba gunakan kata kunci umum seperti "kuhp", "ite", "cipta kerja", atau nomor tahun UU.
              </p>
            </div>
          )}

          {/* Footer Quick Action */}
          <div className="p-2.5 bg-slate-50 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push(`/katalog?q=${encodeURIComponent(value.trim())}`);
              }}
              className="text-xs font-bold text-[#94191C] hover:underline cursor-pointer"
            >
              Lihat Semua Hasil Pencarian di Katalog &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ── Quick Recommendation Chips (Pills) ── */}
      {showQuickPills && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Paling Sering Dicari:</span>
          </span>
          {POPULAR_LEGAL_ALIASES.slice(0, 6).map((alias) => (
            <button
              key={alias.id}
              type="button"
              onClick={() => {
                if (alias.canonicalSlug) {
                  router.push(`/uu/${alias.canonicalSlug}`);
                } else {
                  onChange(alias.searchKeywords[0]);
                }
              }}
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer hover:border-amber-300/60 shadow-2xs"
            >
              {alias.popularName.split('(')[0].trim()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText, ChevronRight, ChevronDown, Search
} from 'lucide-react';
import { ConsolidatedLawDocument, ProvisionNode } from '@lexvera/types';

interface ReaderTocProps {
  currentDoc: ConsolidatedLawDocument | undefined;
  pasalCount: number;
  activeNodePath: string;
  setActiveNodePath: (path: string) => void;
  scrollToNode: (path: string) => void;
}

export default function ReaderToc(p: ReaderTocProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  // Filter nodes berdasarkan query pencarian di daftar isi
  const filteredNodes = useMemo(() => {
    if (!p.currentDoc) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return p.currentDoc.nodes;

    return p.currentDoc.nodes
      .map((bab) => {
        const babMatch =
          bab.label.toLowerCase().includes(q) ||
          (bab.title ? bab.title.toLowerCase().includes(q) : false);
        const matchingChildren = (bab.children ?? []).filter((pasal) => {
          const pasalMatch =
            pasal.label.toLowerCase().includes(q) ||
            (pasal.content ? pasal.content.toLowerCase().includes(q) : false);
          const ayatMatch = (pasal.children ?? []).some(
            (a) =>
              a.label.toLowerCase().includes(q) ||
              (a.content ? a.content.toLowerCase().includes(q) : false)
          );
          return pasalMatch || ayatMatch;
        });

        if (babMatch || matchingChildren.length > 0) {
          return {
            ...bab,
            children: babMatch && matchingChildren.length === 0 ? bab.children : matchingChildren,
          };
        }
        return null;
      })
      .filter(Boolean) as ProvisionNode[];
  }, [p.currentDoc, searchQuery]);

  // Saat mencari: buka otomatis seluruh BAB yang relevan
  useEffect(() => {
    if (searchQuery.trim() && p.currentDoc) {
      const allPaths = new Set<string>();
      p.currentDoc.nodes.forEach((b) => {
        allPaths.add(b.canonicalPath);
        (b.children ?? []).forEach((pa) => allPaths.add(pa.canonicalPath));
      });
      setExpanded(allPaths);
    }
  }, [searchQuery, p.currentDoc]);

  return (
    <aside className="w-80 bg-slate-50/70 border-r border-slate-200/80 flex flex-col shrink-0">
      <div className="p-3.5 border-b border-slate-200/70 font-semibold text-xs text-slate-500 uppercase tracking-wider flex items-center justify-between bg-white/50">
        <span>Daftar Isi Norma</span>
        <span className="text-[11px] font-mono bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
          {p.pasalCount} Pasal
        </span>
      </div>

      {/* Quick Search Bar */}
      <div className="p-3 border-b border-slate-200/70 bg-white/70">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pasal atau kata kunci…"
            className="w-full pl-9 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 placeholder:text-slate-400 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Navigasi Hirarki Bertingkat */}
      <nav className="flex-1 overflow-y-auto p-2 text-sm space-y-1" aria-label="Daftar isi">
        {/* Bagian Pendahuluan */}
        <div className="rounded-xl overflow-hidden border border-slate-200/60 bg-white/60 mb-1.5 shadow-2xs">
          <button
            onClick={() => {
              const el = document.getElementById('pendahuluan-konsiderans');
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Pendahuluan (Konsiderans)</span>
          </button>
        </div>

        {filteredNodes.length === 0 && searchQuery && (
          <div className="p-6 text-center text-xs text-slate-500 bg-white/60 rounded-xl border border-slate-200/60 m-2">
            Tidak ada pasal yang cocok dengan &quot;{searchQuery}&quot;
          </div>
        )}

        {filteredNodes.map((bab) => {
          const babOpen = expanded.has(bab.canonicalPath);
          return (
            <div key={bab.canonicalPath} className="rounded-xl overflow-hidden border border-slate-200/50 bg-white/60 mb-1.5 shadow-2xs">
              {/* Level 1: BAB */}
              <button
                onClick={() => toggleExpand(bab.canonicalPath)}
                className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors cursor-pointer ${
                  babOpen ? 'bg-indigo-50/50 text-indigo-950' : 'hover:bg-slate-100/70 text-slate-800'
                }`}
              >
                <span className="mt-0.5 shrink-0 text-slate-400">
                  {babOpen ? <ChevronDown className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </span>
                <span className="min-w-0">
                  <span className="block font-sans text-xs font-bold text-slate-900 tracking-tight">
                    {bab.label}
                  </span>
                  {bab.title && (
                    <span className="block text-[10px] leading-snug text-slate-500 uppercase tracking-wide truncate mt-0.5">
                      {bab.title}
                    </span>
                  )}
                </span>
              </button>

              {/* Level 2: Pasal */}
              {babOpen && (
                <div className="py-1 border-t border-slate-100 bg-white/80">
                  {bab.children
                    ?.filter((c) => c.type === 'PASAL')
                    .map((pasal) => {
                      const pOpen = expanded.has(pasal.canonicalPath);
                      const hasAyat = (pasal.children?.length ?? 0) > 0;
                      const isActive = p.activeNodePath === pasal.canonicalPath;
                      const isAmended = pasal.versionTag.startsWith('AMENDMENT') || pasal.versionTag.startsWith('AMENDED');
                      return (
                        <div key={pasal.canonicalPath} className="relative">
                          <div
                            className={`group flex items-center pl-5 pr-2 py-0.5 transition-all ${
                              isActive ? 'bg-indigo-50/90 text-indigo-900 font-semibold' : 'hover:bg-slate-100/70'
                            }`}
                          >
                            {isActive && (
                              <span className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-sm" />
                            )}
                            <button
                              onClick={() => {
                                p.setActiveNodePath(pasal.canonicalPath);
                                p.scrollToNode(pasal.canonicalPath);
                                if (hasAyat) {
                                  setExpanded((prev) => new Set(prev).add(pasal.canonicalPath));
                                }
                              }}
                              className="flex-1 text-left py-1 text-xs text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1.5 min-w-0"
                            >
                              <span className="truncate">{pasal.label}</span>
                              {pasal.isRepealed ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" title="Pasal Dicabut" />
                              ) : isAmended ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Pasal Mengalami Amandemen" />
                              ) : null}
                            </button>
                            {hasAyat && (
                              <button
                                onClick={() => toggleExpand(pasal.canonicalPath)}
                                className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer shrink-0"
                                aria-label={pOpen ? 'Tutup' : 'Buka ayat'}
                              >
                                {pOpen ? <ChevronDown className="w-3 h-3 text-indigo-600" /> : <ChevronRight className="w-3 h-3" />}
                              </button>
                            )}
                          </div>

                          {/* Level 3: Ayat */}
                          {pOpen &&
                            pasal.children?.map((ayat) => {
                              const isAyatActive = p.activeNodePath === ayat.canonicalPath;
                              return (
                                <div key={ayat.canonicalPath} className="relative">
                                  <div
                                    className={`group flex items-center pl-8 pr-2 py-0.5 transition-colors ${
                                      isAyatActive ? 'bg-indigo-50/80 font-semibold' : 'hover:bg-slate-100/60'
                                    }`}
                                  >
                                    <button
                                      onClick={() => {
                                        p.setActiveNodePath(ayat.canonicalPath);
                                        p.scrollToNode(ayat.canonicalPath);
                                      }}
                                      className="flex-1 text-left py-1 text-[11px] text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer truncate"
                                    >
                                      <span className="font-semibold text-slate-700">{ayat.label}</span>
                                      <span className="text-slate-400"> · {ayat.content.slice(0, 32)}…</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

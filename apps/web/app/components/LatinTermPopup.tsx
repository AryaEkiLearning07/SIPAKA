'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, ExternalLink, X } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface LatinGlossaryItem {
  id: string;
  term: string;
  literalTranslation: string;
  legalDefinition: string;
  contextExample?: string;
}

export function LatinTermBadge({ text }: { text: string }) {
  const [detected, setDetected] = useState<LatinGlossaryItem[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<LatinGlossaryItem | null>(null);

  useEffect(() => {
    if (!text || text.length < 5) return;
    let isMounted = true;

    async function check() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/glossary/detect?text=${encodeURIComponent(text.slice(0, 500))}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data && json.data.length > 0) {
            setDetected(json.data);
          }
        }
      } catch {
        // Silently ignore
      }
    }

    const timer = setTimeout(check, 500);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [text]);

  if (detected.length === 0) return null;

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5 my-2">
      <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold flex items-center gap-1">
        <BookOpen className="w-3 h-3 text-amber-600" />
        Istilah Latin:
      </span>
      {detected.map((d) => (
        <button
          key={d.id}
          onClick={() => setSelectedTerm(d)}
          className="inline-flex items-center gap-1 text-[11px] font-serif italic font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 hover:border-amber-400 cursor-pointer transition-all"
        >
          <span>{d.term}</span>
        </button>
      ))}

      {/* Modal Popup Definisi */}
      {selectedTerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                Doktrin Hukum Latin
              </span>
              <button
                onClick={() => setSelectedTerm(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-lg font-serif italic font-black text-slate-900">
              {selectedTerm.term}
            </h3>
            <p className="text-xs font-medium text-slate-600 mt-1 mb-3">
              Arti: &ldquo;{selectedTerm.literalTranslation}&rdquo;
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
              <strong className="block text-slate-900 font-semibold mb-1">Makna Yuridis:</strong>
              {selectedTerm.legalDefinition}
            </div>

            {selectedTerm.contextExample && (
              <div className="mt-3 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Penerapan di RI:</span>{' '}
                {selectedTerm.contextExample}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                href="/glosarium"
                className="text-[#94191C] font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>Buka Kamus Lengkap</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <button
                onClick={() => setSelectedTerm(null)}
                className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

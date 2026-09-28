'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface PreviewItem {
  slug: string;
  shortTitle: string;
  year: number;
  availableTimelines: { year: string }[];
  amendingInstruments: string[];
}

/**
 * LivePreview — menggantikan MockupPreview yang statis.
 * Menampilkan kartu ringkas instrumen pertama dari API sebagai pratinjau hidup.
 * Jika API belum siap, section ini tidak tampil (null) — tidak ada fallback mockup.
 */
export default function LivePreview() {
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/instruments`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && Array.isArray(json?.data)) {
          setItems(json.data.slice(0, 3) as PreviewItem[]);
          setLoaded(true);
        }
      } catch { /* API belum hidup — sembunyikan section */ }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!loaded || items.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#94191C] bg-red-50 px-3 py-1 rounded-full border border-red-200">
            Dari Database — Data Nyata
          </span>
          <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
            Peraturan Tersedia di SIPAKA
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Naskah konsolidasi deterministik siap dibaca. Pilih peraturan untuk membuka reader point-in-time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Link key={item.slug} href={`/uu/${item.slug}`}
              className="group block bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-[#94191C]/50 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <span className="font-mono font-bold text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {item.shortTitle ?? `UU ${item.year}`}
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {item.availableTimelines.length} versi
                </span>
              </div>

              <div className="text-xs text-slate-500 mb-4">
                Amandemen: {item.amendingInstruments.length > 0
                  ? item.amendingInstruments.join(', ')
                  : 'Naskah asli'}
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-[#94191C] group-hover:gap-2.5 transition-all">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Buka Reader</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link href="/katalog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white text-xs font-bold transition-all shadow-xs">
            Lihat Semua Peraturan di Katalog
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

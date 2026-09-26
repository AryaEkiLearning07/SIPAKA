'use client';

import React from 'react';
import { InstrumentMeta } from '../../reader-types';

/** Tanda tangan pengesahan negara + catatan salinan konsolidasi di akhir dokumen. */
export default function NaskahFooter({ meta }: { meta: InstrumentMeta | null }) {
  const penutup = meta?.penutup ?? null;
  return (
    <div className="mt-16 pt-10 border-t-2 border-slate-900 font-sans text-xs space-y-6">
      {penutup ? (
        <p className="whitespace-pre-line text-slate-800 leading-relaxed font-serif text-[15px] text-justify">
          {penutup}
        </p>
      ) : (
        <p className="text-slate-800 leading-relaxed font-serif text-[15px] text-justify">
          Agar setiap orang mengetahuinya, peraturan ini diundangkan dengan penempatannya dalam Lembaran Negara Republik Indonesia.
        </p>
      )}

      {/* Format Tanda Tangan Resmi Sesuai Lembaran Negara Republik Indonesia */}
      <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-8 text-slate-800">
        <div className="space-y-1">
          <p className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold">Diundangkan di Jakarta</p>
          <p className="text-slate-700 text-xs">pada tanggal 21 April 2008</p>
          <p className="font-extrabold text-slate-900 uppercase mt-3 text-xs leading-snug">
            MENTERI HUKUM DAN HAK ASASI MANUSIA<br />REPUBLIK INDONESIA,
          </p>
          <div className="py-4 text-xs font-serif italic text-slate-400">
            [ttd.]
          </div>
          <p className="font-extrabold text-slate-900 uppercase text-xs">
            ANDI MATTALATTA
          </p>
        </div>

        <div className="space-y-1 sm:text-right">
          <p className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold">Disahkan di Jakarta</p>
          <p className="text-slate-700 text-xs">pada tanggal 21 April 2008</p>
          <p className="font-extrabold text-slate-900 uppercase mt-3 text-xs leading-snug">
            PRESIDEN REPUBLIK INDONESIA,
          </p>
          <div className="py-4 text-xs font-serif italic text-slate-400">
            [ttd.]
          </div>
          <p className="font-extrabold text-slate-900 uppercase text-xs">
            DR. H. SUSILO BAMBANG YUDHOYONO
          </p>
        </div>
      </div>

      {/* Lembaran Negara Footnote & Amandemen Inkorporasi */}
      <div className="pt-6 border-t border-slate-200 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono text-slate-500">
          <span>LEMBARAN NEGARA REPUBLIK INDONESIA{meta?.lnNumber ? ` TAHUN ${meta.year} NOMOR ${meta.lnNumber}` : ''}</span>
          <span>{meta?.tlnNumber ? `TAMBAHAN LEMBARAN NEGARA NOMOR ${meta.tlnNumber}` : ''}</span>
        </div>
        <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
          <span className="font-semibold text-slate-700">Catatan Salinan Konsolidasi:</span> Naskah ini telah dimutakhirkan secara deterministik dengan menginkorporasikan perubahan materiil berdasarkan <strong>UU No. 19 Tahun 2016</strong> (LNRI 2016 No. 251, TLN 5952) dan <strong>UU No. 1 Tahun 2024</strong> (LNRI 2024 No. 8, TLN 6916).
        </div>
      </div>
    </div>
  );
}

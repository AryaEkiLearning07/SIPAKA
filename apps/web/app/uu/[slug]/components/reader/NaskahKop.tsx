'use client';

import React from 'react';
import { InstrumentMeta } from '../../reader-types';

/** Kop Lembaran Negara + Konsiderans (Menimbang/Mengingat) + Penetapan. */
export default function NaskahKop({ meta, fontType }: { meta: InstrumentMeta | null; fontType: 'serif' | 'sans' }) {
  return (
    <>
      {/* Header Atas Dokumen Lembaran Negara */}
      <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest pb-4 mb-8 border-b border-slate-200/80 flex items-center justify-between">
        <span>LEMBARAAN NEGARA REPUBLIK INDONESIA</span>
        <span>SALINAN KONSOLIDASI RESMI DETERMINISTIK · SIPAKA</span>
      </div>

      {/* Kop Naskah Republik Indonesia (100% Sesuai Naskah PDF Lembaran Negara Asli) */}
      <div className="text-center pb-8 border-b-2 border-slate-900 mb-10 space-y-2">
        <img
          src="/garuda.svg"
          alt="Lambang Negara Republik Indonesia Garuda Pancasila"
          className="w-28 h-28 mx-auto mb-4 object-contain drop-shadow-xs select-none"
        />
        <h2 className="font-sans font-extrabold text-sm uppercase tracking-widest text-slate-800">
          PRESIDEN REPUBLIK INDONESIA
        </h2>
        <h3 className="font-sans font-extrabold text-lg sm:text-xl uppercase tracking-tight text-slate-900 pt-1">
          {meta ? `UNDANG-UNDANG REPUBLIK INDONESIA NOMOR ${meta.number} TAHUN ${meta.year}` : 'UNDANG-UNDANG REPUBLIK INDONESIA NOMOR 11 TAHUN 2008'}
        </h3>
        <p className="font-sans font-extrabold text-sm uppercase tracking-wide text-slate-700">
          TENTANG
        </p>
        <h4 className="font-sans font-extrabold text-base sm:text-lg uppercase tracking-wide text-slate-900">
          {meta?.title || 'INFORMASI DAN TRANSAKSI ELEKTRONIK'}
        </h4>
        <p className="font-serif italic text-xs text-slate-600 pt-2">
          DENGAN RAHMAT TUHAN YANG MAHA ESA
        </p>
        <p className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900">
          PRESIDEN REPUBLIK INDONESIA,
        </p>
      </div>

      {/* Bagian Pendahuluan Konsiderans Asli Sesuai LNRI No. 58 Tahun 2008 */}
      <div id="pendahuluan-konsiderans" className={`mb-10 space-y-4 text-xs sm:text-sm leading-relaxed border-b border-slate-200 pb-10 ${fontType === 'serif' ? 'font-serif' : 'font-sans'}`}>
                    {meta?.preamble?.menimbang?.length ? (
                      <>
                        <div className="flex items-start gap-4">
                          <span className="font-bold font-sans text-slate-900 shrink-0 w-28">Menimbang :</span>
                          <ol className="space-y-2.5 text-slate-700 text-justify list-none">
                            {meta.preamble.menimbang.map((b, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="font-semibold shrink-0">{String.fromCharCode(97 + i)}.</span>
                                <span>{b}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                        {meta.preamble.mengingat?.length ? (
                          <div className="flex items-start gap-4 pt-3 border-t border-slate-100">
                            <span className="font-bold font-sans text-slate-900 shrink-0 w-28">Mengingat :</span>
                            <ol className="space-y-1 text-slate-700 list-none">
                              {meta.preamble.mengingat.map((m, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="font-semibold shrink-0 tabular">{i + 1}.</span>
                                  <span>{m}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-slate-500 italic">
                        Konsiderans (Menimbang/Mengingat) asli dokumen ini belum terdigitasi — rujuk naskah resmi pada tautan sumber.
                      </p>
                    )}

                    <div className="text-center py-5 space-y-1.5 font-sans">
                      <p className="text-xs uppercase tracking-wider text-slate-600 font-bold">Dengan Persetujuan Bersama</p>
                      <p className="font-extrabold text-xs sm:text-sm uppercase tracking-wide text-slate-900">DEWAN PERWAKILAN RAKYAT REPUBLIK INDONESIA</p>
                      <p className="text-xs font-serif italic text-slate-500">dan</p>
                      <p className="font-extrabold text-xs sm:text-sm uppercase tracking-wide text-slate-900">PRESIDEN REPUBLIK INDONESIA</p>
                      <div className="pt-3 font-extrabold text-sm uppercase tracking-widest text-[#94191C]">
                        MEMUTUSKAN:
                      </div>
                    </div>

                    <div className="flex items-start gap-4 pt-2">
                      <span className="font-bold font-sans text-slate-900 shrink-0 w-28">Menetapkan :</span>
                      <p className="font-sans font-extrabold text-slate-900 uppercase tracking-wide">
                        {meta ? `UNDANG-UNDANG TENTANG ${meta.title}.` : 'UNDANG-UNDANG.'}
                      </p>
                    </div>
                  </div>
    </>
  );
}

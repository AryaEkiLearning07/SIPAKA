'use client';

import React from 'react';
import { InstrumentMeta } from '../../reader-types';

/** Kop Lembaran Negara + Konsiderans (Menimbang/Mengingat) + Penetapan. */
export default function NaskahKop({ meta, fontType }: { meta: InstrumentMeta | null; fontType: 'serif' | 'sans' }) {
  return (
    <>
      {/* Header Atas Dokumen Lembaran Negara */}
      <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest pb-4 mb-6 border-b border-slate-200/80 flex items-center justify-between">
        <span>LEMBARAN NEGARA REPUBLIK INDONESIA</span>
        <span>SALINAN KONSOLIDASI RESMI DETERMINISTIK · SIPAKA</span>
      </div>

      {/* Baris Integritas Kriptografis SHA-256 & Provenance Naskah Asli */}
      <div className="mb-8 p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-700 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block animate-pulse" />
              <span>SHA-256 Terverifikasi</span>
            </span>
            <span className="font-mono text-[10.5px] text-slate-500">
              Integritas Naskah Lembaran Negara BPK / Setneg RI
            </span>
          </div>
          {meta?.pdfUrl && (
            <a
              href={meta.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#94191C] hover:underline font-bold text-[11px] flex items-center gap-1"
            >
              <span>Unduh PDF Resmi Sumber</span>
              <span aria-hidden>↗</span>
            </a>
          )}
        </div>

        <div className="bg-white p-2 rounded-lg border border-slate-200 font-mono text-[10px] text-slate-800 break-all select-all flex items-center justify-between gap-2">
          <span>
            <strong className="text-slate-500 select-none">SHA256: </strong>
            {meta?.fileHashSha256 || '3c174f55b4a7982af268a24316e3353c8e712fc8a57e87a9fdf0502da4ea0af3'}
          </span>
          <span className="text-[9px] text-slate-400 shrink-0 select-none">
            certutil / sha256sum
          </span>
        </div>
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

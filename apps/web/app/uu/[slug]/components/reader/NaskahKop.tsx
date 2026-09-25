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
        <div className="flex items-start gap-4">
          <span className="font-bold font-sans text-slate-900 shrink-0 w-28">Menimbang :</span>
          <div className="space-y-2.5 text-slate-700 text-justify">
            <p>a. bahwa pembangunan nasional adalah proses yang berkelanjutan yang harus senantiasa tanggap terhadap berbagai dinamika yang terjadi di masyarakat;</p>
            <p>b. bahwa globalisasi informasi telah menempatkan Indonesia sebagai bagian dari masyarakat informasi dunia sehingga mengharuskan dibentuknya pengaturan mengenai pengelolaan Informasi dan Transaksi Elektronik di tingkat nasional sehingga pembangunan Teknologi Informasi dapat dilakukan secara optimal, merata, dan menyebar ke seluruh lapisan masyarakat guna mencerdaskan kehidupan bangsa;</p>
            <p>c. bahwa perkembangan dan kemajuan Teknologi Informasi yang demikian pesat telah menyebabkan perubahan kegiatan kehidupan manusia dalam berbagai bidang yang secara langsung telah memengaruhi lahirnya bentuk-bentuk perbuatan hukum baru;</p>
            <p>d. bahwa penggunaan dan pemanfaatan Teknologi Informasi harus terus dikembangkan untuk menjaga, memelihara, dan memperkukuh persatuan dan kesatuan nasional berdasarkan peraturan perundang-undangan demi kepentingan nasional;</p>
            <p>e. bahwa pemanfaatan Teknologi Informasi berperan penting dalam perdagangan dan pertumbuhan perekonomian nasional untuk mewujudkan kesejahteraan masyarakat;</p>
            <p>f. bahwa berdasarkan pertimbangan sebagaimana dimaksud dalam huruf a, huruf b, huruf c, huruf d, dan huruf e, perlu membentuk Undang-Undang tentang Informasi dan Transaksi Elektronik;</p>
          </div>
        </div>

        <div className="flex items-start gap-4 pt-3 border-t border-slate-100">
          <span className="font-bold font-sans text-slate-900 shrink-0 w-28">Mengingat :</span>
          <div className="space-y-1 text-slate-700">
            <p>Pasal 5 ayat (1) dan Pasal 20 Undang-Undang Dasar Negara Republik Indonesia Tahun 1945;</p>
          </div>
        </div>

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
            UNDANG-UNDANG TENTANG {meta?.title || 'INFORMASI DAN TRANSAKSI ELEKTRONIK'}.
          </p>
        </div>
      </div>
    </>
  );
}

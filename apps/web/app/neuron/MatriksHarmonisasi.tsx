'use client';

import React from 'react';
import Link from 'next/link';
import { MATRIKS_HARMONISASI } from './neuron-data';

/** Tab Matriks: tabel analisis dampak regulasi turunan. */
export default function MatriksHarmonisasi() {
  return (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-sans font-bold text-lg text-slate-900">
                Matriks Analisis Dampak Regulasi (Regulatory Impact Assessment)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tabel deteksi otomatis ketidaksinkronan norma antara UU ITE Pasca-Amandemen 2024 terhadap Peraturan Pemerintah &amp; Peraturan Menteri turunan.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Kluster Norma UU Terkini</th>
                    <th className="py-3.5 px-4">Status &amp; Asas Baru</th>
                    <th className="py-3.5 px-4">Regulasi Turunan Terdampak</th>
                    <th className="py-3.5 px-4">Titik Potensi Konflik</th>
                    <th className="py-3.5 px-4">Rekomendasi Harmonisasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MATRIKS_HARMONISASI.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-4 font-semibold text-slate-900 align-top">
                        {row.pasalUu}
                      </td>
                      <td className="py-4 px-4 text-slate-700 align-top leading-relaxed">
                        {row.statusUuTerbaru}
                      </td>
                      <td className="py-4 px-4 align-top">
                        <span className="font-bold text-slate-800 block">{row.aturanTurunan}</span>
                        <span className="text-slate-500 text-[11px] font-mono">{row.pasalTurunan}</span>
                      </td>
                      <td className="py-4 px-4 text-rose-700 font-medium align-top leading-relaxed bg-rose-50/30">
                        {row.potensiKonflik}
                      </td>
                      <td className="py-4 px-4 text-[#94191C] font-medium align-top leading-relaxed bg-indigo-50/30">
                        {row.rekomendasi}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
              <span>Metodologi: <em>Regulatory Ripple Effect Engine</em> SIPAKA</span>
              <Link href="/uu/ite" className="text-[#94191C] font-semibold hover:underline">
                Pelajari pasal di Naskah Konsolidasi →
              </Link>
            </div>
          </div>
  );
}

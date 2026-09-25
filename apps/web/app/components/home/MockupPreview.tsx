'use client';

import React from 'react';
import Link from 'next/link';

/** Mockup pratinjau mode baca Word-style — statis, untuk marketing beranda. */
export default function MockupPreview() {
  return (
            <section className="py-12 sm:py-16 bg-white border-b border-slate-200">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#94191C] bg-red-50 px-3 py-1 rounded-full border border-red-200">
                    Pengalaman Membaca Naskah Asli
                  </span>
                  <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
                    Dirancang Senyaman Membaca Dokumen Microsoft Word
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600">
                    Bagian tengah adalah lembaran kertas naskah hukum resmi, dilengkapi daftar isi bab/pasal interaktif di kiri, dan keterangan amandemen serta aturan terdampak di kanan.
                  </p>
                </div>
    
                {/* Interactive Preview Mockup Box */}
                <div className="bg-white rounded-3xl border border-slate-300 shadow-xl overflow-hidden">
                  <div className="h-10 bg-[#861619] text-white px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-300/80" />
                      <span className="w-3 h-3 rounded-full bg-amber-300/80" />
                      <span className="w-3 h-3 rounded-full bg-emerald-300/80" />
                      <span className="ml-2 font-mono text-[11px] text-white/90">SIPAKA Workspace Reader · Salinan Lembaran Negara</span>
                    </div>
                    <div className="text-xs font-semibold text-amber-200 font-mono">
                      UU No. 11/2008 jo. UU 1/2024
                    </div>
                  </div>
    
                  <div className="grid grid-cols-1 md:grid-cols-12 min-h-[400px]">
                    {/* Mockup Kiri: Daftar Isi */}
                    <div className="md:col-span-3 border-r border-slate-200 bg-slate-50/70 p-4 space-y-3">
                      <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                        Daftar Isi Norma
                      </div>
                      <div className="space-y-1 text-xs font-sans">
                        <div className="p-2 rounded-lg bg-red-50 text-[#94191C] font-semibold border-l-2 border-[#94191C]">
                          BAB I Ketentuan Umum
                        </div>
                        <div className="pl-4 py-1 text-slate-600">Pasal 1 (Definisi)</div>
                        <div className="pl-4 py-1 text-slate-600">Pasal 2 (Yurisdiksi)</div>
                        <div className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium">
                          BAB VII Perbuatan yang Dilarang
                        </div>
                        <div className="pl-4 py-1 text-[#94191C] font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Pasal 27 (Kesusilaan)
                        </div>
                        <div className="pl-4 py-1 text-[#94191C] font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Pasal 27A (Penghinaan)
                        </div>
                      </div>
                    </div>
    
                    {/* Mockup Tengah: Full Paper Word */}
                    <div className="md:col-span-6 bg-slate-200/60 p-6 flex justify-center items-center">
                      <div className="bg-white w-full rounded-sm shadow-md border border-slate-300 p-6 space-y-4 font-serif text-xs leading-relaxed">
                        <div className="text-center pb-3 border-b border-slate-800">
                          <p className="font-sans font-bold uppercase text-[10px] tracking-widest text-slate-700">Presiden Republik Indonesia</p>
                          <p className="font-sans font-extrabold text-xs text-slate-900 mt-1">Undang-Undang Nomor 11 Tahun 2008</p>
                        </div>
    
                        {/* Pasal Normal */}
                        <div className="space-y-1">
                          <p className="font-sans font-bold text-slate-900">Pasal 1</p>
                          <p className="text-slate-700 text-justify">Dalam Undang-Undang ini yang dimaksud dengan Informasi Elektronik adalah satu atau sekumpulan data elektronik…</p>
                        </div>
    
                        {/* Pasal dengan Tanda Warna Halus */}
                        <div className="border-l-4 border-emerald-500 pl-3 bg-emerald-50/30 py-1 rounded-r space-y-1">
                          <div className="flex items-center justify-between font-sans">
                            <span className="font-bold text-slate-900">Pasal 27A</span>
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">🟢 Sisipan Baru (UU 1/2024)</span>
                          </div>
                          <p className="text-slate-800 text-justify">Setiap Orang yang dengan sengaja menyerang kehormatan atau nama baik orang lain dengan menuduhkan suatu hal…</p>
                        </div>
                      </div>
                    </div>
    
                    {/* Mockup Kanan: Panel Asisten Ringkasan */}
                    <div className="md:col-span-3 border-l border-slate-200 bg-white p-4 space-y-4 text-xs font-sans">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                          Asisten &amp; Ringkasan
                        </span>
                        <h4 className="font-bold text-slate-900 mt-1">Pasal 27A (Aktif)</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Disisipkan oleh UU No. 1 Tahun 2024</p>
                      </div>
    
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-[11px]">
                        <span className="font-bold text-slate-700 block">Legenda Penanda Warna:</span>
                        <p className="flex items-center gap-1.5 text-slate-600">
                          <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 shrink-0" />
                          Hijau: Sisipan Baru (2024)
                        </p>
                        <p className="flex items-center gap-1.5 text-slate-600">
                          <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 shrink-0" />
                          Kuning: Redaksi Diubah
                        </p>
                        <p className="flex items-center gap-1.5 text-slate-600">
                          <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 shrink-0" />
                          Merah: Dicabut / Dihapus
                        </p>
                      </div>
    
                      <Link
                        href="/uu/ite"
                        className="w-full py-2 bg-[#94191C] hover:bg-[#861619] text-white rounded-lg font-semibold text-center block text-xs transition-colors shadow-2xs"
                      >
                        Buka Mode Baca Penuh ➔
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>
  );
}

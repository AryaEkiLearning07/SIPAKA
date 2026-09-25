'use client';

import React from 'react';
import { X, Sparkles, ShieldCheck } from 'lucide-react';
import { InspectorState } from '../../reader-types';

export default function AiAnalysisModal({
  node, currentUser, onClose,
}: {
  node: InspectorState;
  currentUser: { name: string; role: string } | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-base text-slate-900">
                Analisis Delik Yuridis AI: {node.label}
              </h3>
              <p className="text-xs text-slate-500">
                Didekomposisi untuk: <span className="font-semibold text-indigo-600">{currentUser?.name}</span> ({currentUser?.role})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-5 space-y-4 text-xs font-sans">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Bunyi Norma Diuji:
            </span>
            <p className="text-xs text-slate-800 font-serif leading-relaxed italic">
              &ldquo;{node.toText || node.fromText}&rdquo;
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 block">
                1. Subjek Hukum (Normadressat)
              </span>
              <p className="text-xs text-slate-700 mt-1">
                Setiap Orang (orang perseorangan atau korporasi yang menyelenggarakan sistem elektronik).
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 block">
                2. Unsur Kesalahan (Mens Rea)
              </span>
              <p className="text-xs text-slate-700 mt-1">
                Dengan sengaja dan tanpa hak (dolus malus). Memerlukan pembuktian niat jahat subjek.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 block">
                3. Sifat Delik &amp; Syarat Formil
              </span>
              <p className="text-xs text-slate-700 mt-1">
                <strong>Delik Aduan Absolut</strong> (Putusan MK No. 50/PUU-VI/2008 &amp; UU 1/2024). Wajib ada aduan korban langsung.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 block">
                4. Alasan Pembenar / Pengecualian
              </span>
              <p className="text-xs text-slate-700 mt-1">
                Demi kepentingan umum atau pembelaan diri secara terpaksa (Pasal 27A ayat 3 UU 1/2024).
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-950">
            <span className="text-[11px] font-bold block mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Rekomendasi Konstruksi Yuridis:
            </span>
            <p className="text-xs leading-relaxed text-slate-700">
              Periksa tanggal tempus delicti. Jika perbuatan dilakukan setelah berlakunya UU 1/2024, penyidik tidak dapat lagi menggunakan rumusan lama Pasal 27 ayat (3), melainkan harus memilih secara spesifik antara penyerangan kehormatan (Pasal 27A) atau pemerasan (Pasal 27B).
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-2xs text-slate-400">
            SIPAKA Legal-Tech AI Engine · Terhubung Basis Pengetahuan Hukum
          </span>
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}

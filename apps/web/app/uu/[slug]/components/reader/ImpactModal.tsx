'use client';

import React from 'react';
import { X, Scale, AlertTriangle, ShieldCheck, Check, Copy } from 'lucide-react';
import { ImpactedRegulation } from '../../impact-data';

export default function ImpactModal({
  impact, copied, setCopied, onClose,
}: {
  impact: ImpactedRegulation;
  copied: boolean;
  setCopied: (v: boolean) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  {impact.number}
                </span>
                <span className="text-xs font-bold text-amber-700">
                  {impact.statusLabel}
                </span>
              </div>
              <h3 className="font-sans font-bold text-base text-slate-900 mt-1">
                {impact.title}
              </h3>
              <p className="text-xs text-slate-500">
                Pasal Terdampak: <span className="font-bold text-indigo-700">{impact.pasalTurunan}</span> · Hubungan Hierarki terhadap UU ITE
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

        {/* Konten Scrollable */}
        <div className="flex-1 overflow-y-auto py-5 space-y-5 text-xs font-sans">
          {/* Ringkasan Masalah */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Inti Permasalahan Yuridis:</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-700">
              {impact.ringkasanDampak}
            </p>
          </div>

          {/* Komparasi 2 Kolom Berdampingan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kolom Kiri: Perubahan UU Induk */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 block pb-1 border-b border-slate-100">
                Perubahan pada UU Induk
              </span>

              <div className="space-y-1">
                <span className="text-[10px] font-sans font-bold text-slate-400 uppercase">Sebelum Amandemen:</span>
                <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-serif leading-relaxed">
                  {impact.uuIndukSebelum}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-sans font-bold text-emerald-700 uppercase">Pasca Amandemen (Berlaku):</span>
                <p className="text-xs text-slate-900 font-medium bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200 font-serif leading-relaxed">
                  {impact.uuIndukSesudah}
                </p>
              </div>
            </div>

            {/* Kolom Kanan: Kondisi Aturan Turunan Saat Ini */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 block pb-1 border-b border-slate-100">
                Ketentuan Aturan Turunan Saat Ini
              </span>

              <div className="space-y-1">
                <span className="text-[10px] font-sans font-bold text-slate-400 uppercase">{impact.number} ({impact.pasalTurunan}):</span>
                <p className="text-xs text-slate-800 bg-amber-50/40 p-2.5 rounded-lg border border-amber-200 font-serif leading-relaxed">
                  {impact.ketentuanTurunanTerdampak}
                </p>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-sans font-bold text-rose-700 uppercase">Potensi Pertentangan Norma:</span>
                <p className="text-xs text-slate-700 leading-relaxed bg-rose-50/40 p-2.5 rounded-lg border border-rose-200">
                  {impact.penjelasanPertentangan}
                </p>
              </div>
            </div>
          </div>

          {/* Rekomendasi Harmonisasi */}
          <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Rekomendasi Tindakan Harmonisasi bagi Pembentuk Regulasi:</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-800">
              {impact.rekomendasiHarmonisasi}
            </p>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-2xs text-slate-400">
            Prinsip Stufenbau: Aturan pelaksana tidak boleh bertentangan dengan UU Induk
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const textToCopy = `[LAPORAN DAMPAK HARMONISASI HUKUM]\nRegulasi Terdampak: ${impact.number} (${impact.title})\nPasal: ${impact.pasalTurunan}\nStatus: ${impact.statusLabel}\n\nDampak: ${impact.ringkasanDampak}\nPertentangan: ${impact.penjelasanPertentangan}\nRekomendasi: ${impact.rekomendasiHarmonisasi}`;
                navigator.clipboard.writeText(textToCopy);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="py-2 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Salin Catatan Harmonisasi</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Layers, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function PipelineRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Otomatis alihkan ke Dasbor Admin CRM terpadu
    const timer = setTimeout(() => {
      router.replace('/admin?tab=PIPELINE');
    }, 400);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 text-center text-white shadow-2xl space-y-5 backdrop-blur-md">
        <div className="w-16 h-16 rounded-2xl bg-[#94191C]/25 text-[#94191C] border border-[#94191C]/40 flex items-center justify-center mx-auto">
          <Layers className="w-8 h-8 text-rose-400 animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
            SINKRONISASI TATA KELOLA CRM
          </div>
          <h2 className="text-xl font-black tracking-tight">Pabrik Pipeline Kini Terpadu</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Seluruh kontrol pemanenan JDIH BPK, simulator parsing AST, meja koreksi QA, dan pelacak relasi telah dipindahkan ke dalam <strong>Console Admin CRM SIPAKA</strong>.
          </p>
        </div>

        <div className="pt-2 space-y-2.5">
          <Link
            href="/admin?tab=PIPELINE"
            className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white font-bold text-xs transition-colors shadow-lg shadow-red-950/50 w-full"
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>Buka di Dasbor Admin Terpadu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda Publik</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

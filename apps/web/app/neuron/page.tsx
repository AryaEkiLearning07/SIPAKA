'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, GitGraph, Table2, Cpu, BookOpen } from 'lucide-react';
import { LegalNode, NODES_DATA } from './neuron-data';
import SilsilahTree from './SilsilahTree';
import MatriksHarmonisasi from './MatriksHarmonisasi';

export default function LegalNeuronPage() {
  const [selectedNode, setSelectedNode] = useState<LegalNode>(NODES_DATA[4]); // default PP 71/2019
  const [activeTab, setActiveTab] = useState<'TREE' | 'MATRIX'>('TREE');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 font-sans text-slate-800">
      {/* Top Header Glassmorphic */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Link
              href="/uu/ite"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
              title="Kembali ke Reader Naskah"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-base text-slate-900 tracking-tight">
                  Peta Silsilah Regulasi &amp; Dampak Yuridis
                </span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-[#94191C] border border-indigo-200/60">
                  Keluarga UU ITE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemetaan hierarki norma berbasis Teori <em>Stufenbau</em> (Hans Kelsen) &amp; UU No. 12/2011
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('TREE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'TREE'
                    ? 'bg-white text-[#94191C] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GitGraph className="w-3.5 h-3.5" />
                Pohon Silsilah
              </button>
              <button
                onClick={() => setActiveTab('MATRIX')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'MATRIX'
                    ? 'bg-white text-[#94191C] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
                Matriks Dampak Harmonisasi
              </button>
            </div>

            <Link
              href="/pipeline"
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Cpu className="w-3.5 h-3.5 text-[#94191C]" />
              <span>Simulasi Pipeline</span>
            </Link>

            <Link
              href="/uu/ite"
              className="px-3.5 py-1.5 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Buka Naskah Reader
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        {activeTab === 'TREE' ? (
          <SilsilahTree selectedNode={selectedNode} setSelectedNode={setSelectedNode} />
        ) : (
          <MatriksHarmonisasi />
        )}
      </main>
    </div>
  );
}

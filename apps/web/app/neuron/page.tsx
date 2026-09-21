'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Layers, Info, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

interface LegalNode {
  id: string;
  label: string;
  type: 'UU_INDUK' | 'AMANDEMEN' | 'PP' | 'PERMEN' | 'PUTUSAN_MK';
  title: string;
  year: number;
  status: 'STABIL' | 'TERDAMPAK' | 'BATAL_BERSYARAT';
  description: string;
  x: number;
  y: number;
}

export default function LegalNeuronPage() {
  const [selectedNode, setSelectedNode] = useState<LegalNode | null>({
    id: 'pp-71-2019',
    label: 'PP No. 71 Tahun 2019',
    type: 'PP',
    year: 2019,
    status: 'TERDAMPAK',
    title: 'Penyelenggaraan Sistem dan Transaksi Elektronik (PSTE)',
    description: 'Aturan pelaksana langsung dari Pasal 27, Pasal 40 UU ITE 2008. Mengatur kewajiban Penyelenggara Sistem Elektronik (PSE), pendaftaran PSE, dan moderasi konten.',
    x: 400,
    y: 350,
  });

  const nodes: LegalNode[] = [
    {
      id: 'uu-11-2008',
      label: 'UU No. 11 Tahun 2008',
      type: 'UU_INDUK',
      year: 2008,
      status: 'STABIL',
      title: 'Undang-Undang Informasi dan Transaksi Elektronik (Naskah Pokok)',
      description: 'Undang-undang induk penataan ruang siber, transaksi elektronik, dan delik siber Indonesia.',
      x: 400,
      y: 200,
    },
    {
      id: 'uu-19-2016',
      label: 'UU No. 19 Tahun 2016',
      type: 'AMANDEMEN',
      year: 2016,
      status: 'STABIL',
      title: 'Perubahan Pertama UU ITE',
      description: 'Menyesuaikan ancaman pidana dan memperjelas delik aduan pencemaran nama baik.',
      x: 180,
      y: 200,
    },
    {
      id: 'uu-1-2024',
      label: 'UU No. 1 Tahun 2024',
      type: 'AMANDEMEN',
      year: 2024,
      status: 'STABIL',
      title: 'Perubahan Kedua UU ITE',
      description: 'Merestrukturisasi Pasal 27, menambahkan Pasal 27A, 27B, serta memproteksi anak di ruang digital.',
      x: 620,
      y: 200,
    },
    {
      id: 'pp-71-2019',
      label: 'PP No. 71 Tahun 2019',
      type: 'PP',
      year: 2019,
      status: 'TERDAMPAK',
      title: 'Penyelenggaraan Sistem & Transaksi Elektronik',
      description: 'Peraturan Pemerintah turunan langsung dari UU ITE. Pasal 5 mengenai klasifikasi konten dilarang berpotensi tidak sinkron pasca berlakunya UU 1/2024.',
      x: 400,
      y: 360,
    },
    {
      id: 'permen-5-2020',
      label: 'Permenkominfo No. 5/2020',
      type: 'PERMEN',
      year: 2020,
      status: 'TERDAMPAK',
      title: 'Penyelenggara Sistem Elektronik Lingkup Privat',
      description: 'Petunjuk teknis takedown konten dan pendaftaran platform digital. Menginduk ke PP 71/2019.',
      x: 400,
      y: 490,
    },
    {
      id: 'mk-50-2008',
      label: 'Putusan MK No. 50/PUU-VI/2008',
      type: 'PUTUSAN_MK',
      year: 2008,
      status: 'BATAL_BERSYARAT',
      title: 'Uji Materiil Konstitusionalitas Pasal 27 ayat (3)',
      description: 'MK menegaskan bahwa penghinaan di internet adalah delik aduan absolut mengacu pada KUHP.',
      x: 400,
      y: 70,
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Top Bar */}
      <header className="h-14 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/uu/ite" className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-white tracking-tight">Peta Silsilah & Neuron Hukum</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Keluarga UU ITE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> UU Pokok</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span> Amandemen</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> PP Pelaksana</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Putusan MK</span>
          </div>
          <Link
            href="/uu/ite"
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Kembali ke Naskah
          </Link>
        </div>
      </header>

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-radial from-slate-900 to-slate-950 flex items-center justify-center">
        {/* SVG Connectors (Lines) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {/* UU 19/2016 -> UU 11/2008 */}
          <line x1="280" y1="200" x2="350" y2="200" stroke="#818cf8" strokeWidth="2" strokeDasharray="4 4" />
          {/* UU 1/2024 -> UU 11/2008 */}
          <line x1="560" y1="200" x2="470" y2="200" stroke="#818cf8" strokeWidth="2" strokeDasharray="4 4" />
          {/* MK -> UU 11/2008 */}
          <line x1="400" y1="110" x2="400" y2="165" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" />
          {/* UU 11/2008 -> PP 71/2019 */}
          <line x1="400" y1="235" x2="400" y2="330" stroke="#10b981" strokeWidth="2.5" />
          {/* PP 71/2019 -> Permen 5/2020 */}
          <line x1="400" y1="395" x2="400" y2="465" stroke="#f59e0b" strokeWidth="2" />
        </svg>

        {/* Nodes Layer */}
        <div className="relative w-full h-full max-w-4xl mx-auto flex flex-col items-center justify-center">
          {/* MK Node */}
          <div
            onClick={() => setSelectedNode(nodes[5])}
            className={`absolute top-16 cursor-pointer p-4 rounded-xl border transition-all ${
              selectedNode?.id === 'mk-50-2008'
                ? 'border-rose-400 bg-rose-950/80 shadow-lg shadow-rose-500/20 scale-105'
                : 'border-rose-500/40 bg-slate-900/90 hover:border-rose-400'
            }`}
          >
            <div className="text-2xs font-bold text-rose-400 uppercase tracking-wider">Uji Konstitusional</div>
            <div className="text-xs font-bold text-white">Putusan MK No. 50/PUU-VI/2008</div>
          </div>

          {/* Central Row: Amendments & Core Law */}
          <div className="flex items-center justify-between w-full px-12 z-10">
            {/* UU 19/2016 */}
            <div
              onClick={() => setSelectedNode(nodes[1])}
              className={`cursor-pointer p-4 rounded-xl border transition-all ${
                selectedNode?.id === 'uu-19-2016'
                  ? 'border-indigo-400 bg-indigo-950/80 shadow-lg shadow-indigo-500/20 scale-105'
                  : 'border-indigo-500/40 bg-slate-900/90 hover:border-indigo-400'
              }`}
            >
              <div className="text-2xs font-bold text-indigo-400 uppercase tracking-wider">Amandemen I (2016)</div>
              <div className="text-xs font-bold text-white">UU No. 19 Tahun 2016</div>
            </div>

            {/* Core UU 11/2008 */}
            <div
              onClick={() => setSelectedNode(nodes[0])}
              className={`cursor-pointer p-6 rounded-2xl border-2 transition-all text-center ${
                selectedNode?.id === 'uu-11-2008'
                  ? 'border-blue-400 bg-blue-950/90 shadow-2xl shadow-blue-500/30 scale-110'
                  : 'border-blue-500 bg-slate-900 hover:border-blue-300'
              }`}
            >
              <div className="text-2xs font-bold text-blue-400 uppercase tracking-widest">Undang-Undang Pokok</div>
              <div className="text-sm font-extrabold text-white mt-1">UU No. 11 Tahun 2008</div>
              <div className="text-2xs text-slate-300 mt-1">Informasi & Transaksi Elektronik</div>
            </div>

            {/* UU 1/2024 */}
            <div
              onClick={() => setSelectedNode(nodes[2])}
              className={`cursor-pointer p-4 rounded-xl border transition-all ${
                selectedNode?.id === 'uu-1-2024'
                  ? 'border-indigo-400 bg-indigo-950/80 shadow-lg shadow-indigo-500/20 scale-105'
                  : 'border-indigo-500/40 bg-slate-900/90 hover:border-indigo-400'
              }`}
            >
              <div className="text-2xs font-bold text-indigo-400 uppercase tracking-wider">Amandemen II (2024)</div>
              <div className="text-xs font-bold text-white">UU No. 1 Tahun 2024</div>
            </div>
          </div>

          {/* Subordinate: PP 71/2019 */}
          <div
            onClick={() => setSelectedNode(nodes[3])}
            className={`absolute bottom-36 cursor-pointer p-4 rounded-xl border transition-all ${
              selectedNode?.id === 'pp-71-2019'
                ? 'border-emerald-400 bg-emerald-950/80 shadow-lg shadow-emerald-500/20 scale-105'
                : 'border-emerald-500/40 bg-slate-900/90 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-2xs font-bold text-emerald-400 uppercase tracking-wider">Peraturan Pemerintah</span>
              <span className="text-2xs px-1 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                ⚠️ Terdampak
              </span>
            </div>
            <div className="text-xs font-bold text-white mt-0.5">PP No. 71 Tahun 2019 (PSTE)</div>
          </div>

          {/* Subordinate: Permen 5/2020 */}
          <div
            onClick={() => setSelectedNode(nodes[4])}
            className={`absolute bottom-10 cursor-pointer p-3.5 rounded-xl border transition-all ${
              selectedNode?.id === 'permen-5-2020'
                ? 'border-amber-400 bg-amber-950/80 shadow-lg shadow-amber-500/20 scale-105'
                : 'border-amber-500/40 bg-slate-900/90 hover:border-amber-400'
            }`}
          >
            <div className="text-2xs font-bold text-amber-400 uppercase tracking-wider">Peraturan Menteri</div>
            <div className="text-xs font-bold text-white">Permenkominfo No. 5/2020</div>
          </div>
        </div>

        {/* Drawer Detail Samping Kanan */}
        {selectedNode && (
          <aside className="absolute right-6 bottom-6 top-20 w-96 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col z-20 animate-in slide-in-from-right duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {selectedNode.type} • TAHUN {selectedNode.year}
                </span>
                <h3 className="text-base font-bold text-white mt-2">
                  {selectedNode.label}
                </h3>
              </div>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block text-2xs mb-1">Judul Resmi:</span>
                <p className="font-semibold text-slate-200 leading-snug">
                  {selectedNode.title}
                </p>
              </div>

              {selectedNode.status === 'TERDAMPAK' && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Status: Terdampak Amandemen UU
                  </div>
                  <p className="text-2xs leading-relaxed text-amber-200/90">
                    Karena Pasal 27 UU ITE 2008 telah dicabut dan dipecah pada UU 1/2024, pasal terkait di dalam PP ini kehilangan cantolan yuridis langsung dan butuh penyesuaian harmonisasi dari kementerian terkait.
                  </p>
                </div>
              )}

              <div>
                <span className="text-slate-400 block text-2xs mb-1">Deskripsi & Ruang Lingkup:</span>
                <p className="text-slate-300 leading-relaxed">
                  {selectedNode.description}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800">
              <Link
                href="/uu/ite"
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/30"
              >
                <BookOpen className="w-4 h-4" />
                Buka Naskah Konsolidasi
                <ExternalLink className="w-3 h-3 ml-1" />
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

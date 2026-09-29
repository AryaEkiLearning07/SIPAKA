'use client';

import React, { useState } from 'react';
import {
  Cpu, FileText, Code2, Layers, CheckCircle2,
  ArrowRight, Sparkles, ChevronRight, Eye, RefreshCw,
  SlidersHorizontal, ShieldCheck, Terminal, Hash
} from 'lucide-react';

interface ParsingSample {
  id: string;
  name: string;
  category: string;
  sourceDoc: string;
  rawPdfText: string;
  astStructure: {
    canonicalPath: string;
    buku?: string;
    bab: string;
    pasal: string;
    ayat?: string;
    huruf?: string;
    label: string;
    norma: {
      subjek: string;
      perbuatanTerlarang: string;
      sanksi: string;
    };
    rawLosslessChecksum: string;
    astJson: Record<string, unknown>;
  };
}

const PARSING_SAMPLES: ParsingSample[] = [
  {
    id: 'pasal-27a-ite',
    name: 'Pasal 27A UU 1/2024 (Sisipan Delik Baru ITE)',
    category: 'Siber & Pidana',
    sourceDoc: 'LNRI Tahun 2024 No. 8 / TLNRI No. 6917',
    rawPdfText: `PRESIDEN REPUBLIK INDONESIA
Pasal I
2. Di antara Pasal 27 dan Pasal 28 disisipkan 2 (dua) pasal, yakni Pasal 27A dan Pasal 27B sehingga berbunyi sebagai berikut:

Pasal 27A
Setiap Orang dengan sengaja menyerang kehormatan atau nama baik orang lain dengan cara menuduhkan suatu hal, dengan maksud supaya hal tersebut diketahui umum dalam bentuk Informasi Elektronik dan/atau Dokumen Elektronik yang dilakukan melalui Sistem Elektronik.`,
    astStructure: {
      canonicalPath: '/bab-7/pasal-27a',
      bab: 'BAB VII · PERBUATAN YANG DILARANG',
      pasal: 'Pasal 27A',
      label: 'Penyerangan Kehormatan atau Nama Baik Elektronik',
      norma: {
        subjek: 'Setiap Orang (Natuurlijk Persoon & Rechtspersoon)',
        perbuatanTerlarang: 'Menyerang kehormatan/nama baik dengan menuduhkan suatu hal agar diketahui umum melalui sistem elektronik.',
        sanksi: 'Pidana penjara paling lama 2 (dua) tahun dan/atau denda paling banyak Rp 400.000.000 (Pasal 45 ayat 4).',
      },
      rawLosslessChecksum: 'sha256:d8c4e5f6... (Cocok 100%)',
      astJson: {
        type: 'PASAL',
        canonicalPath: '/bab-7/pasal-27a',
        number: '27A',
        label: 'Pasal 27A',
        isInserted: true,
        amendingLaw: 'UU No. 1 Tahun 2024',
        children: [
          {
            type: 'TEXT',
            content: 'Setiap Orang dengan sengaja menyerang kehormatan atau nama baik orang lain...',
            elements: {
              subject: 'Setiap Orang',
              mensRea: 'dengan sengaja',
              actusReus: 'menyerang kehormatan atau nama baik',
              medium: 'Informasi Elektronik dan/atau Dokumen Elektronik melalui Sistem Elektronik',
            },
          },
        ],
      },
    },
  },
  {
    id: 'pasal-1-kuhp-baru',
    name: 'Pasal 1 UU 1/2023 (Asas Legalitas KUHP Baru)',
    category: 'Kodifikasi Pidana',
    sourceDoc: 'LNRI Tahun 2023 No. 1 / TLNRI No. 6842',
    rawPdfText: `UNDANG-UNDANG REPUBLIK INDONESIA
NOMOR 1 TAHUN 2023 TENTANG KITAB UNDANG-UNDANG HUKUM PIDANA

BUKU KESATU · ATURAN UMUM
BAB I · RUANG LINGKUP BERLAKUNYA HUKUM PIDANA
Bagian Kesatu · Batas Berlakunya Hukum Pidana Menurut Waktu

Pasal 1
(1) Tidak ada satu perbuatan pun yang dapat dikenai sanksi pidana dan/atau tindakan, kecuali atas kekuatan peraturan pidana dalam peraturan perundang-undangan yang telah ada sebelum perbuatan dilakukan.
(2) Dalam hal terdapat perubahan peraturan perundang-undangan sesudah perbuatan dilakukan, diberlakukan peraturan yang meringankan bagi pelaku.`,
    astStructure: {
      canonicalPath: '/buku-1/bab-1/bagian-1/pasal-1',
      buku: 'BUKU KESATU · ATURAN UMUM',
      bab: 'BAB I · RUANG LINGKUP BERLAKUNYA HUKUM PIDANA',
      pasal: 'Pasal 1',
      label: 'Asas Legalitas & Retroaktifitas Yang Meringankan',
      norma: {
        subjek: 'Aparat Penegak Hukum & Warga Negara',
        perbuatanTerlarang: 'Pemidanaan tanpa dasar aturan tertulis sebelum perbuatan terjadi (Nullum delictum nulla poena sine praevia lege poenali).',
        sanksi: 'Kewajiban memberlakukan hukum yang paling meringankan (Lex Favor Reo).',
      },
      rawLosslessChecksum: 'sha256:7f4a19b2... (Cocok 100%)',
      astJson: {
        type: 'PASAL',
        canonicalPath: '/buku-1/bab-1/bagian-1/pasal-1',
        number: 1,
        children: [
          { type: 'AYAT', number: 1, label: 'Ayat (1)', text: 'Tidak ada satu perbuatan pun yang dapat dikenai sanksi pidana...' },
          { type: 'AYAT', number: 2, label: 'Ayat (2)', text: 'Dalam hal terdapat perubahan peraturan perundang-undangan...' },
        ],
      },
    },
  },
  {
    id: 'pasal-27-3-ite-repealed',
    name: 'Pasal 27 ayat (3) UU 11/2008 (Pencabutan Delik Multitafsir)',
    category: 'Amandemen & Pencabutan',
    sourceDoc: 'Naskah Sejarah UU 11/2008 vs UU 1/2024',
    rawPdfText: `Pasal 27
(3) Setiap Orang dengan sengaja dan tanpa hak mendistribusikan dan/atau mentransmisikan dan/atau membuat dapat diaksesnya Informasi Elektronik dan/atau Dokumen Elektronik yang memiliki muatan penghinaan dan/atau pencemaran nama baik.

[CATATAN AMANDEMEN: Ketentuan Pasal 27 ayat (3) DICABUT oleh Pasal I angka 1 UU No. 1 Tahun 2024]`,
    astStructure: {
      canonicalPath: '/bab-7/pasal-27/ayat-3',
      bab: 'BAB VII · PERBUATAN YANG DILARANG',
      pasal: 'Pasal 27 ayat (3)',
      label: 'Penghinaan & Pencemaran Nama Baik Lama (Kini Dicabut)',
      norma: {
        subjek: 'Telah Dihapus',
        perbuatanTerlarang: 'STATUS: REPEALED (Dicabut dari hukum positif Indonesia).',
        sanksi: 'Dialihkan ke Pasal 27A & 27B dengan format Delik Aduan Absolut.',
      },
      rawLosslessChecksum: 'sha256:5a9e33c1... (Dicabut)',
      astJson: {
        type: 'AYAT',
        canonicalPath: '/bab-7/pasal-27/ayat-3',
        status: 'REPEALED',
        repealedBy: 'UU No. 1 Tahun 2024 Pasal I angka 1',
        replacement: '/bab-7/pasal-27a',
      },
    },
  },
];

export default function InteractiveParsingTab() {
  const [selectedSampleId, setSelectedSampleId] = useState<string>('pasal-27a-ite');
  const [activeViewMode, setActiveViewMode] = useState<'TREE' | 'JSON'>('TREE');

  const sample = PARSING_SAMPLES.find((s) => s.id === selectedSampleId) || PARSING_SAMPLES[0];

  return (
    <div className="space-y-6">
      {/* Header Tab */}
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            <Cpu className="w-4 h-4" />
          </span>
          <span className="text-xs font-mono font-bold uppercase text-slate-400">
            Inspeksi Visual Pemrosesan AST
          </span>
        </div>
        <h2 className="text-lg sm:text-xl font-black text-white">
          Bagaimana Mesin Membedah Dokumen Hukum?
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Teks PDF dari Lembaran Negara tidak sekadar dibaca sebagai string biasa, melainkan dibongkar ke pohon hierarki logika (*Abstract Syntax Tree*) berparitas hukum UU 12/2011.
        </p>
      </div>

      {/* 4 Tahap Alur Pembedahan Dokumen (Visual Infografis) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 relative overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 font-mono font-bold flex items-center justify-center text-xs mb-2">
            01
          </div>
          <h4 className="font-bold text-xs text-white mb-1">Ekstraksi Teks OCR</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Menarik aliran teks mentah dari berkas PDF Lembaran Negara resmi JDIH BPK RI.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 relative overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono font-bold flex items-center justify-center text-xs mb-2">
            02
          </div>
          <h4 className="font-bold text-xs text-white mb-1">Segmentasi Makro</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Memisahkan Judul, Konsiderans (Menimbang &amp; Mengingat), Batang Tubuh, dan Pengesahan Penutup.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 relative overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono font-bold flex items-center justify-center text-xs mb-2">
            03
          </div>
          <h4 className="font-bold text-xs text-white mb-1">Pohon Hierarki AST</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Mendeteksi pola Buku ➔ Bab ➔ Bagian ➔ Paragraf ➔ Pasal ➔ Ayat ➔ Huruf secara deterministik.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 relative overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold flex items-center justify-center text-xs mb-2">
            04
          </div>
          <h4 className="font-bold text-xs text-white mb-1">Dekomposisi Norma</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Memberi tag subjek norma (*normadressat*), perbuatan yang dilarang, serta ancaman sanksi pidana/denda.
          </p>
        </div>
      </div>

      {/* Simulator Pembedahan Interaktif: Teks Mentah vs AST Parsed */}
      <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-xs font-mono font-bold uppercase text-slate-400">
              Pilih Sampel Naskah untuk Diinspeksi:
            </span>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {PARSING_SAMPLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSampleId(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors ${
                    selectedSampleId === s.id
                      ? 'bg-[#94191C] text-white shadow-md'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 self-start sm:self-center">
            <button
              onClick={() => setActiveViewMode('TREE')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                activeViewMode === 'TREE' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'
              }`}
            >
              Struktur Visual
            </button>
            <button
              onClick={() => setActiveViewMode('JSON')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                activeViewMode === 'JSON' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'
              }`}
            >
              AST JSON Murni
            </button>
          </div>
        </div>

        {/* Side-by-Side Comparison Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Sisi Kiri: Teks Mentah Dokumen PDF */}
          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 mb-3">
                <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Input: Teks Mentah PDF Lembaran Negara</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">{sample.sourceDoc}</span>
              </div>
              <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5 max-h-80 overflow-y-auto">
                {sample.rawPdfText}
              </pre>
            </div>
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Status: Stream OCR Terekstrak</span>
              <span className="text-emerald-400 font-bold">100% Karakter Utuh</span>
            </div>
          </div>

          {/* Sisi Kanan: Output Hasil Pembedahan AST */}
          <div className="p-4 rounded-2xl bg-[#090D16] border border-cyan-500/30 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 mb-3">
                <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Output: Hasil Parsing Pohon Norma AST</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {sample.astStructure.canonicalPath}
                </span>
              </div>

              {activeViewMode === 'TREE' ? (
                <div className="space-y-3 font-mono text-xs max-h-80 overflow-y-auto pr-1">
                  {/* Blok Hierarki */}
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
                    {sample.astStructure.buku && (
                      <div className="text-purple-300 text-[11px] font-bold">
                        📂 {sample.astStructure.buku}
                      </div>
                    )}
                    <div className="text-indigo-300 text-[11px] font-bold">
                      📁 {sample.astStructure.bab}
                    </div>
                    <div className="text-white text-xs font-black flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#94191C]/40 text-rose-300 border border-[#94191C]/50">
                        {sample.astStructure.pasal}
                      </span>
                      <span>{sample.astStructure.label}</span>
                    </div>
                  </div>

                  {/* Dekomposisi Unsur Norma */}
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2 text-[11px]">
                    <div className="text-slate-400">
                      <strong className="text-cyan-300 block mb-0.5">👤 Subjek Norma (Normadressat):</strong>
                      <span className="text-slate-200">{sample.astStructure.norma.subjek}</span>
                    </div>
                    <div className="text-slate-400">
                      <strong className="text-amber-300 block mb-0.5">⚖️ Perbuatan Materiil:</strong>
                      <span className="text-slate-200">{sample.astStructure.norma.perbuatanTerlarang}</span>
                    </div>
                    <div className="text-slate-400">
                      <strong className="text-rose-300 block mb-0.5">🔒 Ancaman Sanksi:</strong>
                      <span className="text-slate-200">{sample.astStructure.norma.sanksi}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <pre className="text-[11px] font-mono text-cyan-200 bg-black/60 p-3 rounded-xl border border-white/5 max-h-80 overflow-y-auto leading-relaxed">
                  {JSON.stringify(sample.astStructure.astJson, null, 2)}
                </pre>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Checksum Kriptografis:</span>
              <span className="text-cyan-400 font-bold">{sample.astStructure.rawLosslessChecksum}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

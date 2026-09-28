'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, ShieldCheck, Scale, FileText, CheckCircle2, 
  Send, Loader2, Copy, Check, BookOpen, AlertCircle, ArrowRight
} from 'lucide-react';
import { InspectorState, API_BASE } from '../../reader-types';

interface AiAnalysisResult {
  summary: string;
  unsurDelik: Array<{ unsur: string; penjelasan: string; terpenuhi?: string }>;
  pertimbanganYuridis: string[];
  rekomendasiAdvokasi: string;
  sitasiResmi: string[];
}

export default function AiAnalysisModal({
  node, currentUser, onClose,
}: {
  node: InspectorState;
  currentUser: { name: string; role: string } | null;
  onClose: () => void;
}) {
  const opUtama = (node.ops ?? [])[0];
  const targetText = node.toText || node.fromText || 'Ketentuan norma hukum positif.';

  const [activeMode, setActiveMode] = useState<'DEKOMPOSISI' | 'LEGAL_OPINION' | 'MOOT_COURT' | 'LEX_FAVOR_REO'>('DEKOMPOSISI');
  const [caseFact, setCaseFact] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Jalankan analisis awal saat modal dibuka atau mode berganti
  const fetchAnalysis = async (mode = activeMode, customFact = caseFact) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/ai/consult`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          canonicalPath: node.canonicalPath,
          pasalLabel: node.label,
          content: targetText,
          mode,
          caseFact: customFact.trim() || undefined,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          setAnalysis(json.data);
        }
      }
    } catch {
      // Fallback lokal jika API terhambat
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis(activeMode, '');
  }, [node.canonicalPath, activeMode]);

  const handleCopyAnalysis = () => {
    if (!analysis) return;
    const textToCopy = `=== ANALISIS YURIDIS AI SIPAKA: ${node.label} ===\n\n` +
      `Ringkasan:\n${analysis.summary}\n\n` +
      `Unsur & Pembuktian:\n` +
      analysis.unsurDelik.map((u) => `- ${u.unsur}: ${u.penjelasan}`).join('\n') + '\n\n' +
      `Pertimbangan Asas Hukum:\n` +
      analysis.pertimbanganYuridis.map((p) => `- ${p}`).join('\n') + '\n\n' +
      `Rekomendasi Advokasi:\n${analysis.rekomendasiAdvokasi}\n\n` +
      `Rujukan Dasar Hukum:\n` +
      analysis.sitasiResmi.map((s) => `- ${s}`).join('\n');

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Header Modal */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-[#94191C] shadow-2xs">
              <Sparkles className="w-5 h-5 text-[#94191C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-bold text-base sm:text-lg text-slate-900">
                  AI Legal Co-Pilot: {node.label}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#94191C] border border-red-200">
                  Fakultas Hukum
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Konsultasi &amp; Dekomposisi Kasus untuk <strong className="text-slate-800">{currentUser?.name}</strong> ({currentUser?.role})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Mode Pemilihan Interaktif Mahasiswa */}
        <div className="pt-3 pb-2 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveMode('DEKOMPOSISI')}
              className={`py-2 px-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeMode === 'DEKOMPOSISI'
                  ? 'bg-white text-[#94191C] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Unsur Delik</span>
            </button>
            <button
              onClick={() => setActiveMode('LEGAL_OPINION')}
              className={`py-2 px-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeMode === 'LEGAL_OPINION'
                  ? 'bg-white text-[#94191C] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Legal Opinion</span>
            </button>
            <button
              onClick={() => setActiveMode('MOOT_COURT')}
              className={`py-2 px-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeMode === 'MOOT_COURT'
                  ? 'bg-white text-[#94191C] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Moot Court</span>
            </button>
            <button
              onClick={() => setActiveMode('LEX_FAVOR_REO')}
              className={`py-2 px-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeMode === 'LEX_FAVOR_REO'
                  ? 'bg-white text-[#94191C] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lex Favor Reo</span>
            </button>
          </div>
        </div>

        {/* Isi Modal Scrollable */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 text-xs font-sans pr-1">
          {/* Bunyi Norma yang Dianalisis */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Bunyi Naskah Hukum Positif:
            </span>
            <p className="text-xs text-slate-800 font-serif leading-relaxed italic line-clamp-3 hover:line-clamp-none transition-all">
              &ldquo;{targetText}&rdquo;
            </p>
          </div>

          {/* Form Input Kasus Posisi Mahasiswa */}
          <div className="p-3.5 rounded-2xl bg-red-50/40 border border-red-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#94191C]" />
                <span>Simulasikan Kasus Posisi / Pertanyaan Anda:</span>
              </span>
              <span className="text-[10px] text-slate-500">Ketik kasus atau pilih pintasan</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={caseFact}
                onChange={(e) => setCaseFact(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAnalysis(activeMode, caseFact)}
                placeholder="Contoh: Terdakwa mengunggah kritik dugaan pungli di instansi pemerintah ke medsos..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#94191C] focus:ring-1 focus:ring-[#94191C] text-slate-800 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => fetchAnalysis(activeMode, caseFact)}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-[#94191C] hover:bg-[#861619] disabled:bg-slate-300 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Uji Kasus</span>
              </button>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-semibold text-slate-500">Pintasan Uji:</span>
              <button
                type="button"
                onClick={() => {
                  const prompt = 'Apakah kritik demi kepentingan umum di medsos dapat dijerat pasal ini?';
                  setCaseFact(prompt);
                  fetchAnalysis(activeMode, prompt);
                }}
                className="text-[10.5px] px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-[#94191C] text-slate-700 hover:text-[#94191C] transition-colors cursor-pointer"
              >
                Kritik Kepentingan Umum
              </button>
              <button
                type="button"
                onClick={() => {
                  const prompt = 'Bagaimana pembuktian kesengajaan (mens rea) jika akun dibajak?';
                  setCaseFact(prompt);
                  fetchAnalysis(activeMode, prompt);
                }}
                className="text-[10.5px] px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-[#94191C] text-slate-700 hover:text-[#94191C] transition-colors cursor-pointer"
              >
                Akun Dibajak (Mens Rea)
              </button>
              <button
                type="button"
                onClick={() => {
                  const prompt = 'Apakah percakapan WhatsApp Group tertutup memenuhi unsur diketahui umum?';
                  setCaseFact(prompt);
                  fetchAnalysis(activeMode, prompt);
                }}
                className="text-[10.5px] px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-[#94191C] text-slate-700 hover:text-[#94191C] transition-colors cursor-pointer"
              >
                WhatsApp Group Tertutup
              </button>
            </div>
          </div>

          {/* Area Output Hasil AI */}
          {loading ? (
            <div className="p-12 text-center text-slate-500 space-y-2.5">
              <Loader2 className="w-7 h-7 animate-spin text-[#94191C] mx-auto" />
              <p className="font-semibold text-xs text-slate-800">Menyusun penalaran hukum komparatif…</p>
              <p className="text-[11px] text-slate-400">Mengkaji unsur delik, doktrin KUHP, dan preseden Putusan Mahkamah Konstitusi.</p>
            </div>
          ) : analysis ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Ringkasan Eksekutif */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#94191C] block mb-1">
                  Intisari Penalaran Hukum:
                </span>
                <p className="text-xs text-slate-900 leading-relaxed font-medium">
                  {analysis.summary}
                </p>
              </div>

              {/* Matriks Unsur Delik / Bagian Dokumen */}
              <div className="space-y-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Matriks Pembuktian &amp; Struktur Yuridis:
                </span>
                <div className="grid grid-cols-1 gap-2.5">
                  {analysis.unsurDelik.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">
                          {item.unsur}
                        </span>
                        {item.terpenuhi && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            {item.terpenuhi}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {item.penjelasan}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pertimbangan Asas Hukum */}
              <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                  Asas &amp; Doktrin Hukum Terkait:
                </span>
                <ul className="space-y-1.5 text-xs text-amber-950">
                  {analysis.pertimbanganYuridis.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rekomendasi Advokasi */}
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-1">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Rekomendasi Praktik / Argumen Sidang:
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {analysis.rekomendasiAdvokasi}
                </p>
              </div>

              {/* Rujukan Sumber Hukum */}
              <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 pt-1">
                <span className="font-semibold">Dasar Rujukan:</span>
                {analysis.sitasiResmi.map((s, idx) => (
                  <span key={idx} className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Aksi Modal */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleCopyAnalysis}
            disabled={!analysis}
            className="py-2 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Analisis Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Salin Draf Analisis</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Scale,
  BookOpen,
  FolderPlus,
  CheckCircle2,
  AlertTriangle,
  Send,
  HelpCircle,
  FileText,
  ShieldAlert,
  ArrowRight,
  BookmarkCheck,
} from 'lucide-react';
import { LatinTermBadge } from '@/app/components/LatinTermPopup';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const MODES = [
  { id: 'DEKOMPOSISI', label: 'Dekomposisi Unsur Delik', desc: 'Bedah unsur subjektif, objektif, dan pembuktian di muka sidang.' },
  { id: 'LEGAL_OPINION', label: 'Legal Memorandum', desc: 'Draf legal opinion komprehensif atas duduk perkara.' },
  { id: 'LEX_FAVOR_REO', label: 'Simulasi Lex Favor Reo', desc: 'Komparasi retroaktif meringankan KUHP Baru (UU 1/2023) vs KUHP Lama.' },
  { id: 'MOOT_COURT', label: 'Strategi Peradilan Semu', desc: 'Garis pertahanan eksepsi, nota pembelaan (pledoi), dan celah dakwaan.' },
  { id: 'JELASKAN_PASAL', label: 'Makna & Ratio Legis', desc: 'Penjelasan tujuan pembentukan norma dan normadressaat.' },
  { id: 'RINGKAS_AMANDEMEN', label: 'Ringkas Silsilah Amandemen', desc: 'Rangkuman linimasa perubahan pasal dari masa ke masa.' },
  { id: 'KASUS_SERUPA', label: 'Temukan Kasus Serupa', desc: 'Pencarian preseden peradilan dan putusan Mahkamah Konstitusi.' },
];

export default function AsistenAiPage() {
  const [mode, setMode] = useState<string>('DEKOMPOSISI');
  const [pasalLabel, setPasalLabel] = useState('Pasal 27A UU ITE (UU 1/2024)');
  const [content, setContent] = useState('');
  const [question, setQuestion] = useState(
    'Seorang jurnalis warga mengunggah investigasi dugaan pencemaran limbah perusahaan di media sosial. Pihak direksi melaporkan atas dasar menyerang kehormatan. Bagaimana telaah pembuktiannya?'
  );

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [savedToRepo, setSavedToRepo] = useState(false);
  const [savingRepo, setSavingRepo] = useState(false);

  const handleConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setSavedToRepo(false);

    try {
      const res = await fetch(`${API_BASE}/api/v1/ai/consult`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mode,
          pasalLabel,
          content,
          question,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setResult(json.data);
      }
    } catch (err) {
      console.error('Failed to run AI consultation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToRepository = async () => {
    if (!result) return;
    setSavingRepo(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/ai/save-to-repository`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: `Telaah AI: ${pasalLabel}`,
          category: mode === 'LEGAL_OPINION' ? 'MEMORANDUM_HUKUM' : 'STUDI_KASUS',
          caseFact: question,
          analysisData: result,
          pasalLabel,
        }),
      });

      if (res.ok) {
        setSavedToRepo(true);
      }
    } catch (err) {
      console.error('Failed to save to repository:', err);
    } finally {
      setSavingRepo(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* ── Banner Atas ── */}
      <section className="bg-gradient-to-b from-[#861619] via-[#94191C] to-[#6A2225] text-white pt-10 pb-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-amber-300 text-xs font-mono font-bold tracking-wide mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ASISTEN RISET &amp; REASONING HUKUM AI</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black font-serif tracking-tight text-white">
            Asisten Analisis Perundang-Undangan
          </h1>
          <p className="text-white/80 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            Mesin penalaran yuridis berbasis doktrin perundang-undangan Indonesia, kodifikasi KUHP 2023, yurisprudensi
            Mahkamah Konstitusi, dan naskah konsolidasi deterministik SIPAKA.
          </p>
        </div>
      </section>

      {/* ── Main Workspace ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Form Konsultasi (5 kolom) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm sticky top-24">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#94191C]" />
              <span>Parameter Penalaran AI</span>
            </h2>

            <form onSubmit={handleConsult} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mode Analisis Yuridis</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#94191C]"
                >
                  {MODES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {MODES.find((m) => m.id === mode)?.desc}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pasal / Norma Hukum</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pasal 27A UU ITE atau Pasal 613 KUHP"
                  value={pasalLabel}
                  onChange={(e) => setPasalLabel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#94191C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kasus Posisi / Perkara yang Dihadapi
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Uraikan duduk perkara, fakta perbuatan, atau pertanyaan hukum spesifik..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#94191C]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-[#94191C] hover:bg-[#861619] text-white text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menganalisis Doktrin &amp; Norma...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Jalankan Penalaran Yuridis</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Kolom Kanan: Hasil Analisis AI (7 kolom) */}
          <div className="lg:col-span-7 space-y-4">
            {!result && !loading && (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-xs">
                <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">Asisten Riset AI Siap Digunakan</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                  Pilih mode penalaran yuridis di sebelah kiri dan masukkan kasus posisi. Asisten AI akan membedah unsur
                  delik, menyusun memo, atau mensimulasikan penerapan asas hukum secara instan.
                </p>
              </div>
            )}

            {result && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
                {/* Header Hasil */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-[#94191C]">
                      Hasil Analisis AI · {mode}
                    </span>
                    <h3 className="text-lg font-bold font-serif text-slate-900 mt-1">{result.summary}</h3>
                  </div>

                  {/* Tombol Simpan ke Repositori */}
                  <button
                    onClick={handleSaveToRepository}
                    disabled={savingRepo || savedToRepo}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                      savedToRepo
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-500 shadow-xs'
                    }`}
                  >
                    {savedToRepo ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Tersimpan di Repositori</span>
                      </>
                    ) : (
                      <>
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>{savingRepo ? 'Menyimpan...' : 'Simpan ke Repositori'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Dekomposisi Unsur */}
                {result.unsurDelik && Array.isArray(result.unsurDelik) && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                      Dekomposisi Unsur &amp; Pertimbangan Pokok
                    </h4>
                    <div className="space-y-2">
                      {result.unsurDelik.map((u: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-800"
                        >
                          <strong className="block font-bold text-slate-950 mb-0.5">{u.unsur}</strong>
                          <p className="leading-relaxed">{u.penjelasan}</p>
                          {u.terpenuhi && (
                            <span className="inline-block mt-2 font-mono text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                              Status: {u.terpenuhi}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deteksi Istilah Latin dalam Hasil AI */}
                <LatinTermBadge text={JSON.stringify(result)} />

                {/* Pertimbangan Doktrin */}
                {result.pertimbanganYuridis && (
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-2">
                      Pertimbangan Doktrinal &amp; Asas Hukum
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {result.pertimbanganYuridis.map((p: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Rekomendasi Advokasi */}
                {result.rekomendasiAdvokasi && (
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-950">
                    <strong className="block font-bold mb-1">Rekomendasi Advokasi &amp; Strategi Sidang:</strong>
                    <p className="leading-relaxed">{result.rekomendasiAdvokasi}</p>
                  </div>
                )}

                {/* Sitasi Resmi */}
                {result.sitasiResmi && (
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="font-semibold text-slate-500">Sitasi Rujukan:</span>
                    {result.sitasiResmi.map((s: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-slate-700 border border-slate-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Disclaimer Hukum Resmi */}
                <div className="p-3 rounded-xl bg-slate-100 text-[10px] text-slate-500 leading-snug flex items-start gap-2 border border-slate-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Pemberitahuan Resmi:</strong> Hasil analisis penalaran hukum ini dihasilkan oleh Asisten AI
                    SIPAKA sebagai alat bantu riset akademis dan perbandingan norma hukum. Analisis ini bukan merupakan
                    nasihat hukum formal atau pendapat hukum mengikat dari penasihat hukum resmi.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

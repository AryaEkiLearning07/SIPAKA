'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Database, AlertTriangle, RefreshCw } from 'lucide-react';

interface AntreanRow {
  slug: string; nomor: string | null; tahun: string | null; status: string;
  skor: number | null; pasal: number; ayat: number; perubahan: number;
}

interface MonitoringData {
  katalog: {
    total: number; terdaftar: number; terunduh: number; terparse: number;
    lolos: number; karantina: number; gagalUnduh: number; gagalParse: number;
  };
  perTahunUU: { tahun: string; jumlah: number }[];
  database: { instruments: number; provisions: number; teraSkor: number; rataSkor: number | null };
  karantinaTerbaru: { slug: string; tahun: string; skor: number | null }[];
  dihitungPada: string;
}

/** Dasbor pemilik: membaca angka NYATA dari database (bukan simulasi). */
export default function MonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('KARANTINA');
  const [antrean, setAntrean] = useState<AntreanRow[] | null>(null);

  useEffect(() => {
    let hidup = true;
    const muat = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/monitoring`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        if (hidup) { setData(j); setErr(null); }
      } catch (e) {
        if (hidup) setErr(e instanceof Error ? e.message : String(e));
      }
    };
    muat();
    const timer = setInterval(muat, 15000);
    return () => { hidup = false; clearInterval(timer); };
  }, []);

  // Antrean per dokumen: ikut refresh periodik + saat filter berubah
  useEffect(() => {
    let hidup = true;
    const muat = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/monitoring/queue?status=${filterStatus}&jenis=UU&limit=50`);
        if (!res.ok) throw new Error(String(res.status));
        const j = await res.json();
        if (hidup) setAntrean(j.antrean);
      } catch {
        if (hidup) setAntrean([]);
      }
    };
    muat();
    const t = setInterval(muat, 15000);
    return () => { hidup = false; clearInterval(t); };
  }, [filterStatus]);

  const kartu = data ? [
    { l: 'Daftar Periksa BPK', v: data.katalog.total, c: 'text-slate-200' },
    { l: 'Menunggu Diunduh', v: data.katalog.terunduh, c: 'text-cyan-300' },
    { l: 'Sedang Dibaca Mesin', v: data.katalog.terparse, c: 'text-indigo-300' },
    { l: 'Lolos - Tayang Publik', v: data.katalog.lolos, c: 'text-emerald-300' },
    { l: 'Karantina - Perlu Manusia', v: data.katalog.karantina, c: 'text-amber-300' },
    { l: 'Gagal - Perlu Dicek', v: data.katalog.gagalUnduh + data.katalog.gagalParse, c: 'text-rose-300' },
  ] : [];

  const maksTahun = data ? Math.max(...data.perTahunUU.map((t) => t.jumlah), 1) : 1;

  return (
    <section className="bg-[#0F1A14] border border-emerald-900/50 rounded-3xl p-5 sm:p-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="font-sans font-black text-lg text-white tracking-tight flex items-center gap-2">
              DASBOR PEMILIK <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">DATA NYATA</span>
            </h2>
            <p className="text-[11px] text-slate-400">Angka langsung dari tabel katalog & database produksi — diperbarui tiap 15 detik.</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
          {data ? new Date(data.dihitungPada).toLocaleTimeString('id-ID') : 'memuat…'}
        </span>
      </div>

      {/* Strip alur dokumen: cara membaca dasbor */}
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono font-bold rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 mb-4">
        <span className="text-slate-400 uppercase tracking-wider mr-1">Alur tiap dokumen:</span>
        <span className="px-2 py-0.5 rounded bg-slate-500/20 text-slate-300 border border-slate-500/30">Terdaftar</span>
        <span className="text-slate-500">→</span>
        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Diunduh</span>
        <span className="text-slate-500">→</span>
        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Dibaca Mesin</span>
        <span className="text-slate-500">→</span>
        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Lolos (Tayang)</span>
        <span className="text-slate-500">/</span>
        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Karantina (Manusia)</span>
      </div>

      {err && !data && (
        <p className="text-xs font-semibold text-rose-300 bg-rose-950/50 border border-rose-800/50 rounded-xl px-4 py-3">
          API tidak terjangkau ({err}) — jalankan server API lalu muat ulang.
        </p>
      )}

      {!data ? (
        <p className="text-sm text-slate-400 animate-pulse py-8 text-center">Menghubungkan ke mesin…</p>
      ) : (
        <>
          {/* Kartu statistik */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {kartu.map((k) => (
              <div key={k.l} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 truncate">{k.l}</p>
                <p className={`font-display text-3xl font-black tabular mt-1 ${k.c}`}>{k.v.toLocaleString('id-ID')}</p>
              </div>
            ))}
          </div>

          {/* Database produksi */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Instrumen di DB</p>
              <p className="font-display text-2xl font-black text-white tabular">{data.database.instruments.toLocaleString('id-ID')}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Node Norma</p>
              <p className="font-display text-2xl font-black text-white tabular">{data.database.provisions.toLocaleString('id-ID')}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Rata-rata Skor Keyakinan</p>
              <p className="font-display text-2xl font-black text-emerald-300 tabular">
                {data.database.rataSkor !== null ? `${data.database.rataSkor}` : '—'}
                <span className="text-sm text-slate-500">/100</span>
              </p>
            </div>
          </div>

          {/* Distribusi per tahun */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-3">
              Sebaran Katalog UU per Tahun (Terbaru)
            </p>
            <div className="space-y-1.5">
              {data.perTahunUU.map((t) => (
                <div key={t.tahun} className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-slate-400 w-10 text-right tabular">{t.tahun}</span>
                  <div className="flex-1 h-3.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                      style={{ width: `${Math.max(3, (t.jumlah / maksTahun) * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-slate-300 w-8 tabular">{t.jumlah}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Karantina terbaru */}
          {data.karantinaTerbaru.length > 0 && (
            <div className="mt-4 rounded-2xl border border-amber-900/40 bg-amber-950/20 p-4">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" /> Antrean Karantina (menunggu penilaian manusia)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {data.karantinaTerbaru.map((k) => (
                  <span key={k.slug} className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-200 border border-amber-500/30">
                    {k.slug} · skor {k.skor ?? '?'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Antrean per dokumen */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Antrean per Dokumen — UU apa, berapa pasal/ayat, berapa perubahan
              </p>
              <div className="flex gap-1">
                {(['LOLOS', 'KARANTINA', 'TERDAFTAR'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                      filterStatus === s
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {!antrean ? (
              <p className="text-xs text-slate-500 animate-pulse">Memuat antrean…</p>
            ) : antrean.length === 0 ? (
              <p className="text-xs text-slate-500">Tidak ada dokumen berstatus {filterStatus}.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] font-mono uppercase tracking-wider text-slate-500 border-b border-white/10">
                    <tr>
                      <th className="py-1.5 pr-3">Dokumen</th>
                      <th className="py-1.5 pr-3">Tahun</th>
                      <th className="py-1.5 pr-3">Pasal</th>
                      <th className="py-1.5 pr-3">Ayat/Angka</th>
                      <th className="py-1.5 pr-3">Perubahan</th>
                      <th className="py-1.5">Skor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {antrean.map((r) => (
                      <tr key={r.slug} className="hover:bg-white/5">
                        <td className="py-1.5 pr-3 font-mono text-[11px] text-slate-200">{r.slug}</td>
                        <td className="py-1.5 pr-3 tabular text-slate-400">{r.tahun ?? '-'}</td>
                        <td className="py-1.5 pr-3 tabular text-slate-200">{r.pasal}</td>
                        <td className="py-1.5 pr-3 tabular text-slate-200">{r.ayat}</td>
                        <td className="py-1.5 pr-3 tabular">
                          {r.perubahan > 0
                            ? <span className="text-amber-300 font-semibold">{r.perubahan}</span>
                            : <span className="text-slate-500">0</span>}
                        </td>
                        <td className="py-1.5 tabular">
                          {r.skor !== null ? (
                            <span className={r.skor >= 85 ? 'text-emerald-300' : 'text-amber-300'}>{r.skor}</span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

'use client';

import React, { useState } from 'react';
import {
  ShieldCheck, AlertTriangle, CheckCircle2, RotateCcw,
  Sparkles, Check, X, Eye, FileText, ArrowRight, Layers
} from 'lucide-react';

interface QuarantineItem {
  slug: string;
  nomor: string | null;
  tahun: string;
  skor: number;
  isu: string;
  detail: string;
  status: 'PENDING_REVIEW' | 'AUTO_HEALED' | 'APPROVED';
}

const INITIAL_QUARANTINE_LIST: QuarantineItem[] = [
  {
    slug: 'peraturan-menag-no-18-tahun-2026',
    nomor: '18',
    tahun: '2026',
    skor: 85,
    isu: 'Judul panjang berulang & Lampiran Bagan',
    detail: 'Ditemukan frasa pengesahan di tengah teks dan tabel struktur jabatan kementerian.',
    status: 'PENDING_REVIEW',
  },
  {
    slug: 'uu-no-2-tahun-2024',
    nomor: '2',
    tahun: '2024',
    skor: 85,
    isu: 'Tabel Pemindahan Ibu Kota Negara (DKJ)',
    detail: 'Pasal peralihan status kekhususan Jakarta memiliki 14 butir konsiderans padat.',
    status: 'PENDING_REVIEW',
  },
  {
    slug: 'uu-no-10-tahun-2025',
    nomor: '10',
    tahun: '2025',
    skor: 85,
    isu: 'Peta Batas Wilayah Geografis',
    detail: 'Koordinat batas wilayah dalam lampiran memerlukan formatting JSON GeoPoint terpisah.',
    status: 'PENDING_REVIEW',
  },
  {
    slug: 'uu-no-13-tahun-2025',
    nomor: '13',
    tahun: '2025',
    skor: 85,
    isu: 'Catchwords Cetakan BPK Terdeteksi',
    detail: 'Teks "Salinan sesuai aslinya" pada halaman 12 belum terhapus sempurna oleh OCR.',
    status: 'AUTO_HEALED',
  },
  {
    slug: 'uu-no-1-tahun-2025',
    nomor: '1',
    tahun: '2025',
    skor: 85,
    isu: 'Pemisahan Frasa Mengingat',
    detail: '18 butir undang-undang rujukan dalam konsiderans mengingat disatukan dalam satu paragraf.',
    status: 'PENDING_REVIEW',
  },
];

export default function ParsingCorrectionTab() {
  const [quarantineItems, setQuarantineItems] = useState<QuarantineItem[]>(INITIAL_QUARANTINE_LIST);
  const [activeTabFilter, setActiveTabFilter] = useState<'ALL' | 'PENDING' | 'HEALED'>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleApprove = (slug: string) => {
    setQuarantineItems((prev) =>
      prev.map((item) => (item.slug === slug ? { ...item, status: 'APPROVED', skor: 100 } : item))
    );
    setActionNotice(`✅ Dokumen "${slug}" telah diluluskan kurator dan siap di-ingest ke MariaDB.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleAutoHeal = (slug: string) => {
    setQuarantineItems((prev) =>
      prev.map((item) => (item.slug === slug ? { ...item, status: 'AUTO_HEALED', skor: 95 } : item))
    );
    setActionNotice(`✨ Auto-healing dijalankan untuk "${slug}". Isu tata letak berhasil disanitasi.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const filteredItems = quarantineItems.filter((i) => {
    if (activeTabFilter === 'PENDING') return i.status === 'PENDING_REVIEW';
    if (activeTabFilter === 'HEALED') return i.status === 'AUTO_HEALED' || i.status === 'APPROVED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <ShieldCheck className="w-4 h-4" />
          </span>
          <span className="text-xs font-mono font-bold uppercase text-slate-400">
            Meja Kerja Koreksi &amp; Quality Assurance
          </span>
        </div>
        <h2 className="text-lg sm:text-xl font-black text-white">
          Proses Koreksi Hasil Parsing &amp; Auto-Healing
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Setiap dokumen yang diekstraksi wajib melalui 4 lapis filter integritas. Dokumen dengan skor 100 langsung tayang, sedangkan dokumen dengan anomali tata letak masuk ke ruang koreksi.
        </p>
      </div>

      {actionNotice && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-mono">
          {actionNotice}
        </div>
      )}

      {/* 4 Pilar Uji Integritas & Koreksi Otomatis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
          <h4 className="font-bold text-white mb-1">1. Uji Urutan Numerik</h4>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Mendeteksi jika ada pasal yang hilang atau lompat (misal dari Pasal 14 langsung loncat ke Pasal 16).
          </p>
          <span className="inline-block mt-2 text-[10px] font-mono text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded">
            Auto-Detect &amp; Alert
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <Sparkles className="w-5 h-5 text-cyan-400 mb-2" />
          <h4 className="font-bold text-white mb-1">2. Pembersihan Catchwords</h4>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Menghapus teks running header cetakan BPK (&quot;Sistem . . .&quot; atau &quot;Salinan Asli&quot;) yang terselip di tengah pasal.
          </p>
          <span className="inline-block mt-2 text-[10px] font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded">
            Auto-Healing Regex OK
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <Layers className="w-5 h-5 text-purple-400 mb-2" />
          <h4 className="font-bold text-white mb-1">3. Normalisasi Definisi</h4>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Membedah Pasal 1 Ketentuan Umum menjadi entri glosarium mandiri (Angka 1 s.d. Angka 23 terpisah rapi).
          </p>
          <span className="inline-block mt-2 text-[10px] font-mono text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded">
            Glosarium Indexing
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <ShieldCheck className="w-5 h-5 text-rose-400 mb-2" />
          <h4 className="font-bold text-white mb-1">4. Verifikasi SHA-256</h4>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Pencocokan checksum karakter naskah sumber menjamin tidak ada kata atau tanda baca yang hilang (*Zero-Loss*).
          </p>
          <span className="inline-block mt-2 text-[10px] font-mono text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded">
            Kriptografi SHA-256
          </span>
        </div>
      </div>

      {/* Meja Kerja Karantina (Review & Healing Console) */}
      <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Daftar Dokumen Karantina Layout yang Butuh Verifikasi</span>
            </h3>
            <p className="text-xs text-slate-400">Dokumen di bawah memiliki skor mutu di bawah 100 karena tantangan layout spesifik.</p>
          </div>

          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTabFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                activeTabFilter === 'ALL' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'
              }`}
            >
              Semua ({quarantineItems.length})
            </button>
            <button
              onClick={() => setActiveTabFilter('PENDING')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                activeTabFilter === 'PENDING' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'
              }`}
            >
              Perlu Kurasi ({quarantineItems.filter((i) => i.status === 'PENDING_REVIEW').length})
            </button>
            <button
              onClick={() => setActiveTabFilter('HEALED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                activeTabFilter === 'HEALED' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'
              }`}
            >
              Selesai ({quarantineItems.filter((i) => i.status !== 'PENDING_REVIEW').length})
            </button>
          </div>
        </div>

        {/* Tabel Karantina */}
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white/[0.04] text-slate-400 border-b border-white/10">
              <tr>
                <th className="py-2.5 px-3">Identitas Dokumen</th>
                <th className="py-2.5 px-3">Skor Mutu</th>
                <th className="py-2.5 px-3">Isu Terdeteksi</th>
                <th className="py-2.5 px-3">Catatan Sanitasi</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Tindakan Koreksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredItems.map((item) => (
                <tr key={item.slug} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3 font-bold text-white">
                    {item.nomor ? `UU No. ${item.nomor}/${item.tahun}` : item.slug}
                    <span className="text-[10px] text-slate-500 block font-normal truncate max-w-xs">{item.slug}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      item.skor === 100 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {item.skor}/100
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-amber-300 font-medium">
                    {item.isu}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px] max-w-xs">
                    {item.detail}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' :
                      item.status === 'AUTO_HEALED' ? 'bg-cyan-500/20 text-cyan-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.status === 'PENDING_REVIEW' && (
                        <>
                          <button
                            onClick={() => handleAutoHeal(item.slug)}
                            className="px-2 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-700/50 text-cyan-300 text-[11px] font-bold cursor-pointer"
                          >
                            Auto-Heal
                          </button>
                          <button
                            onClick={() => handleApprove(item.slug)}
                            className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 text-[11px] font-bold cursor-pointer"
                          >
                            Luluskan
                          </button>
                        </>
                      )}
                      {item.status === 'AUTO_HEALED' && (
                        <button
                          onClick={() => handleApprove(item.slug)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Publikasi ke DB
                        </button>
                      )}
                      {item.status === 'APPROVED' && (
                        <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Sudah Tayang</span>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

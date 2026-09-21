'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface LawCard {
  id: string;
  title: string;
  officialNumber: string;
  amendments: string[];
  lastAmended: string;
  status: string;
  summary: string;
  slug: string;
}

/** Fallback saat API/database belum siap — demo tetap bisa dibuka. */
const FALLBACK_LAWS: LawCard[] = [
  {
    id: 'uu-ite',
    title: 'Undang-Undang Informasi dan Transaksi Elektronik',
    officialNumber: 'UU No. 11 Tahun 2008',
    amendments: ['UU 19/2016', 'UU 1/2024'],
    lastAmended: '2 Januari 2024',
    status: 'KONSOLIDASI AKTIF',
    summary:
      'Mengatur transaksi elektronik, tanda tangan digital, perbuatan yang dilarang, fitnah online, dan alat bukti elektronik.',
    slug: 'ite',
  },
];

const formatDateId = (iso: string): string => {
  try {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
  } catch {
    return iso;
  }
};

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [laws, setLaws] = useState<LawCard[]>(FALLBACK_LAWS);
  const [dataSource, setDataSource] = useState<'database' | 'demo'>('demo');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/instruments`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled || !Array.isArray(json?.data) || json.data.length === 0) return;
        setDataSource(json.source === 'database' ? 'database' : 'demo');
        setLaws(
          json.data.map(
            (inst: {
              slug: string | null;
              type: string;
              number: number;
              year: number;
              title: string;
              description?: string | null;
              status: string;
              promulgatedAt: string;
              amendingInstruments: string[];
            }) => ({
              id: `${inst.type}-${inst.number}-${inst.year}`,
              title: inst.title,
              officialNumber: `${inst.type} No. ${inst.number} Tahun ${inst.year}`,
              amendments: inst.amendingInstruments ?? [],
              lastAmended: formatDateId(inst.promulgatedAt),
              status: inst.status === 'DIUBAH' ? 'KONSOLIDASI AKTIF' : inst.status,
              summary:
                inst.description ||
                'Naskah konsolidasi deterministik beserta silsilah amandemen.',
              slug: inst.slug ?? `uu-${inst.number}-${inst.year}`,
            })
          )
        );
        setDataSource('database');
      } catch {
        /* API belum siap — biarkan data demo */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? laws.filter(
        (law) =>
          law.title.toLowerCase().includes(q) ||
          law.officialNumber.toLowerCase().includes(q) ||
          law.summary.toLowerCase().includes(q)
      )
    : laws;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Masthead ─────────────────────────────────────────────── */}
      <header className="border-b rule">
        <div className="max-w-6xl mx-auto px-6 h-10 flex items-center justify-between text-[11px] font-semibold uppercase tracking-caps text-ink-mute">
          <span>Arsip Konsolidasi Perundang-Undangan</span>
          <nav className="flex items-center gap-6">
            <Link href="/tentang" className="hover:text-seal transition-colors">
              Tentang &amp; Disclaimer
            </Link>
            <span
              className={`inline-flex items-center gap-1.5 ${
                dataSource === 'database' ? 'text-sage' : 'text-brass'
              }`}
            >
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  dataSource === 'database' ? 'bg-sage' : 'bg-brass'
                }`}
              />
              {dataSource === 'database' ? 'Database' : 'Data Demo'}
            </span>
          </nav>
        </div>
        <div className="border-t rule">
          <div className="max-w-6xl mx-auto px-6 py-5 flex items-baseline justify-between">
            <Link href="/" className="font-display text-3xl font-semibold tracking-tight text-ink">
              LexVera<span className="text-seal">.</span>
            </Link>
            <p className="hidden sm:block text-xs text-ink-mute max-w-xs text-right leading-relaxed">
              “Git” untuk perundang-undangan Indonesia — riwayat hidup setiap pasal, direkonstruksi mesin, disetujui manusia.
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="border-b rule">
          <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-[7fr_4fr] gap-12">
            <div>
              <p className="kicker">Edisi Pilot · Keluarga UU ITE</p>
              <h1 className="mt-4 font-display text-5xl sm:text-6xl leading-[1.05] font-semibold tracking-tight text-ink">
                Setiap pasal
                <br />
                punya riwayat<span className="text-seal">.</span>
              </h1>
              <p className="mt-6 font-serif text-lg leading-relaxed text-ink-soft max-w-xl">
                Naskah konsolidasi utuh pada tanggal berapa pun — direkonstruksi dari operasi
                amandemen yang disetujui kurator, dikutip verbatim dari Lembaran Negara, dan
                diverifikasi karakter-per-karakter. Bukan ringkasan. Bukan tebakan mesin.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <a
                  href="#indeks"
                  className="inline-flex items-center gap-2 bg-ink text-paper px-5 py-3 text-sm font-semibold hover:bg-ink-soft transition-colors"
                >
                  Buka Indeks Peraturan
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link
                  href="/tentang"
                  className="text-sm font-semibold text-ink-mute hover:text-seal transition-colors"
                >
                  Cara mesin bekerja →
                </Link>
              </div>
            </div>

            {/* Ledger */}
            <aside className="self-start border rule bg-paper-deep">
              <div className="px-5 py-3 border-b rule flex items-center justify-between">
                <span className="kicker">Buku Besar Pilot</span>
                <span className="font-mono text-[10px] text-ink-faint">v0.2</span>
              </div>
              <dl className="px-5 py-4 divide-y divide-ink/5 text-sm">
                {[
                  ['Keluarga peraturan', '1'],
                  ['Instrumen dalam silsilah', '3'],
                  ['Amandemen tercatat', '2'],
                  ['Operasi perubahan', '6'],
                  ['Putusan MK teranotasi', '1'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-ink-mute">{k}</dt>
                    <dd className="font-display text-xl font-semibold text-ink tabular">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="px-5 py-3 border-t rule">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-caps text-seal">
                  <span className="inline-block w-2 h-2 border-2 border-seal rotate-45" />
                  Teruji Golden Test
                </span>
              </div>
            </aside>
          </div>
        </section>

        {/* ── Indeks Peraturan ───────────────────────────────────── */}
        <section id="indeks" className="border-b rule">
          <div className="max-w-6xl mx-auto px-6 py-14">
            <div className="flex items-end justify-between gap-6 mb-8">
              <div>
                <p className="kicker">Indeks Peraturan</p>
                <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight">
                  Daftar Keluarga
                </h2>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nomor UU, topik, atau pasal…"
                  className="w-full bg-white border rule pl-9 pr-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-seal transition-colors"
                />
              </div>
            </div>

            <div className="border-t rule">
              {filtered.map((law) => (
                <article
                  key={law.id}
                  className="group grid md:grid-cols-[10rem_1fr_auto] gap-6 py-7 border-b rule hover:bg-paper-deep/60 transition-colors px-2 -mx-2"
                >
                  {/* Kolom nomor — seperti blok pengesahan */}
                  <div className="tabular">
                    <p className="font-mono text-xs text-seal font-medium">{law.officialNumber}</p>
                    <p className="mt-1.5 text-[11px] text-ink-faint uppercase tracking-caps">
                      {law.status}
                    </p>
                  </div>

                  {/* Kolom isi */}
                  <div>
                    <Link href={`/uu/${law.slug}`}>
                      <h3 className="font-display text-xl font-semibold text-ink group-hover:text-seal transition-colors">
                        {law.title}
                      </h3>
                    </Link>
                    <p className="mt-2 font-serif text-[15px] leading-relaxed text-ink-soft max-w-2xl">
                      {law.summary}
                    </p>
                    {law.amendments.length > 0 && (
                      <p className="mt-3 font-mono text-[11px] text-ink-mute">
                        <span className="text-ink-faint">amendemen:</span>{' '}
                        {law.amendments.join('  ·  ')}
                        <span className="mx-2 text-ink-faint">|</span>
                        terakhir {law.lastAmended}
                      </p>
                    )}
                  </div>

                  {/* Kolom aksi */}
                  <div className="flex md:flex-col items-end justify-between md:justify-center gap-3">
                    <Link
                      href={`/neuron?id=${law.slug}`}
                      className="text-xs font-semibold text-ink-mute hover:text-seal transition-colors whitespace-nowrap"
                    >
                      Silsilah →
                    </Link>
                    <Link
                      href={`/uu/${law.slug}`}
                      className="inline-flex items-center gap-1.5 border border-ink/20 px-4 py-2 text-xs font-semibold text-ink hover:border-seal hover:text-seal transition-colors whitespace-nowrap"
                    >
                      Buka Naskah
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
              {filtered.length === 0 && (
                <p className="py-12 text-center font-serif text-ink-mute">
                  Tidak ada peraturan yang cocok dengan “{query}”.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Metode ─────────────────────────────────────────────── */}
        <section className="border-b rule">
          <div className="max-w-6xl mx-auto px-6 py-14">
            <p className="kicker">Metode</p>
            <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight mb-10">
              Mesin tidak pernah mengarang — tiga gerbang sebelum naskah tampil
            </h2>
            <ol className="grid md:grid-cols-3 gap-10">
              {[
                {
                  no: '01',
                  t: 'Interpretasi oleh manusia',
                  d: 'Klausa perubahan yang formulaik di UU pengubah diterjemahkan menjadi operasi terstruktur. Parser hanya mengusulkan; kurator manusia yang memutuskan.',
                },
                {
                  no: '02',
                  t: 'Operasi terverifikasi',
                  d: 'Setiap operasi merekam dasar hukumnya (Pasal–angka UU pengubah) dan dikunci bersama hash SHA-256 PDF Lembaran Negara aslinya.',
                },
                {
                  no: '03',
                  t: 'Rekonstruksi deterministik',
                  d: 'Mesin menjalankan operasi berurutan untuk menghasilkan naskah pada tanggal berapa pun — diverifikasi golden test, karakter per karakter.',
                },
              ].map((s) => (
                <li key={s.no} className="border-t-2 border-ink pt-4">
                  <span className="font-display text-seal text-2xl font-semibold tabular">{s.no}</span>
                  <h3 className="mt-2 font-display text-lg font-semibold">{s.t}</h3>
                  <p className="mt-2 font-serif text-[15px] leading-relaxed text-ink-soft">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      {/* ── Colophon ─────────────────────────────────────────────── */}
      <footer className="border-t rule">
        <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-[1fr_auto] gap-6 items-start">
          <p className="font-serif text-sm leading-relaxed text-ink-mute max-w-2xl">
            Naskah konsolidasi LexVera adalah <strong className="text-ink">alat riset non-resmi</strong>.
            Naskah yang berlaku secara resmi adalah yang diterbitkan dalam Lembaran Negara Republik
            Indonesia; setiap pasal pada platform ini dapat diverifikasi silang ke dokumen sumbernya.
          </p>
          <div className="text-xs text-ink-faint md:text-right space-y-1">
            <p className="font-semibold uppercase tracking-caps text-ink-mute">LexVera · Proyek Riset FH</p>
            <p className="font-mono">core engine v0.2 — {dataSource === 'database' ? 'db live' : 'demo data'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import MockupPreview from './components/home/MockupPreview';
import {
  Search, ArrowRight, Network, CheckCircle2,
  ShieldCheck, LogIn
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function HomePage() {
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          if (json.user) {
            setCurrentUser(json.user);
          }
        }
      } catch {
        // Tamu / belum login
      }
    })();
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      router.push(`/katalog?q=${encodeURIComponent(searchKeyword.trim())}`);
    } else {
      router.push('/katalog');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 font-sans text-slate-800">
      {/* ── Hero Section (Bersih, Elegan, Terfokus pada Pencarian) ───── */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-[#94191C] via-[#861619] to-[#2B0B06] pt-8 pb-12 sm:pt-12 sm:pb-16 text-white border-b border-[#2B0B06]">
          {/* Subtle Ambient Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
            {/* Pill Atas */}
            <div className="inline-flex items-center gap-2 p-1 pl-3 pr-3.5 rounded-full bg-black/30 border border-white/20 text-xs font-medium text-white shadow-md mb-4 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Akses Terbuka Publik Tanpa Login</span>
              <span className="text-white/40">·</span>
              <span className="text-amber-300 font-mono font-semibold">Naskah Konsolidasi Deterministik</span>
            </div>

            {/* Headline Utama */}
            <h1 className="font-sans text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
              Sistem Informasi Pelacakan{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-100 drop-shadow-sm">
                Amandemen &amp; Kodifikasi
              </span>
            </h1>

            <p className="mt-3.5 text-sm sm:text-base leading-relaxed text-white/90 max-w-2xl mx-auto font-sans font-light">
              Membaca naskah konsolidasi undang-undang Indonesia pada versi tahun mana pun secara deterministik.
              Disajikan rapi layaknya dokumen naskah hukum asli dengan penanda warna amandemen yang bersih.
            </p>

            {/* Hero Search Box Putih Bersih dengan Tombol Merah Marun */}
            <form onSubmit={handleHeroSearch} className="mt-6 max-w-2xl mx-auto relative flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Cari undang-undang, nomor, tahun, atau topik delik hukum…"
                className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-white border border-white/40 shadow-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-amber-300/30 focus:border-[#94191C] transition-all font-medium"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-5 bg-[#94191C] hover:bg-[#861619] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <span>Cari</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Shortcut Chips Langsung di Bawah Kotak Pencarian */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto text-xs font-medium">
              <span className="text-white/70 text-[11px] font-semibold uppercase tracking-wider mr-1">
                Pintasan Cepat:
              </span>
              {[
                { label: 'Hukum Pidana', query: 'pidana' },
                { label: 'Hukum Perdata', query: 'perdata' },
                { label: 'Hukum HAM', query: 'ham' },
                { label: 'Hukum Internasional', query: 'internasional' },
                { label: 'Tata Kelola Negara', query: 'tata negara' },
                { label: 'Hukum Bisnis', query: 'bisnis' },
                { label: 'Siber & Teknologi', query: 'siber' },
              ].map((chip) => (
                <Link
                  key={chip.label}
                  href={`/katalog?q=${encodeURIComponent(chip.query)}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/25 hover:bg-black/40 border border-white/20 text-white/95 hover:text-amber-300 transition-all text-xs font-semibold backdrop-blur-xs cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>{chip.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <MockupPreview />

        {/* ── 3 Langkah Alur Penggunaan Platform ───────────────────── */}
        <section className="py-12 sm:py-16 bg-slate-50 border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Alur Kerja Cepat &amp; Efisien
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600">
                Dari pencarian undang-undang hingga analisis silsilah hukum, semuanya terintegrasi tanpa hambatan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Langkah 1 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative">
                <div className="w-9 h-9 rounded-xl bg-[#94191C] text-white font-mono font-bold flex items-center justify-center text-xs mb-3 shadow-sm">
                  01
                </div>
                <h3 className="font-sans font-bold text-base text-slate-900 mb-1.5">
                  Cari Undang-Undang
                </h3>
                <p className="text-xs leading-relaxed text-slate-600">
                  Cari peraturan berdasarkan kata kunci nomor UU, tahun, atau topik delik hukum melalui pencarian terpadu.
                </p>
              </div>

              {/* Langkah 2 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative">
                <div className="w-9 h-9 rounded-xl bg-[#94191C] text-white font-mono font-bold flex items-center justify-center text-xs mb-3 shadow-sm">
                  02
                </div>
                <h3 className="font-sans font-bold text-base text-slate-900 mb-1.5">
                  Buka Mode Baca Asli
                </h3>
                <p className="text-xs leading-relaxed text-slate-600">
                  Naskah tampil rapi layaknya dokumen Word resmi. Perubahan amandemen cukup ditandai garis warna halus agar nyaman dibaca.
                </p>
              </div>

              {/* Langkah 3 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative">
                <div className="w-9 h-9 rounded-xl bg-[#94191C] text-white font-mono font-bold flex items-center justify-center text-xs mb-3 shadow-sm">
                  03
                </div>
                <h3 className="font-sans font-bold text-base text-slate-900 mb-1.5">
                  Silsilah &amp; Aturan Terdampak
                </h3>
                <p className="text-xs leading-relaxed text-slate-600">
                  Klik pasal amandemen untuk melihat riwayat putusan MK, dasar hukum perubahan, serta seluruh PP dan Permen yang terdampak.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3 Pilar Keunggulan Akademik ──────────────────────────── */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mb-3" />
                <h4 className="font-sans font-bold text-sm text-slate-900 mb-1">
                  100% Deterministik
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Semua naskah direkonstruksi murni dari data Lembaran Negara resmi. Nol karangan mesin, nol asumsi spekulatif.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
                <ShieldCheck className="w-6 h-6 text-[#94191C] mb-3" />
                <h4 className="font-sans font-bold text-sm text-slate-900 mb-1">
                  Integritas Kriptografi SHA-256
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dokumen sumber primer di-hash secara kriptografis dan diverifikasi menggunakan *golden test suite* berparitas karakter.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
                <Network className="w-6 h-6 text-[#94191C] mb-3" />
                <h4 className="font-sans font-bold text-sm text-slate-900 mb-1">
                  Hierarki Teori Stufenbau
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Memetakan relasi hierarki antara Putusan Mahkamah Konstitusi, Undang-Undang Pokok, PP, dan Peraturan Menteri.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer Bernuansa Mahogani Gelap (#2B0B06 & #1E0507) ─── */}
      <footer className="border-t border-[#3A0F08] bg-[#1E0507] text-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/70">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logoSIPAKA.png"
              alt="Logo SIPAKA"
              width={28}
              height={28}
              className="rounded-md object-contain ring-1 ring-white/20 shrink-0"
              unoptimized
            />
            <span className="font-medium tracking-tight">SIPAKA · Sistem Informasi Pelacakan Amandemen, Kodifikasi, dan Advokasi</span>
          </div>
          <div className="flex items-center gap-4 text-white/80">
            <Link href="/katalog" className="hover:text-amber-300 transition-colors">Pencarian UU</Link>
            <Link href="/neuron" className="hover:text-amber-300 transition-colors">Peta Silsilah</Link>
            <Link href="/tentang" className="hover:text-amber-300 transition-colors">Metodologi</Link>
            <Link href="/masuk" className="hover:text-amber-300 transition-colors">Masuk Akun</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

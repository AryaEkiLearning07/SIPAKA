'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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

        {/* ── Mockup Pratinjau Mode Baca Word-Style ─────────────────── */}
        <section className="py-12 sm:py-16 bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#94191C] bg-red-50 px-3 py-1 rounded-full border border-red-200">
                Pengalaman Membaca Naskah Asli
              </span>
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
                Dirancang Senyaman Membaca Dokumen Microsoft Word
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600">
                Bagian tengah adalah lembaran kertas naskah hukum resmi, dilengkapi daftar isi bab/pasal interaktif di kiri, dan keterangan amandemen serta aturan terdampak di kanan.
              </p>
            </div>

            {/* Interactive Preview Mockup Box */}
            <div className="bg-white rounded-3xl border border-slate-300 shadow-xl overflow-hidden">
              <div className="h-10 bg-[#861619] text-white px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-300/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-300/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-300/80" />
                  <span className="ml-2 font-mono text-[11px] text-white/90">SIPAKA Workspace Reader · Salinan Lembaran Negara</span>
                </div>
                <div className="text-xs font-semibold text-amber-200 font-mono">
                  UU No. 11/2008 jo. UU 1/2024
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[400px]">
                {/* Mockup Kiri: Daftar Isi */}
                <div className="md:col-span-3 border-r border-slate-200 bg-slate-50/70 p-4 space-y-3">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    Daftar Isi Norma
                  </div>
                  <div className="space-y-1 text-xs font-sans">
                    <div className="p-2 rounded-lg bg-red-50 text-[#94191C] font-semibold border-l-2 border-[#94191C]">
                      BAB I Ketentuan Umum
                    </div>
                    <div className="pl-4 py-1 text-slate-600">Pasal 1 (Definisi)</div>
                    <div className="pl-4 py-1 text-slate-600">Pasal 2 (Yurisdiksi)</div>
                    <div className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium">
                      BAB VII Perbuatan yang Dilarang
                    </div>
                    <div className="pl-4 py-1 text-[#94191C] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Pasal 27 (Kesusilaan)
                    </div>
                    <div className="pl-4 py-1 text-[#94191C] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Pasal 27A (Penghinaan)
                    </div>
                  </div>
                </div>

                {/* Mockup Tengah: Full Paper Word */}
                <div className="md:col-span-6 bg-slate-200/60 p-6 flex justify-center items-center">
                  <div className="bg-white w-full rounded-sm shadow-md border border-slate-300 p-6 space-y-4 font-serif text-xs leading-relaxed">
                    <div className="text-center pb-3 border-b border-slate-800">
                      <p className="font-sans font-bold uppercase text-[10px] tracking-widest text-slate-700">Presiden Republik Indonesia</p>
                      <p className="font-sans font-extrabold text-xs text-slate-900 mt-1">Undang-Undang Nomor 11 Tahun 2008</p>
                    </div>

                    {/* Pasal Normal */}
                    <div className="space-y-1">
                      <p className="font-sans font-bold text-slate-900">Pasal 1</p>
                      <p className="text-slate-700 text-justify">Dalam Undang-Undang ini yang dimaksud dengan Informasi Elektronik adalah satu atau sekumpulan data elektronik…</p>
                    </div>

                    {/* Pasal dengan Tanda Warna Halus */}
                    <div className="border-l-4 border-emerald-500 pl-3 bg-emerald-50/30 py-1 rounded-r space-y-1">
                      <div className="flex items-center justify-between font-sans">
                        <span className="font-bold text-slate-900">Pasal 27A</span>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">🟢 Sisipan Baru (UU 1/2024)</span>
                      </div>
                      <p className="text-slate-800 text-justify">Setiap Orang yang dengan sengaja menyerang kehormatan atau nama baik orang lain dengan menuduhkan suatu hal…</p>
                    </div>
                  </div>
                </div>

                {/* Mockup Kanan: Panel Asisten Ringkasan */}
                <div className="md:col-span-3 border-l border-slate-200 bg-white p-4 space-y-4 text-xs font-sans">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                      Asisten &amp; Ringkasan
                    </span>
                    <h4 className="font-bold text-slate-900 mt-1">Pasal 27A (Aktif)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Disisipkan oleh UU No. 1 Tahun 2024</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-[11px]">
                    <span className="font-bold text-slate-700 block">Legenda Penanda Warna:</span>
                    <p className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 shrink-0" />
                      Hijau: Sisipan Baru (2024)
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 shrink-0" />
                      Kuning: Redaksi Diubah
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 shrink-0" />
                      Merah: Dicabut / Dihapus
                    </p>
                  </div>

                  <Link
                    href="/uu/ite"
                    className="w-full py-2 bg-[#94191C] hover:bg-[#861619] text-white rounded-lg font-semibold text-center block text-xs transition-colors shadow-2xs"
                  >
                    Buka Mode Baca Penuh ➔
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

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

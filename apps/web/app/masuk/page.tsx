'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { API_BASE, PublicUser } from './auth-shared';
import MasukAuthCard from './MasukAuthCard';

export default function MasukPage() {
  const [user, setUser] = useState<PublicUser | null>(null);

  // Periksa sesi aktif saat halaman dibuka
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          if (json.user) setUser(json.user);
        }
      } catch {
        // Tamu / belum login
      }
    })();
  }, []);

  const logout = () => setUser(null);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      {/* ── Top Notice Bar (Palet Fakultas Hukum #861619 & Pill #6A2225) ── */}
      <div className="bg-[#861619] text-white text-xs py-1.5 px-4 sm:px-6 border-b border-[#6A2225] select-none">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-[#6A2225] text-amber-300 px-2 py-0.5 rounded font-mono font-bold text-[10px] tracking-wide uppercase shadow-2xs">
              Autentikasi
            </span>
            <span className="text-white/95 text-[11px] truncate font-medium">
              Ruang Akses Anggota SIPAKA · Akses Publik Naskah Terbuka Tanpa Batas
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-white/80">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>Sesi Terenkripsi SHA-256</span>
          </div>
        </div>
      </div>

      {/* ── Header Brand Area (Rich Crimson #94191C) ─────────────── */}
      <div className="bg-[#94191C] pt-6 pb-24 sm:pb-28 border-b border-[#861619] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-11 w-14 sm:h-12 sm:w-16 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Image
                src="/logoSIPAKA.png"
                alt="Logo SIPAKA"
                width={64}
                height={52}
                className="w-full h-full object-contain drop-shadow-md"
                priority
                unoptimized
              />
            </div>
            <div>
              <span className="font-sans font-black text-2xl text-white tracking-tight flex items-center gap-1">
                SIPAKA<span className="text-amber-300">.</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-200 block font-semibold">
                Legal-Tech Intelligence &amp; Kodifikasi
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black/25 hover:bg-black/40 border border-white/20 text-xs font-semibold text-white/95 transition-all shadow-2xs hover:shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>

      {/* ── Main Form Area (Floating Elegant Card -mt-16) ─────────── */}
      <MasukAuthCard user={user} onAuthSuccess={setUser} onLogout={logout} />

      {/* ── Footer Bernuansa Mahogani Gelap ───────────────────────── */}
      <footer className="border-t border-[#3A0F08] bg-[#1E0507] text-white py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-white/60">
          SIPAKA · Sistem Informasi Pelacakan Amandemen, Kodifikasi, dan Advokasi Hukum
        </div>
      </footer>
    </div>
  );
}

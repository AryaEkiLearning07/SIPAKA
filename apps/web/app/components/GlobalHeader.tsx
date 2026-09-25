'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LogIn } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface NavItem {
  label: string;
  href: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Beranda', href: '/', exact: true },
  { label: 'Pencarian UU', href: '/katalog' },
];

export default function GlobalHeader() {
  const pathname = usePathname();
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

  const isActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  // Ketika masuk ke dalam workspace baca naskah (/uu/...), autentikasi (/masuk), atau simulator pabrik (/pipeline), sembunyikan seluruh header agar fokus
  if (
    pathname.startsWith('/uu/') ||
    pathname === '/masuk' ||
    pathname.startsWith('/masuk/') ||
    pathname === '/pipeline' ||
    pathname.startsWith('/pipeline/')
  ) {
    return null;
  }

  return (
    <header className="w-full shrink-0 select-none z-50 sticky top-0 shadow-md">
      {/* ── Top Notice Bar (Palet Sesuai Desain Resmi: #861619 & Pill #6A2225) ── */}
      <div className="bg-[#861619] text-white text-xs py-1.5 px-4 sm:px-6 border-b border-[#6A2225]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-[#6A2225] text-amber-300 px-2 py-0.5 rounded font-mono font-bold text-[10px] tracking-wide uppercase shadow-2xs">
              Terbaru
            </span>
            <span className="text-white/95 text-[11px] truncate font-medium">
              Sistem Informasi Pelacakan Amandemen &amp; Kodifikasi (SIPAKA) · Akses Terbuka Tanpa Login
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3 text-[11px] text-white/80">
            <span>Standar Naskah: Lembaran Negara RI (LNRI)</span>
            <span>·</span>
            <span className="text-amber-300 font-semibold">UUD 1945 s.d. Perda</span>
          </div>
        </div>
      </div>

      {/* ── Header Area dengan Navbar Tunggal Bersih & Melayang ── */}
      <div className="bg-[#94191C] pt-2.5 pb-3 sm:pt-3 sm:pb-3.5 border-b border-[#861619]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl shadow-md border border-slate-200/90 px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
            {/* Brand Logo Resmi SIPAKA */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <div className="relative h-11 w-14 sm:h-13 sm:w-16 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Image
                  src="/logoSIPAKA.png"
                  alt="Logo SIPAKA"
                  width={64}
                  height={52}
                  className="w-full h-full object-contain drop-shadow-xs"
                  priority
                  unoptimized
                />
              </div>
              <div className="flex flex-col">
                <span className="font-sans font-black text-lg sm:text-xl text-slate-900 tracking-tight leading-none">
                  SIPAKA<span className="text-[#94191C]">.</span>
                </span>
                <span className="text-[9px] font-semibold text-slate-500 tracking-wider uppercase mt-0.5 hidden sm:block">
                  Sistem Pelacakan Amandemen
                </span>
              </div>
            </Link>

            {/* Navigasi Utama Persisten */}
            <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                      active
                        ? 'text-[#94191C] bg-red-50/90 font-bold border-b-2 border-[#94191C] shadow-2xs'
                        : 'text-slate-700 hover:text-[#94191C] hover:bg-slate-50 font-semibold'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Tombol Masuk / Login Sisi Kanan */}
            <div className="flex items-center gap-3">
              {currentUser ? (
                <Link
                  href="/masuk"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-800 transition-colors"
                  title={`Masuk sebagai ${currentUser.name}`}
                >
                  <div className="w-5 h-5 rounded-full bg-[#94191C] text-white flex items-center justify-center text-[10px]">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{currentUser.name}</span>
                </Link>
              ) : (
                <Link
                  href="/masuk"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer hover:scale-102"
                >
                  <LogIn className="w-3.5 h-3.5 text-white" />
                  <span>Masuk / Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LogIn, UserPlus, CheckCircle2, AlertCircle,
  BookOpen, LogOut, Lock, Mail, User as UserIcon,
  Eye, EyeOff, GraduationCap, Scale,
  Bookmark, MessageSquare, ExternalLink, Loader2
} from 'lucide-react';
import { API_BASE, PublicUser, ROLE_LABEL } from './auth-shared';

interface MasukAuthCardProps {
  user: PublicUser | null;
  onAuthSuccess: (user: PublicUser) => void;
  onLogout: () => void;
}

/** Kartu utama autentikasi: sesi aktif, form masuk/daftar, dan panel transparansi. */
export default function MasukAuthCard({ user, onAuthSuccess, onLogout }: MasukAuthCardProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'MAHASISWA' | 'DOSEN'>('MAHASISWA');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [userTab, setUserTab] = useState<'profile' | 'bookmarks' | 'notes'>('profile');
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Ambil bookmark & notes saat user login
  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoadingData(true);
      try {
        const [bmRes, ntRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/bookmarks`, { credentials: 'include' }),
          fetch(`${API_BASE}/api/v1/notes`, { credentials: 'include' }),
        ]);
        if (!cancelled) {
          if (bmRes.ok) {
            const bmJson = await bmRes.json();
            if (Array.isArray(bmJson?.data)) setBookmarks(bmJson.data);
          }
          if (ntRes.ok) {
            const ntJson = await ntRes.json();
            if (Array.isArray(ntJson?.data)) setNotes(ntJson.data);
          }
        }
      } catch {
        // Abaikan
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const url = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login' ? { email, password } : { email, password, name, role };
      const res = await fetch(`${API_BASE}/api/v1${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.message || json?.error || `Gagal masuk (HTTP ${res.status})`);
        return;
      }
      onAuthSuccess(json.user);
      router.refresh();
    } catch {
      setError('API backend tidak terjangkau. Pastikan server API berjalan di port 4000.');
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    onLogout();
    router.refresh();
  };

  return (
    <main className="flex-1 max-w-md w-full mx-auto px-4 -mt-16 sm:-mt-20 pb-16 relative z-10">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        {/* Card Accent Top Bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#94191C] via-[#861619] to-amber-500" />

        <div className="p-6 sm:p-8">
          {user ? (
            /* State: Sesi Sudah Aktif */
            <div>
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#94191C] mx-auto flex items-center justify-center font-bold text-2xl mb-2.5 border border-red-200 shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#94191C] bg-red-50 px-2.5 py-0.5 rounded-md border border-red-200">
                  Sesi Aktif
                </span>
                <h2 className="font-sans text-lg font-extrabold text-slate-900 mt-1.5">
                  {user.name}
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
              </div>

              {/* Sub-tab Pengguna: Profil vs Markah vs Catatan */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold mb-4">
                <button
                  type="button"
                  onClick={() => setUserTab('profile')}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    userTab === 'profile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Profil
                </button>
                <button
                  type="button"
                  onClick={() => setUserTab('bookmarks')}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    userTab === 'bookmarks' ? 'bg-white text-[#94191C] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Bookmark className="w-3 h-3" />
                  <span>Markah ({bookmarks.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserTab('notes')}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    userTab === 'notes' ? 'bg-white text-[#94191C] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Catatan ({notes.length})</span>
                </button>
              </div>

              {userTab === 'profile' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Peran Pengguna</span>
                      <span className="font-bold text-[#94191C] bg-white px-2 py-0.5 rounded border border-slate-200">
                        {ROLE_LABEL[user.role] ?? user.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Status Otentikasi</span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Terverifikasi
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Markah Disimpan</span>
                      <span className="font-mono text-slate-700 font-bold">{bookmarks.length} Pasal</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Catatan Hukum</span>
                      <span className="font-mono text-slate-700 font-bold">{notes.length} Anotasi</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 hover:from-black hover:to-red-900 text-amber-300 border border-amber-500/40 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                      >
                        <Scale className="w-4 h-4 text-amber-400" />
                        <span>Buka Konsol Administrator ISO 9001/27001</span>
                      </Link>
                    )}

                    <Link
                      href="/uu/ite"
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#94191C] hover:bg-[#861619] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Buka Naskah Konsolidasi UU ITE</span>
                    </Link>

                    <button
                      onClick={logout}
                      className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-200 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar dari Sesi</span>
                    </button>
                  </div>
                </div>
              )}

              {userTab === 'bookmarks' && (
                <div className="space-y-3">
                  {loadingData ? (
                    <div className="flex items-center justify-center h-32 text-slate-400 gap-2 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memuat markah buku…</span>
                    </div>
                  ) : bookmarks.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
                      <Bookmark className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                      <p className="font-semibold text-slate-600">Belum ada markah buku.</p>
                      <p className="text-[11px]">Buka naskah undang-undang dan klik ikon markah pada pasal yang ingin disimpan.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {bookmarks.map((bm) => (
                        <Link
                          key={bm.id}
                          href={`/uu/${bm.instrumentSlug}?focus=${encodeURIComponent(bm.canonicalPath)}`}
                          className="p-3 rounded-xl border border-slate-200 bg-white hover:border-[#94191C] hover:bg-red-50/40 transition-all flex items-center justify-between group shadow-2xs block"
                        >
                          <div>
                            <span className="font-bold text-xs text-slate-900 group-hover:text-[#94191C] transition-colors block">
                              {bm.label}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {bm.canonicalPath}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#94191C] shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={logout}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-red-700 py-1.5 mt-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Keluar dari Akun</span>
                  </button>
                </div>
              )}

              {userTab === 'notes' && (
                <div className="space-y-3">
                  {loadingData ? (
                    <div className="flex items-center justify-center h-32 text-slate-400 gap-2 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memuat catatan hukum…</span>
                    </div>
                  ) : notes.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
                      <MessageSquare className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                      <p className="font-semibold text-slate-600">Belum ada catatan hukum.</p>
                      <p className="text-[11px]">Buka pasal di pembaca naskah, buka tab Catatan pada panel inspeksi untuk menambahkan catatan.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {notes.map((n) => {
                        const slug = n.canonicalPath.split('/')[0] || 'ite';
                        return (
                          <Link
                            key={n.id}
                            href={`/uu/${slug}?focus=${encodeURIComponent(n.canonicalPath)}`}
                            className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-1 block shadow-2xs group"
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                              <span className="text-[#94191C] font-semibold">{n.canonicalPath}</span>
                              <span>{new Date(n.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                            </div>
                            <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed">
                              {n.noteText}
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  <button
                    onClick={logout}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-red-700 py-1.5 mt-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Keluar dari Akun</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* State: Form Masuk / Daftar Akun */
            <div>
              {/* Switcher Tab Masuk vs Daftar */}
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-semibold mb-6">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'login'
                      ? 'bg-[#94191C] text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'register'
                      ? 'bg-[#94191C] text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Daftar</span>
                </button>
              </div>

              <div className="mb-5">
                <h2 className="font-sans text-xl font-extrabold text-slate-900">
                  {mode === 'login' ? 'Masuk ke SIPAKA' : 'Pendaftaran Anggota Baru'}
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {mode === 'login'
                    ? 'Silakan masukkan kredensial akun terdaftar Anda.'
                    : 'Lengkapi data untuk membuat akun mahasiswa atau dosen.'}
                </p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Lengkap
                    </label>
                    <div className="relative flex items-center">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nama lengkap dan gelar"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#94191C] focus:bg-white focus:ring-3 focus:ring-red-100 transition-all font-medium"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Email
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#94191C] focus:bg-white focus:ring-3 focus:ring-red-100 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kata Sandi
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#94191C] focus:bg-white focus:ring-3 focus:ring-red-100 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                      title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Pilih Peran Akademik
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('MAHASISWA')}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          role === 'MAHASISWA'
                            ? 'bg-[#94191C] text-white border-[#94191C] shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Mahasiswa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('DOSEN')}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          role === 'DOSEN'
                            ? 'bg-[#94191C] text-white border-[#94191C] shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Dosen / Peneliti</span>
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-xl text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-[#94191C] hover:bg-[#861619] disabled:opacity-50 text-white py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>{busy ? 'Memproses…' : mode === 'login' ? 'Masuk ke Akun' : 'Daftar Sekarang'}</span>
                </button>
              </form>

              {/* Penjelasan Transparansi Publik */}
              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Seluruh naskah undang-undang dan pelacakan amandemen dapat dibaca bebas tanpa login. Akun ditujukan untuk keperluan kurasi dan pencatatan akademik.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

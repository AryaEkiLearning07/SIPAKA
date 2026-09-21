'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

const ROLE_LABEL: Record<string, string> = {
  MAHASISWA: 'Mahasiswa',
  DOSEN: 'Dosen',
  KURATOR: 'Kurator Hukum',
  ADMIN: 'Administrator',
};

const DEMO_ACCOUNTS = [
  { email: 'mahasiswa@lexvera.local', password: 'lexvera-mahasiswa', ket: 'Mahasiswa — baca naskah & fitur belajar' },
  { email: 'dosen@lexvera.local', password: 'lexvera-dosen', ket: 'Dosen — kurasi ringan & anotasi' },
  { email: 'kurator@lexvera.local', password: 'lexvera-kurator', ket: 'Kurator — menyetujui ChangeSet' },
  { email: 'admin@lexvera.local', password: 'lexvera-admin', ket: 'Administrator' },
];

export default function MasukPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'MAHASISWA' | 'DOSEN'>('MAHASISWA');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<PublicUser | null>(null);

  // Periksa sesi aktif saat halaman dibuka
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          setUser(json.user);
        }
      } catch {
        /* belum masuk */
      }
    })();
  }, []);

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
        setError(json?.message || json?.error || `Gagal (HTTP ${res.status})`);
        return;
      }
      setUser(json.user);
    } catch (err) {
      setError(`API tidak terjangkau — jalankan API terlebih dahulu. (${err instanceof Error ? err.message : err})`);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch(`${API_BASE}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  const isiDemo = (e: string, p: string) => {
    setMode('login');
    setEmail(e);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Masthead */}
      <header className="border-b rule">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-baseline justify-between">
          <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
            LexVera<span className="text-seal">.</span>
          </Link>
          <Link href="/" className="text-xs font-semibold uppercase tracking-caps text-ink-mute hover:text-seal transition-colors">
            ← Kembali ke indeks
          </Link>
        </div>
        <div className="border-t rule" />
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-14 grid md:grid-cols-[5fr_4fr] gap-12 items-start">
        {/* Form */}
        <section>
          <p className="kicker">Ruang Anggota</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight leading-tight">
            {user ? 'Selamat datang kembali.' : mode === 'login' ? 'Masuk.' : 'Daftar anggota baru.'}
          </h1>
          <p className="mt-3 font-serif text-[15px] leading-relaxed text-ink-soft">
            {user
              ? 'Sesi Anda aktif. Peran menentukan hak akses kurasi dan fitur belajar.'
              : 'Membaca naskah tetap terbuka untuk umum; akun menghubungkan Anda dengan fitur belajar dan kurasi.'}
          </p>

          {user ? (
            <div className="mt-8 border rule bg-paper-deep">
              <div className="px-5 py-3 border-b rule flex items-center justify-between">
                <span className="kicker">Sesi Aktif</span>
                <span className="font-mono text-[10px] text-ink-faint">httpOnly · 7 hari</span>
              </div>
              <dl className="px-5 py-4 text-sm space-y-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-mute">Nama</dt>
                  <dd className="font-semibold text-ink">{user.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-mute">Email</dt>
                  <dd className="font-mono text-xs text-ink">{user.email}</dd>
                </div>
                <div className="flex justify-between gap-4 items-center">
                  <dt className="text-ink-mute">Peran</dt>
                  <dd>
                    <span className="inline-block px-2.5 py-1 text-[11px] font-bold uppercase tracking-caps bg-seal-wash text-seal-deep border border-seal/20">
                      {ROLE_LABEL[user.role] ?? user.role}
                    </span>
                  </dd>
                </div>
              </dl>
              <div className="px-5 py-3 border-t rule flex items-center justify-between">
                <Link href="/uu/ite" className="text-xs font-semibold text-seal hover:underline">
                  Buka naskah pilot →
                </Link>
                <button
                  onClick={logout}
                  className="border border-ink/20 px-4 py-2 text-xs font-semibold text-ink hover:border-seal hover:text-seal transition-colors cursor-pointer"
                >
                  Keluar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-4" data-testid="form-auth">
              {mode === 'register' && (
                <label className="block">
                  <span className="kicker">Nama Lengkap</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full bg-white border rule px-3 py-2.5 text-sm focus:outline-none focus:border-seal transition-colors"
                    placeholder="Nama Anda"
                  />
                </label>
              )}
              <label className="block">
                <span className="kicker">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full bg-white border rule px-3 py-2.5 text-sm focus:outline-none focus:border-seal transition-colors"
                  placeholder="nama@kampus.ac.id"
                />
              </label>
              <label className="block">
                <span className="kicker">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full bg-white border rule px-3 py-2.5 text-sm focus:outline-none focus:border-seal transition-colors"
                  placeholder="minimal 6 karakter"
                />
              </label>
              {mode === 'register' && (
                <div>
                  <span className="kicker">Peran</span>
                  <div className="mt-1 flex gap-2">
                    {(['MAHASISWA', 'DOSEN'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`px-4 py-2 text-xs font-semibold border transition-colors cursor-pointer ${
                          role === r
                            ? 'bg-ink text-paper border-ink'
                            : 'bg-white text-ink-mute border-ink/20 hover:border-ink/40'
                        }`}
                      >
                        {ROLE_LABEL[r]}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-ink-faint leading-relaxed">
                    Peran Kurator &amp; Administrator ditetapkan fakultas melalui panel admin.
                  </p>
                </div>
              )}
              {error && (
                <p className="text-xs font-semibold text-seal-deep bg-seal-wash border border-seal/20 px-3 py-2">
                  {error}
                </p>
              )}
              <div className="flex items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="bg-ink text-paper px-5 py-3 text-sm font-semibold hover:bg-ink-soft transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {busy ? 'Memproses…' : mode === 'login' ? 'Masuk' : 'Daftar & Masuk'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
                  className="text-xs font-semibold text-ink-mute hover:text-seal transition-colors cursor-pointer"
                >
                  {mode === 'login' ? 'Belum punya akun? Daftar →' : '← Kembali masuk'}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Panel akun demo */}
        {!user && (
          <aside className="border rule bg-paper-deep">
            <div className="px-5 py-3 border-b rule">
              <span className="kicker">Akun Demo · Klik untuk mengisi</span>
            </div>
            <ul className="divide-y divide-ink/5">
              {DEMO_ACCOUNTS.map((a) => (
                <li key={a.email}>
                  <button
                    onClick={() => isiDemo(a.email, a.password)}
                    className="w-full text-left px-5 py-3.5 hover:bg-white transition-colors cursor-pointer"
                  >
                    <p className="font-mono text-xs text-seal">{a.email}</p>
                    <p className="text-[11px] text-ink-mute mt-0.5">
                      {a.ket} · sandi: <span className="font-mono">{a.password}</span>
                    </p>
                  </button>
                </li>
              ))}
            </ul>
            <div className="px-5 py-3 border-t rule">
              <p className="text-[11px] leading-relaxed text-ink-faint">
                Akun demo hanya untuk masa pengembangan dan di-seed ulang setiap kali
                <span className="font-mono"> db:seed</span> dijalankan.
              </p>
            </div>
          </aside>
        )}
      </main>

      <footer className="border-t rule">
        <div className="max-w-4xl mx-auto px-6 py-8 text-[11px] font-semibold uppercase tracking-caps text-ink-faint">
          LexVera · Naskah riset non-resmi — rujuk Lembaran Negara RI untuk naskah resmi
        </div>
      </footer>
    </div>
  );
}

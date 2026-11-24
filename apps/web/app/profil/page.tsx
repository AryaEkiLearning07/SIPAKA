'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Award,
  BookOpen,
  MessageSquare,
  FileText,
  ShieldCheck,
  Trophy,
  Edit3,
  Check,
  Building,
  Bookmark,
  Scale,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  bio: string;
  institution: string;
  reputationPoints: number;
  reputationTitle: string;
  badges: Array<{ id: string; badgeName: string; description?: string; icon?: string; awardedAt: string }>;
  stats: {
    threadsCount: number;
    commentsCount: number;
    repositoryCount: number;
    bookmarksCount: number;
    annotationsCount: number;
  };
}

interface LeaderboardUser {
  id: string;
  name: string;
  role: string;
  institution?: string;
  reputationPoints: number;
  reputationTitle: string;
  rank: number;
}

export default function ProfilPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'repositori' | 'diskusi' | 'leaderboard'>('repositori');
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

  // Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/profile/me`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setProfile(json.data);
        setName(json.data.name);
        setInstitution(json.data.institution);
        setBio(json.data.bio);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/profile/leaderboard`);
      if (res.ok) {
        const json = await res.json();
        setLeaderboard(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchLeaderboard();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/profile/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, institution, bio }),
      });
      if (res.ok) {
        setIsEditing(false);
        fetchProfile();
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500 gap-3">
        <div className="w-8 h-8 border-4 border-[#94191C] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold">Memuat profil akademis...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-center">
        <h2 className="text-lg font-bold text-slate-800">Profil tidak ditemukan</h2>
        <Link href="/masuk" className="text-xs text-[#94191C] font-semibold underline mt-2 block">
          Masuk ke Akun
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* ── Banner Profil ── */}
      <section className="bg-gradient-to-b from-[#861619] via-[#94191C] to-[#6A2225] text-white pt-10 pb-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white text-[#94191C] font-black text-2xl sm:text-3xl flex items-center justify-center shadow-xl border-2 border-amber-300">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-3xl font-black font-serif text-white">{profile.name}</h1>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                    {profile.role}
                  </span>
                </div>
                <p className="text-white/80 text-xs sm:text-sm mt-1 flex items-center gap-1.5 font-medium">
                  <Building className="w-3.5 h-3.5 text-amber-300" />
                  <span>{profile.institution}</span>
                </p>
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold shadow-xs">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{profile.reputationTitle}</span>
                  <span className="font-mono bg-slate-950 text-amber-400 px-1.5 py-0.2 rounded text-[11px]">
                    {profile.reputationPoints} Pts
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Batal Ubah' : 'Ubah Profil'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Konten Profil & Statistik ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 space-y-6">
        {/* Form Edit Jika Aktif */}
        {isEditing && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Perbarui Data Profil</h3>
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instansi / Universitas</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bio Akademis</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-1.5 text-xs text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-[#94191C] text-white rounded-lg text-xs font-bold hover:bg-[#861619]"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Kartu Ringkasan Metrik & Lencana */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center">
            <span className="block text-xl sm:text-2xl font-black font-mono text-[#94191C]">
              {profile.stats.repositoryCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Karya Repositori</span>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center">
            <span className="block text-xl sm:text-2xl font-black font-mono text-blue-700">
              {profile.stats.threadsCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Thread Diskusi</span>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center">
            <span className="block text-xl sm:text-2xl font-black font-mono text-emerald-700">
              {profile.stats.commentsCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Argumen Dikirim</span>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center">
            <span className="block text-xl sm:text-2xl font-black font-mono text-amber-700">
              {profile.stats.bookmarksCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Pasal Ditandai</span>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center col-span-2 sm:col-span-1">
            <span className="block text-xl sm:text-2xl font-black font-mono text-purple-700">
              {profile.stats.annotationsCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Catatan Yuridis</span>
          </div>
        </div>

        {/* Lencana Prestasi */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Lencana Prestasi Reputasi ({profile.badges.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {profile.badges.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/60 to-white border border-amber-200 flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{b.badgeName}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab Navigasi Aktivitas ── */}
        <div className="border-b border-slate-200 flex items-center gap-4">
          <button
            onClick={() => setActiveTab('repositori')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'repositori'
                ? 'border-[#94191C] text-[#94191C]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Repositori Riset Saya
          </button>
          <button
            onClick={() => setActiveTab('diskusi')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'diskusi'
                ? 'border-[#94191C] text-[#94191C]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Diskusi Forum
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'border-[#94191C] text-[#94191C]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Papan Peringkat Yuris (Leaderboard)
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'repositori' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-900">Entri Studi Kasus &amp; Analisis Hukum</h4>
              <Link
                href="/repositori"
                className="text-xs font-bold text-[#94191C] hover:underline"
              >
                Buka Repositori Lengkap &rarr;
              </Link>
            </div>
            <p className="text-xs text-slate-600">
              Kunjungi menu <Link href="/repositori" className="text-[#94191C] font-semibold underline">Repositori Digital</Link> untuk menambah telaah studi kasus atau mengarsipkan hasil konsultasi Asisten AI.
            </p>
          </div>
        )}

        {activeTab === 'diskusi' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-900">Aktivitas di Forum Dialektika</h4>
              <Link href="/forum" className="text-xs font-bold text-[#94191C] hover:underline">
                Buka Forum Kasus &rarr;
              </Link>
            </div>
            <p className="text-xs text-slate-600">
              Anda telah berpartisipasi aktif dalam {profile.stats.threadsCount} thread dan {profile.stats.commentsCount} tanggapan hukum.
            </p>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Papan Peringkat Kontributor Hukum Nasional</span>
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Peringkat sivitas akademika berdasarkan poin kontribusi telaah kasus dan verifikasi argumen.
            </p>

            <div className="divide-y divide-slate-100">
              {leaderboard.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                        item.rank === 1
                          ? 'bg-amber-400 text-slate-950'
                          : item.rank === 2
                          ? 'bg-slate-300 text-slate-900'
                          : item.rank === 3
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.rank}
                    </span>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">{item.name}</span>
                      <span className="block text-[11px] text-slate-500">{item.institution || 'Fakultas Hukum'}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-[#94191C] block">
                      {item.reputationPoints} Pts
                    </span>
                    <span className="text-[10px] text-slate-400">{item.reputationTitle}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert, ShieldCheck, Users, FileText, CheckCircle2, Clock, 
  ArrowLeft, RefreshCw, KeyRound, AlertTriangle, Database, Activity,
  Lock, ExternalLink, ChevronRight, Check, X, Search, Filter, LogOut,
  Play, DownloadCloud, Cpu, Layers
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface AdminStats {
  totalUsers: number;
  totalInstruments: number;
  totalProvisions: number;
  totalOperations: number;
  pendingApprovalCount: number;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'MAHASISWA' | 'DOSEN' | 'KURATOR' | 'ADMIN';
  isDemo: boolean;
  createdAt: string;
  _count: {
    bookmarks: number;
    annotations: number;
  };
}

interface ChangeSetItem {
  id: string;
  title: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED';
  legalBasisNote?: string | null;
  amendingInstrument: {
    title: string;
    shortTitle?: string | null;
    number: number;
    year: number;
    type: string;
  };
  targetInstrument: {
    title: string;
    shortTitle?: string | null;
    number: number;
    year: number;
    type: string;
  };
  _count: {
    operations: number;
  };
}

interface AuditLogItem {
  id: string;
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: any;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [changeSets, setChangeSets] = useState<ChangeSetItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Crawler Worker Telemetry State
  const [crawlerData, setCrawlerData] = useState<any>(null);
  const [triggeringCrawler, setTriggeringCrawler] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'APPROVAL' | 'USERS' | 'LOGS'>('OVERVIEW');
  const [approvalModal, setApprovalModal] = useState<ChangeSetItem | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Filter states
  const [userSearch, setUserSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');

  // Login Form States (Khusus Gerbang Administrator Terisolasi)
  const [adminEmail, setAdminEmail] = useState('aryaeki@admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [adminLoginBusy, setAdminLoginBusy] = useState(false);

  // 1. Verifikasi Sesi Admin (Cek Sesi Admin Terisolasi Terlebih Dahulu)
  useEffect(() => {
    (async () => {
      try {
        // Cek endpoint admin terisolasi
        const resAdmin = await fetch(`${API_BASE}/api/v1/admin/auth/me`, { credentials: 'include' });
        if (resAdmin.ok) {
          const json = await resAdmin.json();
          if (json.admin && json.admin.role === 'ADMIN') {
            setCurrentUser(json.admin);
            setAuthChecking(false);
            return;
          }
        }

        // Fallback: Cek sesi umum jika akun berstatus ADMIN
        const resUser = await fetch(`${API_BASE}/api/v1/auth/me`, { credentials: 'include' });
        if (resUser.ok) {
          const json = await resUser.json();
          if (json.user && json.user.role === 'ADMIN') {
            setCurrentUser(json.user);
          }
        }
      } catch {
        // Belum login
      } finally {
        setAuthChecking(false);
      }
    })();
  }, []);

  // 2. Load data admin saat user terverifikasi ADMIN
  const loadAdminData = async () => {
    setLoadingData(true);
    try {
      const [ovRes, usrRes, csRes, logRes, crwRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/admin/overview`, { credentials: 'include' }),
        fetch(`${API_BASE}/api/v1/admin/users`, { credentials: 'include' }),
        fetch(`${API_BASE}/api/v1/admin/changesets`, { credentials: 'include' }),
        fetch(`${API_BASE}/api/v1/admin/audit-logs?limit=50`, { credentials: 'include' }),
        fetch(`${API_BASE}/api/v1/admin/crawler/status`, { credentials: 'include' }),
      ]);

      if (ovRes.ok) {
        const json = await ovRes.json();
        setStats(json.stats);
      }
      if (usrRes.ok) {
        const json = await usrRes.json();
        setUsers(json.data || []);
      }
      if (csRes.ok) {
        const json = await csRes.json();
        setChangeSets(json.data || []);
      }
      if (logRes.ok) {
        const json = await logRes.json();
        setAuditLogs(json.data || []);
      }
      if (crwRes.ok) {
        const json = await crwRes.json();
        setCrawlerData(json.data);
      }
    } catch {
      // Abaikan
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role === 'ADMIN') {
      loadAdminData();
    }
  }, [currentUser]);

  // Polling Telemetri Crawler Berkala saat Tab Ikhtisar Aktif
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'ADMIN' || activeTab !== 'OVERVIEW') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/admin/crawler/status`, { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          setCrawlerData(json.data);
        }
      } catch {
        // ignore
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [currentUser, activeTab]);

  // Handler Picu Batch Harvester
  const handleTriggerCrawler = async (limit = 5) => {
    setTriggeringCrawler(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/crawler/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ limit }),
      });
      const json = await res.json();
      if (res.ok) {
        setActionMessage(json.message);
        setTimeout(() => setActionMessage(null), 5000);
        // Muat status terbaru
        setTimeout(async () => {
          const cRes = await fetch(`${API_BASE}/api/v1/admin/crawler/status`, { credentials: 'include' });
          if (cRes.ok) {
            const cJson = await cRes.json();
            setCrawlerData(cJson.data);
          }
        }, 1200);
      } else {
        setActionMessage(json.message || 'Gagal memicu worker crawler');
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch {
      setActionMessage('Koneksi ke backend API terputus.');
      setTimeout(() => setActionMessage(null), 4000);
    } finally {
      setTriggeringCrawler(false);
    }
  };

  // Handler Login Eksklusif Administrator Utama
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    setAdminLoginBusy(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });

      const json = await res.json();
      if (!res.ok) {
        setAdminLoginError(json.message || json.error || `Autentikasi gagal (HTTP ${res.status})`);
        return;
      }

      setCurrentUser(json.admin);
      setAdminPassword('');
    } catch {
      setAdminLoginError('Gagal menghubungi server API. Pastikan server backend Fastify aktif di port 4000.');
    } finally {
      setAdminLoginBusy(false);
    }
  };

  // Handler ubah peran user
  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        const json = await res.json();
        setActionMessage(json.message);
        setTimeout(() => setActionMessage(null), 3500);
        loadAdminData();
      }
    } catch {
      // Abaikan
    }
  };

  // Handler approval ISO 9001
  const handleProcessApproval = async (decision: 'APPROVED' | 'CHANGES_REQUESTED') => {
    if (!approvalModal) return;
    setSubmittingApproval(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/changesets/${approvalModal.id}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          decision,
          notes: approvalNotes.trim() || undefined,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setActionMessage(json.message);
        setApprovalModal(null);
        setApprovalNotes('');
        setTimeout(() => setActionMessage(null), 4000);
        loadAdminData();
      }
    } catch {
      // Abaikan
    } finally {
      setSubmittingApproval(false);
    }
  };

  // Handler logout administrator
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/v1/admin/auth/logout`, { method: 'POST', credentials: 'include' });
      await fetch(`${API_BASE}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    setCurrentUser(null);
  };

  // Render kondisi loading
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-[#94191C]" />
          <span className="text-sm font-semibold">Memverifikasi otoritas otentikasi administrator…</span>
        </div>
      </div>
    );
  }

  // Render Form Login Administrator Eksklusif jika belum terautentikasi
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 font-sans p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-7 sm:p-8 space-y-5 shadow-2xl backdrop-blur-md relative overflow-hidden">
          {/* Top Line Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#94191C] via-amber-500 to-[#94191C]" />

          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-800/80 text-rose-400 mx-auto flex items-center justify-center shadow-inner">
              <KeyRound className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/50 px-2.5 py-0.5 rounded border border-amber-800/60">
                ISO 9001:2015 &amp; ISO 27001 Gateway
              </span>
              <h1 className="text-xl font-extrabold text-white mt-2">
                Konsol Administrator Utama
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Akses terproteksi pengendalian naskah &amp; buku log jejak audit sistem.
              </p>
            </div>
          </div>

          {adminLoginError && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{adminLoginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username / Email Administrator
              </label>
              <input
                type="text"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="aryaeki@admin"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showAdminPassword ? <X className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={adminLoginBusy}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#94191C] hover:bg-[#861619] disabled:bg-slate-700 text-white font-bold text-xs transition-colors shadow-lg shadow-red-950/60 cursor-pointer"
            >
              {adminLoginBusy ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Kredensial ISO…</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>Masuk ke Konsol Administrator</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-800">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Beranda Publik</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      
      {/* Top Banner Kepatuhan ISO & Informasi Akun */}
      <div className="bg-[#861619] text-white text-xs py-2 px-4 sm:px-8 border-b border-[#6A2225] select-none shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="bg-[#6A2225] text-amber-300 px-2 py-0.5 rounded font-mono font-bold text-[10px] tracking-wide uppercase border border-amber-300/30">
              ISO 9001:2015 &amp; ISO 27001
            </span>
            <span className="text-white/90 text-xs hidden sm:inline">
              Console Pengendalian Informasi Terdokumentasi &amp; Jejak Audit Sistem
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
              <span>Administrator: {currentUser.name} ({currentUser.email})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Header Utama Dashboard Admin */}
      <header className="bg-[#94191C] text-white border-b border-[#861619] sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-black/20 hover:bg-black/35 text-white/90 transition-colors"
              title="Kembali ke Portal Publik"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg sm:text-xl tracking-tight">
                  SIPAKA Executive Admin Console
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/30 text-amber-300 font-bold border border-white/10">
                  v0.2.1-ISO
                </span>
              </div>
              <p className="text-[11px] text-white/75 mt-0.5">
                Pusat Tata Kelola Dokumen Hukum, Persetujuan Perubahan, &amp; Manajemen Pengguna
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAdminData}
              disabled={loadingData}
              className="p-2 rounded-xl bg-black/20 hover:bg-black/35 text-white transition-colors cursor-pointer"
              title="Perbarui Data Live"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl bg-black/30 hover:bg-rose-900/60 border border-white/15 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Action Message Banner */}
      {actionMessage && (
        <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 text-center flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Sub-Navbar Navigasi Tab */}
      <div className="bg-white border-b border-slate-200/80 sticky top-18 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center gap-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'OVERVIEW'
                ? 'bg-[#94191C] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Ikhtisar &amp; KPI Telemetri</span>
          </button>

          <button
            onClick={() => setActiveTab('APPROVAL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'APPROVAL'
                ? 'bg-[#94191C] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Gerbang Persetujuan Naskah (ISO 7.5.3)</span>
            {stats && stats.pendingApprovalCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-900 text-[10px] flex items-center justify-center font-bold">
                {stats.pendingApprovalCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'USERS'
                ? 'bg-[#94191C] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Tata Kelola Pengguna ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'LOGS'
                ? 'bg-[#94191C] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Buku Jejak Audit (ISO 27001)</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-6">

        {/* ── TAB 1: IKHTISAR & TELEMETRI SISTEM ── */}
        {activeTab === 'OVERVIEW' && stats && (
          <div className="space-y-6">
            {/* 4 Kartu KPI Metrik */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Pengguna Terdaftar
                  </span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">
                    {stats.totalUsers}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Mahasiswa, Dosen, &amp; Kurator</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#94191C] flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Instrumen Hukum
                  </span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">
                    {stats.totalInstruments}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">Terkodifikasi di MariaDB</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Database className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total Pasal &amp; Ayat
                  </span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">
                    {stats.totalProvisions}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Pohon Hierarki Norma</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Operasi Amandemen
                  </span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">
                    {stats.totalOperations}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Mutasi Konsolidasi Disimpan</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Panel Status Infrastruktur MariaDB & Standar ISO */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Infrastruktur Basis Data &amp; Protokol Integritas
                    </h3>
                    <p className="text-xs text-slate-500">Koneksi MariaDB 10.4/10.11 InnoDB (Port 3307 Lokal ➔ Port 3306 VPS)</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  OPERASIONAL NORMAL
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-medium block">Standar Kepatuhan:</span>
                  <span className="font-bold text-slate-900 block">ISO 9001:2015 Klausul 7.5</span>
                  <span className="text-[11px] text-slate-500 block">Pengendalian dokumen &amp; riwayat revisi resmi</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-medium block">Integritas Jejak Audit:</span>
                  <span className="font-bold text-slate-900 block">ISO 27001 Annex A.12.4</span>
                  <span className="text-[11px] text-slate-500 block">Log audit tidak dapat diubah (append-only)</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-medium block">Kredensial Sesi Admin:</span>
                  <span className="font-bold text-[#94191C] block font-mono">{currentUser.email}</span>
                  <span className="text-[11px] text-slate-500 block">Hak wewenang approval penuh</span>
                </div>
              </div>
            </div>

            {/* Pusat Kendali Worker Crawler & Ingestion Data (JDIH BPK) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#94191C] flex items-center justify-center border border-red-200 shadow-2xs">
                    <DownloadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">
                        Pusat Kendali Worker Harvester &amp; Ingestion Data (JDIH BPK)
                      </h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        Ethical Limiter 1.5s
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pemanenan massal otomatis: Scrape Metadata ➔ Unduh PDF ➔ Parse AST JSON ➔ QA Skor 100 ➔ Ingest MariaDB.
                    </p>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2">
                  {crawlerData?.worker?.state === 'RUNNING' ? (
                    <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                      AKTIF MEMPROSES (PID: {crawlerData?.worker?.pid || '-'})
                    </span>
                  ) : crawlerData?.worker?.state === 'IDLE' ? (
                    <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      SIAP (IDLE)
                    </span>
                  ) : (
                    <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      STANDBY / SIAP DIPICU
                    </span>
                  )}
                </div>
              </div>

              {/* 4 Kolom Telemetri Antrean */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-sans">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10.5px] font-medium text-slate-500 block">Total Terindeks di JDIH</span>
                  <span className="text-lg font-black text-slate-900 mt-0.5 block font-mono">
                    {crawlerData?.queue?.totalIndexed?.toLocaleString('id-ID') || '1.325'} Dokumen
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Katalog master BPK RI</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10.5px] font-medium text-slate-500 block">Metadata Kaya (Rich)</span>
                  <span className="text-lg font-black text-slate-900 mt-0.5 block font-mono">
                    {crawlerData?.queue?.totalRich?.toLocaleString('id-ID') || '14'} Dokumen
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">LN, TLN, &amp; Relasi Siap</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10.5px] font-medium text-slate-500 block">Checkpoint Sesi</span>
                  <span className="text-lg font-black text-[#94191C] mt-0.5 block font-mono">
                    {crawlerData?.checkpoint?.totalProcessed || 0} Selesai
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {crawlerData?.checkpoint?.lastRun ? new Date(crawlerData.checkpoint.lastRun).toLocaleDateString('id-ID') : 'Belum dijalankan'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10.5px] font-medium text-slate-500 block">Sisa Antrean Pemanenan</span>
                  <span className="text-lg font-black text-amber-700 mt-0.5 block font-mono">
                    {crawlerData?.queue?.pending?.toLocaleString('id-ID') || '1.325'} Tertunda
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Menunggu giliran worker</span>
                </div>
              </div>

              {/* Status Dokumen yang Sedang Dikerjakan (Jika Aktif) */}
              {crawlerData?.worker?.state === 'RUNNING' && crawlerData?.worker?.currentSlug && (
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/70 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                      Fase Aktif: {crawlerData.worker.phase || 'MEMPROSES'}
                    </span>
                    <p className="font-semibold text-slate-800 text-xs mt-1">
                      {crawlerData.worker.currentTitle || crawlerData.worker.currentSlug}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500">{crawlerData.worker.currentSlug}</p>
                  </div>
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={triggeringCrawler || crawlerData?.worker?.state === 'RUNNING'}
                    onClick={() => handleTriggerCrawler(5)}
                    className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-[#94191C] hover:bg-[#861619] disabled:bg-slate-300 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    {triggeringCrawler ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Memicu Worker Harvester…</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Picu Panen 5 Dokumen Baru</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={triggeringCrawler || crawlerData?.worker?.state === 'RUNNING'}
                    onClick={() => handleTriggerCrawler(10)}
                    className="inline-flex items-center gap-2 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>Batch 10 Dokumen</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Kontrol Terminal VPS:</span>
                  <code className="bg-slate-100 text-slate-700 px-2 py-1 rounded font-mono text-[11px] border border-slate-200">
                    ./run_worker.sh start
                  </code>
                </div>
              </div>
            </div>

            {/* Riwayat Log Terakhir */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Aktivitas Sistem &amp; Log Terkini</h3>
                <button
                  onClick={() => setActiveTab('LOGS')}
                  className="text-xs text-[#94191C] font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Lihat Seluruh Log</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[10.5px] px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {log.action}
                        </span>
                        <span className="text-slate-500 font-medium">{log.entity}</span>
                      </div>
                      <p className="text-slate-700">
                        Oleh: <strong className="text-slate-900">{log.userName || log.userEmail || 'Sistem'}</strong>
                        {log.details && typeof log.details === 'object' && log.details.note && (
                          <span className="text-slate-500 ml-1.5 italic">— {log.details.note}</span>
                        )}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(log.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: GERBANG PERSETUJUAN NASKAH (ISO 7.5.3 APPROVAL GATE) ── */}
        {activeTab === 'APPROVAL' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Gerbang Persetujuan Naskah Hukum (Review &amp; Approval Gate)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Klausul 7.5.3 ISO 9001:2015 mensyaratkan setiap dokumen perubahan (ChangeSet) ditelaah dan disetujui Administrator sebelum disajikan kepada publik.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-100">
                {changeSets.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    Belum ada riwayat ChangeSet di database.
                  </div>
                ) : (
                  changeSets.map((cs) => {
                    const isPublished = cs.status === 'PUBLISHED';
                    return (
                      <div key={cs.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded border ${
                              isPublished
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              STATUS: {cs.status}
                            </span>
                            <span className="font-mono text-xs text-slate-500">
                              {cs._count.operations} Operasi Pasal Tersimpan
                            </span>
                          </div>

                          <h4 className="font-bold text-sm text-slate-900">
                            {cs.title}
                          </h4>

                          <p className="text-xs text-slate-600">
                            Instrumen Pengubah: <strong className="text-slate-800">{cs.amendingInstrument.shortTitle || cs.amendingInstrument.title}</strong> ➔ Menargetkan: <strong className="text-slate-800">{cs.targetInstrument.shortTitle || cs.targetInstrument.title}</strong>
                          </p>

                          {cs.legalBasisNote && (
                            <span className="text-[11px] font-mono text-slate-400 block">
                              Dasar Hukum: {cs.legalBasisNote}
                            </span>
                          )}
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <Link
                            href="/pipeline"
                            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1"
                          >
                            <span>Lihat Diff Pipeline</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>

                          {!isPublished && (
                            <button
                              onClick={() => {
                                setApprovalModal(cs);
                                setApprovalNotes('');
                              }}
                              className="px-4 py-2 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              <span>Beri Stempel Persetujuan ISO</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: TATA KELOLA PENGGUNA (USER GOVERNANCE) ── */}
        {activeTab === 'USERS' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari pengguna berdasarkan nama atau email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#94191C] focus:ring-1 focus:ring-[#94191C] outline-hidden text-slate-800"
                />
              </div>
              <span className="text-xs text-slate-500 font-semibold shrink-0">
                Total: {users.length} Akun Terdaftar
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Nama Lengkap &amp; Email</th>
                      <th className="py-3 px-4">Peran Hak Akses</th>
                      <th className="py-3 px-4">Aktivitas Koleksi</th>
                      <th className="py-3 px-4">Tanggal Terdaftar</th>
                      <th className="py-3 px-4 text-right">Otorisasi Peran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users
                      .filter((u) => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
                      .map((u) => {
                        const isSelf = u.email === currentUser.email;
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-red-50 text-[#94191C] font-bold flex items-center justify-center text-xs">
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block">{u.name} {isSelf && '(Anda)'}</span>
                                  <span className="text-[11px] font-mono text-slate-500">{u.email}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                u.role === 'ADMIN'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : u.role === 'DOSEN'
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                  : u.role === 'KURATOR'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {u.role}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-slate-600">
                              <span>{u._count.bookmarks} Markah · {u._count.annotations} Catatan</span>
                            </td>

                            <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                              {new Date(u.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })}
                            </td>

                            <td className="py-3 px-4 text-right">
                              {isSelf ? (
                                <span className="text-slate-400 italic text-[11px]">Administrator Utama</span>
                              ) : (
                                <select
                                  value={u.role}
                                  onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                                  className="text-xs rounded-lg border border-slate-200 px-2 py-1 bg-white font-semibold text-slate-700 focus:border-[#94191C] cursor-pointer"
                                >
                                  <option value="MAHASISWA">MAHASISWA</option>
                                  <option value="DOSEN">DOSEN</option>
                                  <option value="KURATOR">KURATOR</option>
                                  <option value="ADMIN">ADMIN</option>
                                </select>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: BUKU JEJAK AUDIT (ISO 27001 AUDIT TRAIL) ── */}
        {activeTab === 'LOGS' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari jejak audit berdasarkan aksi, entitas, atau nama operator..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#94191C] focus:ring-1 focus:ring-[#94191C] outline-hidden text-slate-800"
                />
              </div>
              <span className="text-xs text-slate-500 font-semibold shrink-0">
                Append-Only Ledger ({auditLogs.length} Entri Terkunci)
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Waktu (WIB)</th>
                      <th className="py-3 px-4">Aksi Audit ISO</th>
                      <th className="py-3 px-4">Entitas Terdampak</th>
                      <th className="py-3 px-4">Operator Pelaksana</th>
                      <th className="py-3 px-4">Detail Mutasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs
                      .filter((l) => l.action.toLowerCase().includes(logSearch.toLowerCase()) || (l.userName || '').toLowerCase().includes(logSearch.toLowerCase()))
                      .map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                            {new Date(log.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                            })}
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-[#94191C]">
                            {log.action}
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {log.entity} {log.entityId ? `(#${log.entityId.slice(0, 8)})` : ''}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900 block">{log.userName || log.userEmail || 'Sistem'}</span>
                            {log.userRole && (
                              <span className="text-[10px] font-mono text-slate-400">[{log.userRole}]</span>
                            )}
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-600 text-[11px] max-w-xs truncate">
                            {log.details ? JSON.stringify(log.details) : '—'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Persetujuan ISO 9001 (Approval Sign-Off) */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-[#94191C]">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900">
                  Pengesahan Naskah Amandemen (ISO 9001:2015 Clause 7.5.3)
                </h3>
              </div>
              <button
                onClick={() => setApprovalModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-medium block">Naskah yang Ditelaah:</span>
                <span className="font-bold text-slate-900 text-sm block">{approvalModal.title}</span>
                <span className="text-slate-600 block">{approvalModal.amendingInstrument.title}</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Catatan Kelaikan Dokumen Administrator (Approval Notes):
                </label>
                <textarea
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Contoh: Telah diverifikasi terhadap salinan resmi Lembaran Negara RI. Seluruh nomor pasal dan bunyi ayat valid."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:border-[#94191C] focus:outline-hidden leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setApprovalModal(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => handleProcessApproval('CHANGES_REQUESTED')}
                disabled={submittingApproval}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
              >
                Minta Revisi
              </button>

              <button
                type="button"
                onClick={() => handleProcessApproval('APPROVED')}
                disabled={submittingApproval}
                className="px-4 py-2 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white font-bold flex items-center gap-1.5 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Setujui &amp; Publikasikan Naskah</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

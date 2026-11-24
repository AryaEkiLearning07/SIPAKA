'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  MessageSquare,
  ThumbsUp,
  ShieldCheck,
  CheckCircle2,
  Scale,
  User,
  ArrowLeft,
  Share2,
  Check,
  Award,
} from 'lucide-react';
import { LatinTermBadge } from '@/app/components/LatinTermPopup';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface Comment {
  id: string;
  content: string;
  upvotesCount: number;
  hasUpvoted?: boolean;
  isVerified: boolean;
  verifiedBy?: string;
  verificationNote?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: string;
    institution?: string;
    reputationPoints: number;
    userBadges?: Array<{ badgeName: string; icon?: string }>;
  };
}

interface ThreadDetail {
  id: string;
  title: string;
  content: string;
  category: string;
  type: string;
  pasalLabel?: string;
  canonicalPath?: string;
  upvotesCount: number;
  hasUpvoted?: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: string;
    institution?: string;
    bio?: string;
    reputationPoints: number;
    userBadges?: Array<{ badgeName: string; icon?: string }>;
  };
  comments: Comment[];
}

export default function ThreadDetailPage() {
  const { id } = useParams() as { id: string };
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string; name: string } | null>(null);

  // Verifikasi Modal
  const [verifyingCommentId, setVerifyingCommentId] = useState<string | null>(null);
  const [verificationNote, setVerificationNote] = useState('');

  const fetchThread = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/forum/threads/${id}`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setThread(json.data);
      }
    } catch (err) {
      console.error('Failed to load thread:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThread();
    // Ambil current user
    fetch(`${API_BASE}/api/v1/auth/me`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, [id]);

  const handleThreadUpvote = async () => {
    if (!thread) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/forum/threads/${thread.id}/upvote`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        setThread({
          ...thread,
          upvotesCount: json.upvotesCount,
          hasUpvoted: json.upvoted,
        });
      }
    } catch (err) {
      console.error('Failed to upvote thread:', err);
    }
  };

  const handleCommentUpvote = async (commentId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/forum/comments/${commentId}/upvote`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        setThread((prev) =>
          prev
            ? {
                ...prev,
                comments: prev.comments.map((c) =>
                  c.id === commentId ? { ...c, upvotesCount: json.upvotesCount, hasUpvoted: json.upvoted } : c
                ),
              }
            : null
        );
      }
    } catch (err) {
      console.error('Failed to upvote comment:', err);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/forum/threads/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        setNewComment('');
        fetchThread();
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyComment = async (commentId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/forum/comments/${commentId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ verificationNote }),
      });

      if (res.ok) {
        setVerifyingCommentId(null);
        setVerificationNote('');
        fetchThread();
      }
    } catch (err) {
      console.error('Failed to verify comment:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500 gap-3">
        <div className="w-8 h-8 border-4 border-[#94191C] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold">Memuat diskusi kasus hukum...</p>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-center">
        <h2 className="text-lg font-bold text-slate-800">Thread tidak ditemukan</h2>
        <Link href="/forum" className="text-xs text-[#94191C] font-semibold underline mt-2 block">
          Kembali ke Forum
        </Link>
      </div>
    );
  }

  const isDosenOrKurator =
    currentUser?.role === 'DOSEN' || currentUser?.role === 'KURATOR' || currentUser?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* ── Header Navigasi ── */}
      <div className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-6 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/forum"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-[#94191C] text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Forum</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tautan Disalin' : 'Bagikan'}</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
        {/* ── Kartu Thread Utama ── */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-[#94191C] border border-red-100">
              {thread.category}
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {thread.type}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 font-medium">{new Date(thread.createdAt).toLocaleDateString('id-ID')}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 leading-snug">
            {thread.title}
          </h1>

          {/* Rujukan Pasal */}
          {thread.pasalLabel && (
            <div className="mt-4 p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="font-serif italic font-semibold">{thread.pasalLabel}</span>
              </div>
              <Link
                href={`/katalog?q=${encodeURIComponent(thread.pasalLabel)}`}
                className="font-mono text-[11px] font-bold text-[#94191C] hover:underline shrink-0"
              >
                Buka Teks Konsolidasi &rarr;
              </Link>
            </div>
          )}

          {/* Isi Duduk Perkara */}
          <div className="mt-5 text-sm text-slate-800 leading-relaxed whitespace-pre-line border-t border-slate-100 pt-5">
            {thread.content}
          </div>

          {/* Deteksi Istilah Latin dalam teks thread */}
          <LatinTermBadge text={thread.content} />

          {/* Footer Thread: Penulis & Upvote */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#94191C] text-white flex items-center justify-center font-bold text-xs">
                {thread.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900">{thread.user.name}</span>
                <span className="block text-[11px] text-slate-500">
                  {thread.user.institution || 'Fakultas Hukum'} ·{' '}
                  <strong className="text-amber-700 font-mono">{thread.user.reputationPoints} Pts</strong>
                </span>
              </div>
            </div>

            <button
              onClick={handleThreadUpvote}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                thread.hasUpvoted
                  ? 'bg-[#94191C] text-white border-[#861619] shadow-xs'
                  : 'bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-[#94191C] border-slate-200'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{thread.upvotesCount} Upvotes</span>
            </button>
          </div>
        </div>

        {/* ── Komentar & Argumen Hukum ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#94191C]" />
              <span>Argumen Yuridis &amp; Tanggapan ({thread.comments.length})</span>
            </h3>
            <span className="text-xs text-slate-500">Urut berdasarkan verifikasi dosen &amp; upvote</span>
          </div>

          {thread.comments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              Belum ada tanggapan. Berikan argumentasi hukum pertama Anda di bawah!
            </div>
          ) : (
            thread.comments.map((comment) => (
              <div
                key={comment.id}
                className={`rounded-2xl p-5 sm:p-6 transition-all border ${
                  comment.isVerified
                    ? 'bg-emerald-50/40 border-emerald-300 shadow-sm'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                {/* Header Komentar */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                      {comment.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{comment.user.name}</span>
                        {comment.user.role === 'DOSEN' && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                            Dosen
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-500">
                          {comment.user.reputationPoints} Pts
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(comment.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Lencana Verifikasi Jika Ada */}
                  {comment.isVerified && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300 shadow-2xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Argumen Terverifikasi</span>
                    </div>
                  )}
                </div>

                {/* Catatan Verifikasi Resmi Dosen */}
                {comment.isVerified && comment.verificationNote && (
                  <div className="mb-3 p-3 rounded-xl bg-emerald-100/60 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                    <strong className="block text-emerald-950 font-semibold mb-0.5">
                      Catatan Telaah Kurator ({comment.verifiedBy || 'Dosen'}):
                    </strong>
                    {comment.verificationNote}
                  </div>
                )}

                {/* Isi Komentar */}
                <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {comment.content}
                </div>

                <LatinTermBadge text={comment.content} />

                {/* Action Bar Komentar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleCommentUpvote(comment.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                      comment.hasUpvoted
                        ? 'bg-[#94191C] text-white border-[#861619]'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{comment.upvotesCount} Upvote</span>
                  </button>

                  {/* Tombol Verifikasi Khusus Dosen/Kurator */}
                  {isDosenOrKurator && !comment.isVerified && (
                    <button
                      onClick={() => setVerifyingCommentId(comment.id)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verifikasi Argumen (+15 Reputasi)</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Form Tambah Komentar ── */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <h4 className="text-sm font-bold text-slate-900 mb-1">Kirim Argumentasi / Analisis Hukum</h4>
          <p className="text-xs text-slate-500 mb-4">
            Sampaikan telaah hukum berdasar pasal, asas hukum, atau putusan pengadilan. Komentar bermutu mendapat{' '}
            <strong className="text-emerald-600">+2 Poin Reputasi</strong>.
          </p>

          <form onSubmit={handleSubmitComment} className="space-y-3">
            <textarea
              required
              rows={4}
              placeholder="Tuliskan argumen hukum Anda secara terstruktur (identifikasi isu hukum, dasar peraturan, dan pertimbangan doktrinal)..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#94191C]"
            />

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-6 py-2.5 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Mengirim...' : 'Kirim Argumen (+2 Reputasi)'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* ── Modal Verifikasi Dosen/Kurator ── */}
      {verifyingCommentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Verifikasi Argumen Hukum</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Sebagai Dosen/Kurator, Anda memvalidasi bahwa argumen ini sahih secara metodologi hukum. Penulis akan
              menerima <strong>+15 Poin Reputasi</strong>.
            </p>

            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Peninjauan / Dasar Yuridis (Opsional)
            </label>
            <textarea
              rows={3}
              placeholder="Contoh: Argumen selaras dengan yurisprudensi Mahkamah Agung No... dan asas Ultimum Remedium."
              value={verificationNote}
              onChange={(e) => setVerificationNote(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setVerifyingCommentId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => handleVerifyComment(verifyingCommentId)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Sematkan Lencana Verifikasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

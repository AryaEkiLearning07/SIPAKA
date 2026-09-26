'use client';

import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { InspectorState } from '../../reader-types';
import AiAnalysisModal from './AiAnalysisModal';

interface ReaderModalsProps {
  showLoginPrompt: boolean;
  setShowLoginPrompt: (v: boolean) => void;
  showAiModal: boolean;
  setShowAiModal: (v: boolean) => void;
  inspectorNode: InspectorState | null;
  currentUser: { name: string; role: string } | null;
}

export default function ReaderModals(p: ReaderModalsProps) {
  return (
    <>
      {/* Modal Prompt: Fitur Lanjutan Perlu Login */}
      {p.showLoginPrompt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-sans font-bold text-lg text-slate-900">
              Fitur Khusus Pengguna Terdaftar
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 mt-2">
              <strong>Naskah konsolidasi, riwayat amandemen, dan silsilah hukum dapat diakses bebas tanpa login oleh publik.</strong>
            </p>
            <p className="text-xs leading-relaxed text-slate-600 mt-1.5">
              Fitur <em>Analisis Delik Yuridis AI</em> dan kurasi anotasi memerlukan akun Mahasiswa, Dosen FH, atau Kurator Ahli.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/masuk"
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs text-center transition-colors shadow-xs"
              >
                Masuk Akun Demo (1-Klik) →
              </Link>
              <button
                onClick={() => p.setShowLoginPrompt(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Lanjut Baca Publik
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Hasil Analisis Delik AI (Jika Sudah Login) */}
      {p.showAiModal && p.inspectorNode && (
        <AiAnalysisModal
          node={p.inspectorNode}
          currentUser={p.currentUser}
          onClose={() => p.setShowAiModal(false)}
        />
      )}

    </>
  );
}


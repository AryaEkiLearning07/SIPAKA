'use client';

import React, { useState, useEffect } from 'react';
import {
  FolderTree, Database, Download, CheckCircle2,
  Clock, ArrowRight, Layers, Sparkles, Filter,
  ShieldCheck, AlertCircle, Play, RefreshCw
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FamilyDocument {
  slug: string;
  label: string;
  role: string;
  status: string;
  inDb: boolean;
  provisions: number;
}

interface LawFamily {
  id: string;
  name: string;
  description: string;
  coreLaw: string;
  status: string;
  documents: FamilyDocument[];
}

interface FamilyQueueTabProps {
  onSelectStation: (stationId: 1 | 2 | 3 | 4 | 5) => void;
}

export default function FamilyQueueTab({ onSelectStation }: FamilyQueueTabProps) {
  const [families, setFamilies] = useState<LawFamily[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('siber-ite');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/monitoring/families`);
        if (res.ok) {
          const json = await res.json();
          if (active && json.families) {
            setFamilies(json.families);
          }
        }
      } catch {
        // fallback diam
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const selectedFamily = families.find((f) => f.id === selectedFamilyId) || families[0];

  return (
    <div className="space-y-6">
      {/* Header Rumpun */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-[#94191C]/30 text-rose-300 border border-[#94191C]/40">
              <FolderTree className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-bold uppercase text-slate-400">
              Pengelompokan Rumpun &amp; Antrean Download
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            Keluarga Regulasi &amp; Antrean Pemanenan
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dokumen dikelompokkan berdasarkan keluarga hukum (UU Pokok + seluruh UU Pengubahnya) agar silsilah tidak tercecer saat diunduh.
          </p>
        </div>
      </div>

      {/* Grid Kartu Keluarga Regulasi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {families.map((fam) => {
          const isSelected = fam.id === selectedFamilyId;
          const inDbCount = fam.documents.filter((d) => d.inDb).length;
          const totalDocs = fam.documents.length;
          const isFull = inDbCount === totalDocs;

          return (
            <div
              key={fam.id}
              onClick={() => setSelectedFamilyId(fam.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'border-rose-500 bg-rose-950/20 shadow-xl shadow-rose-950/20 ring-1 ring-rose-500/30'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    isFull
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {isFull ? '100% TERINGEST' : `${inDbCount}/${totalDocs} DI DB`}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {totalDocs} Instrumen
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white line-clamp-1">{fam.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {fam.description}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono text-[11px] truncate">
                  Pokok: <strong className="text-slate-300">{fam.coreLaw}</strong>
                </span>
                <span className="text-rose-400 text-xs font-bold shrink-0 ml-2">Pilih →</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rincian Anggota Keluarga Terpilih & Manajemen Antrean */}
      {selectedFamily && (
        <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/5 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
                  Rumpun Terpilih:
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white font-mono font-bold">
                  {selectedFamily.id}
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-1">{selectedFamily.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{selectedFamily.description}</p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-mono text-slate-300 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Pemanenan Kluster Otomatis Terjadwal</span>
            </div>
          </div>

          {/* Tabel Anggota Regulasi dalam Keluarga Ini */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/[0.04] text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-2.5 px-3">Peran Regulasi</th>
                  <th className="py-2.5 px-3">Identitas Peraturan</th>
                  <th className="py-2.5 px-3">Status Hukum</th>
                  <th className="py-2.5 px-3">Di MariaDB</th>
                  <th className="py-2.5 px-3">Node Norma</th>
                  <th className="py-2.5 px-3 text-right">Aksi Pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {selectedFamily.documents.map((doc, idx) => (
                  <tr key={doc.slug + idx} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        doc.role.includes('POKOK') ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                        doc.role.includes('AMANDEMEN') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}>
                        {doc.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">
                      {doc.label}
                      <span className="text-[11px] text-slate-500 block font-normal">{doc.slug}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        doc.status === 'BERLAKU' ? 'bg-emerald-500/20 text-emerald-300' :
                        doc.status === 'DIUBAH' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {doc.inDb ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Tersimpan</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Dalam Antrean</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {doc.provisions > 0 ? `${doc.provisions} pasal` : 'Instrumen Pengubah'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {doc.inDb ? (
                        <button
                          onClick={() => onSelectStation(5)}
                          className="text-emerald-400 hover:text-emerald-300 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Lihat Naskah Jadi</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs font-mono inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                          <span>Antrean Terjadwal</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

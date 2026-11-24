'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GitBranch, GitCommit, Scale, FileText, ArrowDown, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface LineageNode {
  id: string;
  label: string;
  subLabel: string;
  type: 'ROOT' | 'AMENDMENT' | 'REGULATION' | 'RULING';
  year: number;
  status: string;
  slug?: string;
  changesCount?: number;
}

interface LineageEdge {
  from: string;
  to: string;
  label: string;
  type: string;
}

interface LineageTreeData {
  title: string;
  tree: {
    nodes: LineageNode[];
    edges: LineageEdge[];
  };
}

export default function VisualLineageTree({ slug }: { slug: string }) {
  const [data, setData] = useState<LineageTreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<LineageNode | null>(null);

  useEffect(() => {
    async function fetchTree() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/v1/instruments/${slug}/lineage-tree`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          if (json.tree?.nodes?.length > 0) {
            setSelectedNode(json.tree.nodes[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch lineage tree:', err);
      } finally {
        setLoading(false);
      }
    }

    if (slug) fetchTree();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500 bg-white rounded-2xl border border-slate-200">
        <div className="w-8 h-8 border-4 border-[#94191C] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold">Merakit pohon silsilah &amp; relasi amandemen...</p>
      </div>
    );
  }

  if (!data || !data.tree || data.tree.nodes.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <GitBranch className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-600">Pohon silsilah belum terdata untuk instrumen ini.</p>
      </div>
    );
  }

  const rootNode = data.tree.nodes.find((n) => n.type === 'ROOT');
  const amendmentNodes = data.tree.nodes.filter((n) => n.type === 'AMENDMENT');
  const rulingNodes = data.tree.nodes.filter((n) => n.type === 'RULING');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
      {/* Header Visualizer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-[#94191C] font-mono text-[10px] font-bold uppercase tracking-wider mb-1">
            <GitBranch className="w-3 h-3" />
            <span>Pohon Silsilah Peraturan (Genealogy Tree)</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Diagram Relasi Amandemen &amp; Preseden Yuridis
          </h3>
          <p className="text-xs text-slate-500">
            Visualisasi alur silsilah undang-undang pokok, rangkaian undang-undang perubahan, dan putusan uji materiil MK.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
          <GitCommit className="w-3.5 h-3.5 text-[#94191C]" />
          <span>{amendmentNodes.length} Amandemen Terverifikasi</span>
        </div>
      </div>

      {/* Grid Layout: Visual Tree di Kiri, Inspector Detail di Kanan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Visual Pohon (Canvas/DOM Tree) */}
        <div className="lg:col-span-8 bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col items-center">
          {/* 1. Root Node (UU Pokok) */}
          {rootNode && (
            <div className="w-full max-w-md">
              <button
                onClick={() => setSelectedNode(rootNode)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-sm ${
                  selectedNode?.id === rootNode.id
                    ? 'bg-[#94191C] text-white border-[#861619] shadow-md scale-102'
                    : 'bg-white text-slate-900 border-slate-300 hover:border-[#94191C]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      selectedNode?.id === rootNode.id
                        ? 'bg-white/20 text-white'
                        : 'bg-red-50 text-[#94191C]'
                    }`}
                  >
                    Undang-Undang Pokok (Dasar)
                  </span>
                  <span className="text-xs font-mono font-bold">Th {rootNode.year}</span>
                </div>
                <h4 className="text-base font-bold font-serif">{rootNode.label}</h4>
                <p
                  className={`text-xs mt-1 truncate ${
                    selectedNode?.id === rootNode.id ? 'text-white/80' : 'text-slate-500'
                  }`}
                >
                  {rootNode.subLabel}
                </p>
              </button>
            </div>
          )}

          {/* Connectors & Amendments Timeline */}
          {amendmentNodes.map((node, idx) => (
            <React.Fragment key={node.id}>
              {/* Connector Arrow */}
              <div className="flex flex-col items-center my-2">
                <div className="w-0.5 h-6 bg-slate-300" />
                <div className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono font-bold flex items-center gap-1 shadow-2xs">
                  <ArrowDown className="w-3 h-3 text-[#94191C]" />
                  <span>Mengubah &amp; Menyisipkan Norma (Tahun {node.year})</span>
                </div>
                <div className="w-0.5 h-6 bg-slate-300" />
              </div>

              {/* Node Amandemen */}
              <div className="w-full max-w-md">
                <button
                  onClick={() => setSelectedNode(node)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-sm ${
                    selectedNode?.id === node.id
                      ? 'bg-[#94191C] text-white border-[#861619] shadow-md scale-102'
                      : 'bg-white text-slate-900 border-slate-300 hover:border-[#94191C]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        selectedNode?.id === node.id
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-50 text-blue-800'
                      }`}
                    >
                      {node.subLabel}
                    </span>
                    <span className="text-xs font-mono font-bold">Tahun {node.year}</span>
                  </div>
                  <h4 className="text-base font-bold font-serif">{node.label}</h4>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span
                      className={`font-mono text-[11px] ${
                        selectedNode?.id === node.id ? 'text-white/80' : 'text-slate-500'
                      }`}
                    >
                      {node.changesCount ? `${node.changesCount} Operasi Konsolidasi` : 'Naskah Resmi'}
                    </span>
                    <span
                      className={`font-semibold text-[11px] px-2 py-0.5 rounded-full ${
                        selectedNode?.id === node.id
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      Berlaku Efektif
                    </span>
                  </div>
                </button>
              </div>
            </React.Fragment>
          ))}

          {/* Uji Materiil Mahkamah Konstitusi (Branch Node) */}
          {rulingNodes.length > 0 && (
            <div className="w-full max-w-md mt-6 pt-5 border-t border-dashed border-slate-300">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-2 text-center">
                Preseden &amp; Putusan Uji Konstitusionalitas (MKRI)
              </span>
              {rulingNodes.map((ruling) => (
                <button
                  key={ruling.id}
                  onClick={() => setSelectedNode(ruling)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedNode?.id === ruling.id
                      ? 'bg-amber-900 text-white border-amber-800 shadow-md'
                      : 'bg-amber-50 text-amber-950 border-amber-300 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1">
                    <span className="flex items-center gap-1">
                      <Scale className="w-3 h-3 text-amber-500" />
                      UJI MATERIIL
                    </span>
                    <span>Tahun {ruling.year}</span>
                  </div>
                  <h5 className="text-sm font-bold">{ruling.label}</h5>
                  <p className="text-xs text-amber-800 mt-0.5">{ruling.subLabel}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Kolom Detail Panel Terpilih di Kanan */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs sticky top-24">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-2">
            Inspektur Node Silsilah
          </span>

          {selectedNode ? (
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-mono font-bold mb-3">
                {selectedNode.type === 'ROOT' && <FileText className="w-3.5 h-3.5 text-[#94191C]" />}
                {selectedNode.type === 'AMENDMENT' && <GitCommit className="w-3.5 h-3.5 text-blue-600" />}
                {selectedNode.type === 'RULING' && <Scale className="w-3.5 h-3.5 text-amber-600" />}
                <span>{selectedNode.type}</span>
              </div>

              <h4 className="text-base font-bold font-serif text-slate-900 leading-snug">
                {selectedNode.label}
              </h4>
              <p className="text-xs text-slate-600 mt-1">{selectedNode.subLabel}</p>

              <div className="mt-4 space-y-2.5 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tahun Diundangkan:</span>
                  <span className="font-mono font-semibold">{selectedNode.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Keberlakuan:</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {selectedNode.status}
                  </span>
                </div>
                {selectedNode.changesCount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Operasi Perubahan:</span>
                    <span className="font-mono font-semibold">{selectedNode.changesCount} Ketentuan</span>
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-2">
                <Link
                  href={`/uu/${slug}`}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#94191C] hover:bg-[#861619] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Buka Naskah Konsolidasi</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={`/forum?search=${encodeURIComponent(selectedNode.label)}`}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Cari Diskusi Kasus Terkait</span>
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Pilih salah satu node pada diagram untuk melihat detail silsilah.</p>
          )}
        </div>
      </div>
    </div>
  );
}

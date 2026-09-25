'use client';

import React, { useState } from 'react';
import { ProvisionNode, ProvisionDiffResult } from '@lexvera/types';
import { getProvisionAmendmentDetail } from './impact-data';
import { API_BASE, InspectorState, InspectorTab, RiwayatVersi } from './reader-types';

/**
 * Hook inspektor norma: membuka panel, menghitung diff server-side,
 * dan menggabungkan detail dampak regulasi terdampak (impact-data).
 */
export function useInspector(
  slug: string,
  selectedTimeline: string | null,
  years: string[],
  setActiveNodePath: (path: string) => void
) {
  const [inspectorNode, setInspectorNode] = useState<InspectorState | null>(null);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('diff');

  const handleOpenInspector = async (node: ProvisionNode, parentLabel?: string) => {
    if (!selectedTimeline) return;
    setActiveNodePath(node.canonicalPath);
    const detail = getProvisionAmendmentDetail(node.canonicalPath, node.label);

    // KETENTUAN PENGGUNA: Sidebar kanan HANYA muncul saat memilih pasal/ayat yang mengalami amandemen!
    const hasAmendment =
      detail.statusPerubahan !== 'ASLI' ||
      node.versionTag?.startsWith('AMENDMENT') ||
      node.versionTag?.startsWith('AMEND') ||
      Boolean(node.isRepealed) ||
      Boolean(detail.putusanMk);

    if (!hasAmendment) {
      setInspectorNode(null);
      return;
    }

    setInspectorTab('diff');
    setInspectorNode({
      canonicalPath: node.canonicalPath,
      label: node.label,
      parentLabel,
      status: detail.statusBadge || 'MEMUAT…',
      amendedBy: detail.diubahOleh,
      versionTag: node.versionTag,
      isRepealed: node.isRepealed,
      repealBasis: node.repealBasis,
      fromText: detail.textSebelum || '…',
      toText: detail.textSesudah || node.content || '…',
      diff: {
        targetPath: node.canonicalPath,
        sourceVersion: '',
        targetVersion: '',
        isContentIdentical: false,
        tokens: [],
        addedCount: 0,
        removedCount: 0,
        unchangedCount: 0,
        similarityRatio: 0,
      } as ProvisionDiffResult,
      amendmentDetail: detail,
      loading: true,
    });

    try {
      const baseYear = years[0] ?? '2008';
      const [diffRes, histRes] = await Promise.all([
        fetch(
          `${API_BASE}/api/v1/provisions/diff?slug=${slug}&path=${encodeURIComponent(node.canonicalPath)}&fromYear=${baseYear}&toYear=${selectedTimeline}`
        ).catch(() => null),
        fetch(
          `${API_BASE}/api/v1/instruments/${slug}/history?path=${encodeURIComponent(node.canonicalPath)}`
        ).catch(() => null),
      ]);

      const json = diffRes && diffRes.ok ? await diffRes.json() : null;
      const hist = histRes && histRes.ok ? await histRes.json() : { versi: [] };

      const baselineMissing = json ? !json.nodeFrom : node.versionTag.startsWith('AMENDMENT_2024');
      const status = node.isRepealed
        ? 'DICABUT / DIHAPUS'
        : baselineMissing
          ? 'PASAL SISIPAN BARU'
          : node.versionTag.startsWith('AMENDED') || node.versionTag.startsWith('AMENDMENT')
            ? 'DIUBAH REDAKSI'
            : 'BERLAKU';

      setInspectorNode((prev) => ({
        canonicalPath: node.canonicalPath,
        label: node.label,
        parentLabel,
        status: detail.statusBadge || status,
        amendedBy: detail.diubahOleh || (node.isRepealed ? node.repealBasis || 'UU Pengubah' : 'UU Pengubah'),
        versionTag: node.versionTag,
        isRepealed: node.isRepealed,
        repealBasis: node.repealBasis,
        fromText: detail.textSebelum || json?.textFrom || '(Belum ada pada naskah asli)',
        toText: detail.textSesudah || json?.textTo || node.content,
        diff: json?.diff ?? (prev ? prev.diff : {} as ProvisionDiffResult),
        riwayat: (hist?.versi ?? []) as RiwayatVersi[],
        amendmentDetail: detail,
        loading: false,
      }));
    } catch {
      // Fallback tetap aman dengan metadata lokal
      setInspectorNode((prev) => (prev ? { ...prev, loading: false } : null));
    }
  };

  return { inspectorNode, setInspectorNode, inspectorTab, setInspectorTab, handleOpenInspector };
}

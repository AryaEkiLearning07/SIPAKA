'use client';

import React, { useState } from 'react';
import { ProvisionNode, ProvisionDiffResult } from '@lexvera/types';
import { API_BASE, InspectorState, InspectorTab, OpsRow, RiwayatVersi } from './reader-types';

/**
 * Hook inspektor norma — seluruh data dari database:
 * operasi amandemen (tabel change_operations) + riwayat bunyi (rekonstruksi titik waktu).
 */
export function useInspector(
  slug: string,
  selectedTimeline: string | null,
  years: string[],
  setActiveNodePath: (path: string) => void,
  operations: OpsRow[]
) {
  const [inspectorNode, setInspectorNode] = useState<InspectorState | null>(null);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('diff');

  const handleOpenInspector = async (node: ProvisionNode, parentLabel?: string) => {
    if (!selectedTimeline) return;
    setActiveNodePath(node.canonicalPath);

    const relOps = operations.filter(
      (o) => o.targetCanonicalPath === node.canonicalPath || o.targetCanonicalPath.startsWith(node.canonicalPath + '/')
    );
    const hasAmendment =
      relOps.length > 0 || node.isRepealed === true || (node.versionTag ?? '').startsWith('AMEND');

    // KETENTUAN PENGGUNA: panel HANYA muncul untuk pasal/ayat yang mengalami amandemen
    if (!hasAmendment) {
      setInspectorNode(null);
      return;
    }

    setInspectorTab('diff');

    const jenis = relOps.some((o) => o.operationType === 'REPEAL_PROVISION')
      ? 'DICABUT / DIHAPUS'
      : relOps.some((o) => o.operationType === 'ADD_PROVISION')
        ? 'SISIPAN BARU'
        : 'DIUBAH';
    const amenderNames = [...new Set(relOps.map((o) => o.amender))].join(' jo. ');
    const opLama = relOps.find((o) => o.previousContent);

    setInspectorNode({
      canonicalPath: node.canonicalPath,
      label: node.label,
      parentLabel,
      status: jenis + ' (MEMUAT…)',
      amendedBy: amenderNames,
      versionTag: node.versionTag,
      isRepealed: node.isRepealed,
      repealBasis: node.repealBasis,
      fromText: opLama?.previousContent ?? '…',
      toText: node.content || '…',
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
      ops: relOps,
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

      setInspectorNode((prev) => {
        if (!prev) return null;
        const baselineMissing = json ? !json.nodeFrom : true;
        const status = prev.status.startsWith('DICABUT')
          ? prev.status
          : baselineMissing && relOps.some((o) => o.operationType === 'ADD_PROVISION')
            ? 'SISIPAN BARU'
            : 'DIUBAH';
        return {
          ...prev,
          status,
          amendedBy: amenderNames,
          fromText: json?.textFrom ?? prev.fromText,
          toText: json?.textTo ?? prev.toText,
          diff: json?.diff ?? prev.diff,
          riwayat: (hist?.versi ?? []) as RiwayatVersi[],
          loading: false,
        };
      });
    } catch {
      setInspectorNode((prev) => (prev ? { ...prev, loading: false } : null));
    }
  };

  return { inspectorNode, setInspectorNode, inspectorTab, setInspectorTab, handleOpenInspector };
}

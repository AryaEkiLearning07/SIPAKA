'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Info,
  ShieldCheck,
  AlertOctagon,
  FileText,
  Sparkles,
  GitFork,
  Search,
  CheckCircle2,
  X,
  Layers,
  Sun,
  Moon
} from 'lucide-react';

export type NodeType = 'MERAH' | 'KUNING' | 'BIRU' | 'HIJAU';

export interface LegalGraphNode {
  id: string;
  label: string;
  subLabel: string;
  type: NodeType; // MERAH: Dicabut/Tidak Berlaku, KUNING: UU Pokok Pengganti, BIRU: UU Pengubah, HIJAU: UU Terkait/Rujukan
  year: number;
  status: 'BERLAKU' | 'TIDAK_BERLAKU' | 'DIUBAH' | 'DICABUT' | 'TERKAIT';
  slug?: string;
  description: string;
  pasalImpact?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface LegalGraphEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  type: 'MENCABUT' | 'MENGUBAH' | 'MERUJUK' | 'MELAKSANAKAN';
}

export interface LegalGraphDataset {
  id: string;
  title: string;
  category: string;
  nodes: LegalGraphNode[];
  edges: LegalGraphEdge[];
}

// Data Preset Komprehensif Berdasarkan Sketsa Obsidian Pengguna
export const GRAPH_PRESETS: Record<string, LegalGraphDataset> = {
  tipikor: {
    id: 'tipikor',
    title: 'Pohon Hukum Tindak Pidana Korupsi (Tipikor)',
    category: 'Hukum Pidana Khusus',
    nodes: [
      // KUNING: UU Pokok Pengganti Aktif (Tengah)
      {
        id: 'uu-31-1999',
        label: 'UU No. 31 Tahun 1999',
        subLabel: 'UU Pokok Pemberantasan Tindak Pidana Korupsi',
        type: 'KUNING',
        year: 1999,
        status: 'BERLAKU',
        slug: 'uu-no-31-tahun-1999',
        description:
          'Undang-undang pokok penegakan hukum tipikor yang menggantikan aturan lama dan menjadi pilar pemberantasan korupsi di Indonesia.',
        pasalImpact: 'Memuat delik pokok korupsi (Pasal 2, 3), suap, dan ancaman pidana minimum khusus.',
        x: 460,
        y: 280,
      },
      // MERAH: UU Yang Tidak Berlaku / Dicabut (Kiri)
      {
        id: 'uu-3-1971',
        label: 'UU No. 3 Tahun 1971',
        subLabel: 'Pemberantasan Tindak Pidana Korupsi (Lama)',
        type: 'MERAH',
        year: 1971,
        status: 'DICABUT',
        description:
          'Dicabut dan dinyatakan tidak berlaku seluruhnya oleh Pasal 44 UU No. 31 Tahun 1999.',
        pasalImpact: 'Seluruh pasal dinyatakan tidak berlaku sejak 16 Agustus 1999.',
        x: 140,
        y: 190,
      },
      {
        id: 'uu-24-prp-1960',
        label: 'UU Prp No. 24 Tahun 1960',
        subLabel: 'Pengusutan, Penuntutan, & Pemeriksaan TPK',
        type: 'MERAH',
        year: 1960,
        status: 'DICABUT',
        description:
          'Regulasi darurat masa transisi yang telah dicabut oleh UU 3/1971 dan dipertegas kembali dalam UU 31/1999.',
        pasalImpact: 'Instrumen sejarah hukum pidana korupsi yang telah kedaluwarsa.',
        x: 140,
        y: 380,
      },
      // BIRU: UU Pengubah / Amandemen Pasal (Kanan / Atas)
      {
        id: 'uu-20-2001',
        label: 'UU No. 20 Tahun 2001',
        subLabel: 'Perubahan atas UU No. 31 Tahun 1999',
        type: 'BIRU',
        year: 2001,
        status: 'BERLAKU',
        slug: 'uu-no-20-tahun-2001',
        description:
          'Undang-undang amandemen pertama yang mengubah, menambah, dan mempertegas definisi gratifikasi dan pembuktian terbalik.',
        pasalImpact:
          'Menambah Pasal 12B, 12C (Gratifikasi), mengubah Pasal 5, 6, 7, 8, 9, 10, 11, 12, dan 13 UU 31/1999.',
        x: 780,
        y: 200,
      },
      // HIJAU: UU Terkait / Rujukan dalam UU Pokok (Bawah)
      {
        id: 'uu-30-2002',
        label: 'UU No. 30 Tahun 2002',
        subLabel: 'Komisi Pemberantasan Tindak Pidana Korupsi',
        type: 'HIJAU',
        year: 2002,
        status: 'BERLAKU',
        slug: 'uu-no-30-tahun-2002',
        description:
          'Membentuk Komisi Pemberantasan Korupsi (KPK) sebagai lembaga independen penyelidik, penyidik, dan penuntut perkara tipikor.',
        pasalImpact: 'Merujuk pada kewenangan penegakan Pasal 2, 3, dan pasal suap UU Tipikor.',
        x: 320,
        y: 470,
      },
      {
        id: 'kuhp-lama',
        label: 'KUHP (Wetboek van Strafrecht)',
        subLabel: 'Kitab Undang-Undang Hukum Pidana',
        type: 'HIJAU',
        year: 1946,
        status: 'BERLAKU',
        slug: 'kuhp',
        description:
          'Dirujuk langsung dalam Bab Ketentuan Penutup UU Tipikor mengenai ketentuan suap Pasal 209, 210, 387, 388 KUHP.',
        pasalImpact: 'Adopsi tindak pidana suap dan perbuatan curang menjadi tindak pidana korupsi.',
        x: 580,
        y: 470,
      },
      {
        id: 'pp-71-2000',
        label: 'PP No. 71 Tahun 2000',
        subLabel: 'Peran Serta Masyarakat & Penghargaan TPK',
        type: 'HIJAU',
        year: 2000,
        status: 'BERLAKU',
        description:
          'Peraturan Pemerintah turunan langsung dari amanat Pasal 41 dan 42 UU No. 31 Tahun 1999 mengenai hak masyarakat melapor tipikor.',
        pasalImpact: 'Peraturan pelaksana teknis perlindungan saksi dan pelapor tipikor.',
        x: 800,
        y: 380,
      },
    ],
    edges: [
      {
        id: 'e-merah-1',
        from: 'uu-3-1971',
        to: 'uu-31-1999',
        label: 'Dicabut & Digantikan',
        type: 'MENCABUT',
      },
      {
        id: 'e-merah-2',
        from: 'uu-24-prp-1960',
        to: 'uu-31-1999',
        label: 'Dicabut',
        type: 'MENCABUT',
      },
      {
        id: 'e-biru-1',
        from: 'uu-20-2001',
        to: 'uu-31-1999',
        label: 'Mengubah 9 Pasal & Menambah Gratifikasi',
        type: 'MENGUBAH',
      },
      {
        id: 'e-hijau-1',
        from: 'uu-31-1999',
        to: 'uu-30-2002',
        label: 'Menjadi Objek Penegakan KPK',
        type: 'MERUJUK',
      },
      {
        id: 'e-hijau-2',
        from: 'uu-31-1999',
        to: 'kuhp-lama',
        label: 'Merujuk Delik Suap Asal',
        type: 'MERUJUK',
      },
      {
        id: 'e-hijau-3',
        from: 'uu-31-1999',
        to: 'pp-71-2000',
        label: 'Amanat Pasal 41 (Regulasi Pelaksana)',
        type: 'MELAKSANAKAN',
      },
    ],
  },
  ite: {
    id: 'ite',
    title: 'Pohon Hukum Informasi dan Transaksi Elektronik (UU ITE)',
    category: 'Hukum Siber & Teknologi',
    nodes: [
      {
        id: 'uu-11-2008',
        label: 'UU No. 11 Tahun 2008',
        subLabel: 'Undang-Undang Pokok ITE',
        type: 'KUNING',
        year: 2008,
        status: 'BERLAKU',
        slug: 'ite',
        description: 'Undang-undang pokok pertama yang mengatur ruang siber dan transaksi digital di Indonesia.',
        pasalImpact: 'Memuat norma perbuatan terlarang Pasal 27 (asusila, judi, penghinaan, pemerasan), 28, 29.',
        x: 460,
        y: 280,
      },
      {
        id: 'uu-19-2016',
        label: 'UU No. 19 Tahun 2016',
        subLabel: 'Perubahan Pertama UU ITE',
        type: 'BIRU',
        year: 2016,
        status: 'BERLAKU',
        slug: 'ite',
        description: 'Amandemen pertama yang menurunkan ancaman pidana Pasal 27 ayat 3 dari 6 tahun menjadi 4 tahun.',
        pasalImpact: 'Mengubah Pasal 27 ayat (3), Pasal 31, Pasal 40, dan Pasal 45 UU 11/2008.',
        x: 780,
        y: 190,
      },
      {
        id: 'uu-1-2024',
        label: 'UU No. 1 Tahun 2024',
        subLabel: 'Perubahan Kedua UU ITE',
        type: 'BIRU',
        year: 2024,
        status: 'BERLAKU',
        slug: 'ite',
        description: 'Amandemen kedua yang merestrukturisasi pasal pencemaran nama baik, perlindungan anak, dan bukti elektronik.',
        pasalImpact: 'Mengubah Pasal 27 ayat 1, 3, 4; menambah Pasal 27A, 27B, serta Pasal 40A.',
        x: 780,
        y: 370,
      },
      {
        id: 'uu-27-2022',
        label: 'UU No. 27 Tahun 2022',
        subLabel: 'Perlindungan Data Pribadi (PDP)',
        type: 'HIJAU',
        year: 2022,
        status: 'BERLAKU',
        slug: 'uu-27-2022',
        description: 'Mengambil alih ketentuan perlindungan data pribadi yang sebelumnya diatur secara umum di Pasal 26 UU ITE.',
        pasalImpact: 'Rezim hukum data pribadi terspesialisasi (lex specialis derogat legi generali).',
        x: 200,
        y: 450,
      },
      {
        id: 'skb-pedoman-ite',
        label: 'SKB Pedoman Kriteria UU ITE',
        subLabel: 'Menkominfo, Jaksa Agung, Kapolri 2021',
        type: 'HIJAU',
        year: 2021,
        status: 'BERLAKU',
        description: 'Pedoman implementasi bersama agar penegak hukum tidak multi-tafsir menerapkan Pasal 27, 28, dan 29.',
        pasalImpact: 'Rujukan operasional sebelum diundangkannya UU 1/2024.',
        x: 460,
        y: 470,
      },
    ],
    edges: [
      {
        id: 'e-ite-1',
        from: 'uu-19-2016',
        to: 'uu-11-2008',
        label: 'Amandemen I (Merubah Pasal 27, 45)',
        type: 'MENGUBAH',
      },
      {
        id: 'e-ite-2',
        from: 'uu-1-2024',
        to: 'uu-11-2008',
        label: 'Amandemen II (Menambah Pasal 27A, 27B)',
        type: 'MENGUBAH',
      },
      {
        id: 'e-ite-3',
        from: 'uu-11-2008',
        to: 'uu-27-2022',
        label: 'Diharmonisasikan dengan Rezim PDP',
        type: 'MERUJUK',
      },
      {
        id: 'e-ite-4',
        from: 'uu-11-2008',
        to: 'skb-pedoman-ite',
        label: 'Pedoman Penafsiran Operasional',
        type: 'MELAKSANAKAN',
      },
    ],
  },
  kuhp: {
    id: 'kuhp',
    title: 'Pohon Kodifikasi KUHP Nasional Baru',
    category: 'Kodifikasi Pidana Materiil',
    nodes: [
      {
        id: 'uu-1-2023',
        label: 'UU No. 1 Tahun 2023',
        subLabel: 'Kitab Undang-Undang Hukum Pidana (KUHP Baru)',
        type: 'KUNING',
        year: 2023,
        status: 'BERLAKU',
        slug: 'uu-1-2023',
        description: 'Masterpiece kodifikasi hukum pidana nasional pertama yang menggantikan WvS kolonial Belanda.',
        pasalImpact: 'Mencabut WvS 1915, UU 1/1946, dan merekodifikasi ratusan delik pidana umum & khusus.',
        x: 460,
        y: 280,
      },
      {
        id: 'wvs-1915',
        label: 'Wetboek van Strafrecht (WvS)',
        subLabel: 'KUHP Kolonial Belanda (Stb. 1915 No. 732)',
        type: 'MERAH',
        year: 1915,
        status: 'DICABUT',
        description: 'Dicabut dan dinyatakan tidak berlaku oleh Pasal 622 UU No. 1 Tahun 2023.',
        pasalImpact: 'Berhenti berlaku saat masa transisi KUHP Nasional rampung Januari 2026.',
        x: 140,
        y: 190,
      },
      {
        id: 'uu-1-1946',
        label: 'UU No. 1 Tahun 1946',
        subLabel: 'Peraturan Hukum Pidana',
        type: 'MERAH',
        year: 1946,
        status: 'DICABUT',
        description: 'UU yang memberlakukan WvS di seluruh wilayah RI yang dicabut oleh Bab Penutup KUHP Baru.',
        pasalImpact: 'Pasal 14 dan 15 mengenai berita bohong direkodifikasi ke Pasal 263 dan 264 KUHP 1/2023.',
        x: 140,
        y: 380,
      },
      {
        id: 'uu-20-2025',
        label: 'RUU Penyesuaian KUHP',
        subLabel: 'Harmonisasi Sektoral Transisi KUHP',
        type: 'BIRU',
        year: 2025,
        status: 'BERLAKU',
        description: 'Instrumen penyesuaian pasal pidana dalam puluhan undang-undang sektoral menjelang 2026.',
        pasalImpact: 'Mengharmonisasikan delik tipikor, narkotika, dan siber dengan Buku I KUHP Baru.',
        x: 780,
        y: 240,
      },
      {
        id: 'kuhap-1981',
        label: 'UU No. 8 Tahun 1981 (KUHAP)',
        subLabel: 'Hukum Acara Pidana',
        type: 'HIJAU',
        year: 1981,
        status: 'BERLAKU',
        description: 'Pedoman hukum acara formil untuk menjalankan ketentuan pidana materiil KUHP Baru.',
        pasalImpact: 'Hukum formil pelaksana penyelidikan, penyidikan, dan peradilan pidana.',
        x: 460,
        y: 480,
      },
    ],
    edges: [
      {
        id: 'e-kuhp-1',
        from: 'wvs-1915',
        to: 'uu-1-2023',
        label: 'Dicabut Pasal 622 UU 1/2023',
        type: 'MENCABUT',
      },
      {
        id: 'e-kuhp-2',
        from: 'uu-1-1946',
        to: 'uu-1-2023',
        label: 'Dicabut & Direkodifikasi',
        type: 'MENCABUT',
      },
      {
        id: 'e-kuhp-3',
        from: 'uu-20-2025',
        to: 'uu-1-2023',
        label: 'Sinkronisasi Ketentuan Pidana Sektoral',
        type: 'MENGUBAH',
      },
      {
        id: 'e-kuhp-4',
        from: 'uu-1-2023',
        to: 'kuhap-1981',
        label: 'Dijalankan Melalui Hukum Acara KUHAP',
        type: 'MERUJUK',
      },
    ],
  },
};

// Palet Warna Persis Gambar Pengguna
const COLOR_CONFIG = {
  MERAH: {
    bg: 'bg-red-500/15',
    border: 'border-red-500',
    borderHover: 'hover:border-red-400',
    ring: 'ring-red-500/40',
    glow: 'shadow-[0_0_25px_rgba(239,68,68,0.45)]',
    text: 'text-red-400',
    badge: 'bg-red-950/80 text-red-300 border-red-700/60',
    stroke: '#EF4444',
    particle: '#F87171',
    name: 'Tidak Berlaku / Dicabut',
    subtext: 'Kotak Merah: UU yang sudah dicabut/tidak berlaku',
  },
  KUNING: {
    bg: 'bg-amber-400/20',
    border: 'border-amber-400',
    borderHover: 'hover:border-amber-300',
    ring: 'ring-amber-400/50',
    glow: 'shadow-[0_0_35px_rgba(251,191,36,0.6)]',
    text: 'text-amber-300',
    badge: 'bg-amber-950/90 text-amber-300 border-amber-600/70',
    stroke: '#FBBF24',
    particle: '#FDE047',
    name: 'UU Pokok Pengganti (Aktif)',
    subtext: 'Kotak Kuning: UU yang menggantikan UU yang merah',
  },
  BIRU: {
    bg: 'bg-sky-500/15',
    border: 'border-sky-400',
    borderHover: 'hover:border-sky-300',
    ring: 'ring-sky-400/40',
    glow: 'shadow-[0_0_25px_rgba(56,189,248,0.45)]',
    text: 'text-sky-300',
    badge: 'bg-sky-950/80 text-sky-300 border-sky-700/60',
    stroke: '#38BDF8',
    particle: '#7DD3FC',
    name: 'UU Pengubah / Amandemen',
    subtext: 'Kotak Biru: UU yang merubah pasal di kotak kuning',
  },
  HIJAU: {
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-400',
    borderHover: 'hover:border-emerald-300',
    ring: 'ring-emerald-400/40',
    glow: 'shadow-[0_0_25px_rgba(52,211,153,0.45)]',
    text: 'text-emerald-300',
    badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
    stroke: '#34D399',
    particle: '#6EE7B7',
    name: 'UU Rujukan / Terkait',
    subtext: 'Kotak Hijau: UU/Regulasi lain yang disebut/dirujuk di kotak kuning',
  },
};

export default function ObsidianLegalGraph({
  initialFamily = 'tipikor',
  compact = false,
}: {
  initialFamily?: string;
  compact?: boolean;
}) {
  const [activeFamilyKey, setActiveFamilyKey] = useState<string>(initialFamily);
  const currentDataset = GRAPH_PRESETS[activeFamilyKey] || GRAPH_PRESETS.tipikor;

  // Node Positions State (editable via drag)
  const [nodes, setNodes] = useState<LegalGraphNode[]>(currentDataset.nodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    currentDataset.nodes.find((n) => n.type === 'KUNING')?.id || currentDataset.nodes[0]?.id
  );

  // Canvas Viewport Pan & Zoom
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update nodes when family changes
  useEffect(() => {
    const dataset = GRAPH_PRESETS[activeFamilyKey] || GRAPH_PRESETS.tipikor;
    setNodes(dataset.nodes);
    const root = dataset.nodes.find((n) => n.type === 'KUNING');
    if (root) setSelectedNodeId(root.id);
  }, [activeFamilyKey]);

  // Selected Node Data
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || nodes[0];
  }, [nodes, selectedNodeId]);

  // Connected Edges for Selected Node
  const connectedEdges = useMemo(() => {
    if (!selectedNodeId) return [];
    return currentDataset.edges.filter(
      (e) => e.from === selectedNodeId || e.to === selectedNodeId
    );
  }, [currentDataset.edges, selectedNodeId]);

  // Zoom handlers
  const handleZoom = (delta: number) => {
    setScale((prev) => Math.min(Math.max(prev + delta, 0.4), 2.2));
  };

  const handleResetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Dragging Nodes
  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDragNodeId(id);
    setSelectedNodeId(id);
    const node = nodes.find((n) => n.id === id);
    if (node && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / scale;
      const mouseY = (e.clientY - rect.top - pan.y) / scale;
      dragOffsetRef.current = {
        x: mouseX - (node.x || 0),
        y: mouseY - (node.y || 0),
      };
    }
  };

  // Canvas Pan Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragNodeId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const currentMouseX = (e.clientX - rect.left - pan.x) / scale;
      const currentMouseY = (e.clientY - rect.top - pan.y) / scale;
      setNodes((prevNodes) =>
        prevNodes.map((n) => {
          if (n.id === dragNodeId) {
            return {
              ...n,
              x: Math.round(currentMouseX - dragOffsetRef.current.x),
              y: Math.round(currentMouseY - dragOffsetRef.current.y),
            };
          }
          return n;
        })
      );
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDragNodeId(null);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(zoomFactor);
  };

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border transition-all ${
        isDarkTheme
          ? 'bg-[#090D16] border-slate-800 text-slate-100 shadow-2xl'
          : 'bg-slate-50 border-slate-200 text-slate-900 shadow-xl'
      }`}
    >
      {/* ── Top Bar: Kontrol Preset, Pencarian Simpul, & Tooling ── */}
      <div
        className={`px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 backdrop-blur-md z-30 relative ${
          isDarkTheme ? 'bg-[#0E1424]/90 border-slate-800' : 'bg-white/90 border-slate-200'
        }`}
      >
        {/* Left: Family Selector & Kicker */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full animate-ping ${
                COLOR_CONFIG.KUNING.stroke === '#FBBF24' ? 'bg-amber-400' : 'bg-amber-500'
              }`}
            />
            <span className="font-mono text-xs font-black tracking-wider uppercase text-amber-400">
              Obsidian Legal Graph
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-700/60 hidden sm:block" />

          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/10 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 px-2">Keluarga UU:</span>
            {Object.keys(GRAPH_PRESETS).map((key) => {
              const item = GRAPH_PRESETS[key];
              const isActive = activeFamilyKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveFamilyKey(key)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.title.split('(')[1]?.replace(')', '') || item.title.slice(0, 14)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Kontrol Zoom, Reset, Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center bg-black/30 rounded-xl border border-white/10 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => handleZoom(0.15)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Perbesar (Zoom In)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="font-mono text-[11px] px-2 text-slate-400 font-semibold select-none">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => handleZoom(-0.15)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Perkecil (Zoom Out)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer ml-0.5"
              title="Reset Tampilan (Pusatkan)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            className="p-2 rounded-xl bg-black/30 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isDarkTheme ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap Obsidian'}
          >
            {isDarkTheme ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* ── Main Canvas Area (Force / SVG Graph + Right Inspector) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px] relative">
        {/* Graph Canvas Container (9 Cols) */}
        <div
          ref={containerRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className={`lg:col-span-8 relative overflow-hidden select-none cursor-grab active:cursor-grabbing ${
            isDarkTheme ? 'bg-[#080C15]' : 'bg-[#F4F6F9]'
          }`}
          style={{ minHeight: compact ? '440px' : '580px' }}
        >
          {/* Subtle Ambient Grid Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: isDarkTheme
                ? 'radial-gradient(circle, #38BDF8 1px, transparent 1px)'
                : 'radial-gradient(circle, #0F172A 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          {/* Floating Instructions Pill */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-[11px] text-slate-300 font-medium shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tarik (drag) kotak untuk memindahkan posisi nodus</span>
            </div>
          </div>

          {/* SVG & Node Elements Layer with Scale & Pan Transform */}
          <div
            className="w-full h-full absolute inset-0 transition-transform duration-75 ease-out"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: '0 0',
            }}
          >
            {/* SVG Edges Layer */}
            <svg className="w-[1400px] h-[900px] pointer-events-none absolute inset-0 overflow-visible">
              <defs>
                {/* Marker Arrowheads */}
                <marker
                  id="arrow-merah"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#EF4444" />
                </marker>
                <marker
                  id="arrow-kuning"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#FBBF24" />
                </marker>
                <marker
                  id="arrow-biru"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#38BDF8" />
                </marker>
                <marker
                  id="arrow-hijau"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#34D399" />
                </marker>
              </defs>

              {/* Render Connection Edges */}
              {currentDataset.edges.map((edge) => {
                const source = nodes.find((n) => n.id === edge.from);
                const target = nodes.find((n) => n.id === edge.to);
                if (!source || !target) return null;

                const sx = source.x || 0;
                const sy = source.y || 0;
                const tx = target.x || 0;
                const ty = target.y || 0;

                // Bezier Curve Path
                const dx = tx - sx;
                const dy = ty - sy;
                const cx1 = sx + dx * 0.45;
                const cy1 = sy;
                const cx2 = sx + dx * 0.55;
                const cy2 = ty;
                const pathD = `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`;

                const isConnected =
                  edge.from === selectedNodeId || edge.to === selectedNodeId;

                let strokeColor = '#475569';
                let markerId = 'arrow-kuning';
                if (edge.type === 'MENCABUT') {
                  strokeColor = '#EF4444';
                  markerId = 'arrow-merah';
                } else if (edge.type === 'MENGUBAH') {
                  strokeColor = '#38BDF8';
                  markerId = 'arrow-biru';
                } else if (edge.type === 'MERUJUK' || edge.type === 'MELAKSANAKAN') {
                  strokeColor = '#34D399';
                  markerId = 'arrow-hijau';
                }

                return (
                  <g key={edge.id} className="transition-opacity duration-300">
                    {/* Shadow / Glow Line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isConnected ? '5' : '2'}
                      strokeOpacity={isConnected ? 0.35 : 0.15}
                    />
                    {/* Main Edge Line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isConnected ? '2.5' : '1.5'}
                      strokeDasharray={edge.type === 'MENCABUT' ? '6 4' : 'none'}
                      markerEnd={`url(#${markerId})`}
                      opacity={isConnected ? 1 : 0.6}
                    />
                    {/* Edge Label Pill */}
                    <text
                      x={(sx + tx) / 2}
                      y={(sy + ty) / 2 - 10}
                      fill={isDarkTheme ? '#CBD5E1' : '#334155'}
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="select-none font-mono tracking-tight"
                    >
                      {edge.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* DOM Nodes Layer */}
            {nodes.map((node) => {
              const cfg = COLOR_CONFIG[node.type];
              const isSelected = node.id === selectedNodeId;
              const isCenter = node.type === 'KUNING';

              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(node.id);
                  }}
                  className={`absolute p-4 rounded-2xl border-2 transition-transform cursor-pointer select-none ${
                    cfg.border
                  } ${cfg.borderHover} ${
                    isSelected
                      ? `${cfg.glow} ring-4 ${cfg.ring} scale-105 z-30`
                      : 'hover:scale-102 z-10'
                  } ${
                    isDarkTheme
                      ? 'bg-[#0E1528]/95 backdrop-blur-md text-white'
                      : 'bg-white/95 backdrop-blur-md text-slate-900 shadow-md'
                  }`}
                  style={{
                    left: `${(node.x || 0) - 110}px`,
                    top: `${(node.y || 0) - 50}px`,
                    width: isCenter ? '240px' : '210px',
                  }}
                >
                  {/* Header Simpul: Badge Status & Tahun */}
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span
                      className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-md border ${cfg.badge}`}
                    >
                      {cfg.name.split('(')[0].trim()}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      Th. {node.year}
                    </span>
                  </div>

                  {/* Judul Simpul */}
                  <h4 className="font-sans font-black text-xs leading-snug line-clamp-2">
                    {node.label}
                  </h4>

                  {/* Subjudul */}
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight line-clamp-1">
                    {node.subLabel}
                  </p>

                  {/* Dot status indikator di sudut */}
                  <div
                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full border-2 border-[#090D16]"
                    style={{ backgroundColor: cfg.stroke }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right Inspector Panel (4 Cols) ── */}
        <div
          className={`lg:col-span-4 p-6 border-l flex flex-col justify-between overflow-y-auto ${
            isDarkTheme ? 'bg-[#0A0F1E] border-slate-800' : 'bg-white border-slate-200'
          }`}
          style={{ maxHeight: compact ? '440px' : '580px' }}
        >
          {selectedNode ? (
            <div className="space-y-5">
              {/* Header Card Detail */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full border ${
                      COLOR_CONFIG[selectedNode.type].badge
                    }`}
                  >
                    {COLOR_CONFIG[selectedNode.type].name}
                  </span>
                  <span className="text-xs font-mono text-slate-400 font-bold">
                    Tahun {selectedNode.year}
                  </span>
                </div>

                <h3 className="text-lg font-black tracking-tight leading-snug text-white">
                  {selectedNode.label}
                </h3>
                <p className="text-xs text-amber-300/90 font-medium mt-1">
                  {selectedNode.subLabel}
                </p>
              </div>

              {/* Deskripsi Yuridis */}
              <div
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  isDarkTheme ? 'bg-black/30 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1 text-slate-200 text-[11px] uppercase tracking-wider font-mono">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  Konteks &amp; Posisi Yuridis
                </div>
                {selectedNode.description}
              </div>

              {/* Dampak Pasal */}
              {selectedNode.pasalImpact && (
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                    selectedNode.type === 'MERAH'
                      ? 'bg-red-950/20 border-red-800/50 text-red-300'
                      : selectedNode.type === 'BIRU'
                      ? 'bg-sky-950/20 border-sky-800/50 text-sky-300'
                      : selectedNode.type === 'HIJAU'
                      ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-300'
                      : 'bg-amber-950/20 border-amber-800/50 text-amber-300'
                  }`}
                >
                  <div className="font-bold text-[11px] uppercase tracking-wider font-mono mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Materi Muatan &amp; Dampak Pasal
                  </div>
                  {selectedNode.pasalImpact}
                </div>
              )}

              {/* Hubungan Terhubung (Connected Relations) */}
              <div>
                <h5 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Hubungan Silsilah ({connectedEdges.length}):
                </h5>
                <div className="space-y-1.5">
                  {connectedEdges.map((edge) => {
                    const isOutgoing = edge.from === selectedNode.id;
                    const otherNode = nodes.find(
                      (n) => n.id === (isOutgoing ? edge.to : edge.from)
                    );
                    return (
                      <div
                        key={edge.id}
                        onClick={() => otherNode && setSelectedNodeId(otherNode.id)}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isDarkTheme
                            ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: otherNode
                                ? COLOR_CONFIG[otherNode.type].stroke
                                : '#94A3B8',
                            }}
                          />
                          <span className="font-bold">{otherNode?.label || 'Simpul Hukum'}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {edge.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Button: Buka Naskah Konsolidasi */}
              {selectedNode.slug && (
                <div className="pt-2">
                  <Link
                    href={`/uu/${selectedNode.slug}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#94191C] to-[#B91C1C] hover:from-[#861619] hover:to-[#94191C] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Buka Naskah Konsolidasi Deterministik</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Pilih salah satu simpul untuk melihat silsilah dan pasal terkait.
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Legend Bar: 4 Warna Persis Gambar Pengguna ── */}
      <div
        className={`px-5 py-3 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs ${
          isDarkTheme ? 'bg-[#0A0E1A] border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded-md bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)] shrink-0" />
          <div>
            <span className="font-bold text-red-400 block">Kotak Merah</span>
            <span className="text-[11px] text-slate-400">UU Tidak Berlaku / Dicabut</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded-md bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)] shrink-0" />
          <div>
            <span className="font-bold text-amber-300 block">Kotak Kuning</span>
            <span className="text-[11px] text-slate-400">UU Pokok Pengganti (Titik Pusat)</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded-md bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)] shrink-0" />
          <div>
            <span className="font-bold text-sky-300 block">Kotak Biru</span>
            <span className="text-[11px] text-slate-400">UU Pengubah (Amandemen Pasal)</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded-md bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)] shrink-0" />
          <div>
            <span className="font-bold text-emerald-300 block">Kotak Hijau</span>
            <span className="text-[11px] text-slate-400">UU Rujukan / Regulasi Terkait</span>
          </div>
        </div>
      </div>
    </div>
  );
}

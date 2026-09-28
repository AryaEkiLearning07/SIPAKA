import { InstrumentMeta } from './reader-types';

/** Rapikan label angka/ayat/huruf menjadi format numeral Lembaran Negara. */
export function formatProvisionLabel(label: string): string {
  if (!label) return '';
  const angkaMatch = label.match(/^Angka\s+(\d+)$/i);
  if (angkaMatch) return `${angkaMatch[1]}.`;
  const ayatMatch = label.match(/^Ayat\s*\((\d+)\)$/i);
  if (ayatMatch) return `(${ayatMatch[1]})`;
  const hurufMatch = label.match(/^Huruf\s+([a-zA-Z])$/i);
  if (hurufMatch) return `${hurufMatch[1].toLowerCase()}.`;
  return label;
}

/** Bersihkan artefak ellipsis layout PDF tanpa mengubah kata. */
export function cleanLegalText(text: string): string {
  if (!text) return '';
  return text
    .replace(/^[A-Za-z0-9]+\s*\.\s*\.\s*\.?\s*/g, '')
    .replace(/\s+[A-Za-z0-9]+\s*\.\s*\.\s*\.?$/g, '')
    .replace(/\s*Pasal\s+\d+\s*\.\s*\.\s*\.?/gi, '')
    .trim();
}

const ROMAN_NUM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/** Label tombol timeline berbasis peristiwa regulasi resmi. */
export function eventTimelineLabel(meta: InstrumentMeta | null, year: string, index: number): string {
  if (!meta) return year;
  if (String(meta.year) === year || index === 0) {
    return `Naskah Awal (${year})`;
  }
  const amend = meta.amendments?.[index - 1];
  const roman = ROMAN_NUM[index - 1] ?? String(index);
  if (amend?.amendingInstrument) {
    const cleanAmender = amend.amendingInstrument
      .replace(/^Undang-Undang\s+(?:Republik\s+Indonesia\s+)?/i, 'UU ')
      .replace(/Nomor/i, 'No.')
      .replace(/Tahun\s+/i, '');
    return `Perubahan ${roman} (${cleanAmender})`;
  }
  return `Perubahan ${roman} (${year})`;
}

/** Judul timeline untuk satu titik waktu ("Naskah Asli", "Konsolidasi Pasca ..."). */
export function timelineTitle(meta: InstrumentMeta | null, year: string): string {
  if (!meta) return '';
  if (String(meta.year) === year) {
    return `Naskah Asli (${meta.shortTitle ?? `UU No. ${meta.number}/${meta.year}`})`;
  }
  const amend = meta.amendments.find(
    (a) => String(new Date(a.effectiveFrom).getUTCFullYear()) === year
  );
  return amend
    ? `Naskah Konsolidasi Pasca ${amend.amendingInstrument}`
    : `Naskah Konsolidasi (per ${year})`;
}

/** Kelas ukuran huruf naskah sesuai preferensi pembaca. */
export const fontSizeClass = (s: 'sm' | 'base' | 'lg' | 'xl') =>
  s === 'sm'
    ? 'text-[14px] leading-[1.75]'
    : s === 'lg'
      ? 'text-[17.5px] leading-[1.9]'
      : s === 'xl'
        ? 'text-[19.5px] leading-[2.0]'
        : 'text-[15.5px] leading-[1.85]';

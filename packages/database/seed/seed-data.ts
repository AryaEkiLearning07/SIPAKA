import type { ChangeSetPayload } from '@lexvera/types';

/** Konstanta seeder: instrumen & akun demo — dipisah agar logika seed ramping. */

export const DEMO_USERS = [
  { email: 'admin@lexvera.local', name: 'Administrator LexVera', role: 'ADMIN' as const, password: 'lexvera-admin' },
  { email: 'kurator@lexvera.local', name: 'Kurator Hukum', role: 'KURATOR' as const, password: 'lexvera-kurator' },
  { email: 'dosen@lexvera.local', name: 'Dosen Fakultas Hukum', role: 'DOSEN' as const, password: 'lexvera-dosen' },
  { email: 'mahasiswa@lexvera.local', name: 'Mahasiswa Fakultas Hukum', role: 'MAHASISWA' as const, password: 'lexvera-mahasiswa' },
];

const TARGET_SLUG = 'ite';

export const INSTRUMENTS = {
  target: {
    slug: TARGET_SLUG,
    type: 'UU' as const,
    number: 11,
    year: 2008,
    title: 'Informasi dan Transaksi Elektronik',
    shortTitle: 'UU ITE',
    legalDate: new Date('2008-04-21T00:00:00Z'),
    lnNumber: 58,
    tlnNumber: 4843,
  },
  amender2016: {
    slug: 'uu-19-2016',
    type: 'UU' as const,
    number: 19,
    year: 2016,
    title: 'Perubahan Atas Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik',
    shortTitle: 'UU ITE (Amandemen 1)',
    legalDate: new Date('2016-11-28T00:00:00Z'),
    lnNumber: 251,
    tlnNumber: 5952,
  },
  amender2024: {
    slug: 'uu-1-2024',
    type: 'UU' as const,
    number: 1,
    year: 2024,
    title: 'Perubahan Kedua Atas Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik',
    shortTitle: 'UU ITE (Amandemen 2)',
    legalDate: new Date('2024-01-02T00:00:00Z'),
    lnNumber: 8,
    tlnNumber: 6916,
  },
};

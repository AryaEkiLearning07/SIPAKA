/** Tipe & label bersama halaman autentikasi. */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const ROLE_LABEL: Record<string, string> = {
  MAHASISWA: 'Mahasiswa Hukum',
  DOSEN: 'Dosen / Peneliti',
  KURATOR: 'Kurator Hukum',
  ADMIN: 'Administrator',
};

import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

/**
 * Muat DATABASE_URL dari packages/database/.env jika belum ada di environment.
 * Prisma CLI membaca .env otomatis, tetapi runtime (tsx seed / api) tidak —
 * helper ini memastikan client tetap hidup tanpa dependensi dotenv.
 */
function ensureDatabaseUrl(): void {
  if (process.env.DATABASE_URL) return;
  const envPath = path.join(__dirname, '..', '.env');
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*DATABASE_URL\s*=\s*"?([^"\r\n]+)"?\s*$/);
      if (m) {
        process.env.DATABASE_URL = m[1].trim();
        return;
      }
    }
  } catch {
    // .env tidak ada — biarkan prisma client melaporkan sendiri error env-nya
  }
}

ensureDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

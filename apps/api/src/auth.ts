import { FastifyInstance } from 'fastify';
import { prisma } from '@lexvera/database';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

const SESSION_COOKIE = 'lexvera_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

function toPublicUser(u: { id: string; email: string; name: string; role: string }): PublicUser {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

/** Baca sesi aktif dari cookie — dipakai endpoint terlindung di masa depan. */
export async function getCurrentUser(request: {
  cookies?: Record<string, string | undefined>;
}): Promise<PublicUser | null> {
  const token = request.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  return toPublicUser(session.user);
}

export function registerAuthRoutes(server: FastifyInstance): void {
  // Registrasi terbuka untuk peran pembaca (mahasiswa/dosen).
  // KURATOR & ADMIN dibuat lewat seeder/panel admin, bukan registrasi bebas.
  server.post('/api/v1/auth/register', async (request, reply) => {
    const body = request.body as {
      email?: string;
      name?: string;
      password?: string;
      role?: string;
    };
    const email = body.email?.trim().toLowerCase();
    const name = body.name?.trim();
    const password = body.password ?? '';
    const role = body.role === 'DOSEN' ? 'DOSEN' : 'MAHASISWA';

    if (!email || !email.includes('@')) {
      return reply.code(400).send({ error: 'VALIDATION', field: 'email', message: 'Email tidak valid.' });
    }
    if (!name || name.length < 2) {
      return reply.code(400).send({ error: 'VALIDATION', field: 'name', message: 'Nama minimal 2 karakter.' });
    }
    if (password.length < 6) {
      return reply.code(400).send({ error: 'VALIDATION', field: 'password', message: 'Password minimal 6 karakter.' });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return reply.code(409).send({ error: 'EMAIL_TAKEN', message: 'Email sudah terdaftar.' });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: role as 'MAHASISWA' | 'DOSEN',
        passwordHash: await bcrypt.hash(password, 10),
      },
    });

    const token = randomBytes(32).toString('hex');
    const session = await prisma.session.create({
      data: { token, userId: user.id, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
    });
    reply.setCookie(SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      expires: new Date(Date.now() + SESSION_TTL_MS),
    });
    return reply.code(201).send({ user: toPublicUser(user) });
  });

  server.post('/api/v1/auth/login', async (request, reply) => {
    const body = request.body as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? '';

    if (!email || !password) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'Email dan password wajib diisi.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return reply.code(401).send({ error: 'INVALID_CREDENTIALS', message: 'Email atau password salah.' });
    }

    const token = randomBytes(32).toString('hex');
    const session = await prisma.session.create({
      data: { token, userId: user.id, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
    });
    reply.setCookie(SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      expires: new Date(Date.now() + SESSION_TTL_MS),
    });
    return { user: toPublicUser(user) };
  });

  server.post('/api/v1/auth/logout', async (request, reply) => {
    const token = request.cookies?.[SESSION_COOKIE];
    if (token) {
      await prisma.session.updateMany({
        where: { token, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  });

  server.get('/api/v1/auth/me', async (request, reply) => {
    const user = await getCurrentUser(request);
    if (!user) {
      return reply.code(401).send({ error: 'UNAUTHENTICATED' });
    }
    return { user };
  });
}

import { FastifyInstance } from 'fastify';
import { prisma } from '@sipaka/database';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

export const USER_SESSION_COOKIE = 'sipaka_user_session';
export const ADMIN_SESSION_COOKIE = 'sipaka_admin_session';
export const LEGACY_SESSION_COOKIE = 'sipaka_session';
export const OLD_USER_COOKIE = 'lexvera_user_session';
export const OLD_ADMIN_COOKIE = 'lexvera_admin_session';
export const OLD_LEGACY_COOKIE = 'lexvera_session';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function toPublicUser(u: { id: string; email: string; name: string; role: string }): PublicUser {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

async function resolveSessionFromToken(token?: string): Promise<PublicUser | null> {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  return toPublicUser(session.user);
}

/** Baca sesi pengguna (Mahasiswa/Dosen/Umum atau Admin) */
export async function getCurrentUser(request: {
  cookies?: Record<string, string | undefined>;
}): Promise<PublicUser | null> {
  // Prioritas 1: Sesi pengguna reguler SIPAKA
  const userToken = request.cookies?.[USER_SESSION_COOKIE] || request.cookies?.[OLD_USER_COOKIE];
  const user = await resolveSessionFromToken(userToken);
  if (user) return user;

  // Prioritas 2: Sesi admin SIPAKA (admin juga berhak membaca sebagai user)
  const adminToken = request.cookies?.[ADMIN_SESSION_COOKIE] || request.cookies?.[OLD_ADMIN_COOKIE];
  const admin = await resolveSessionFromToken(adminToken);
  if (admin) return admin;

  // Prioritas 3: Sesi legacy backward-compatible
  const legacyToken = request.cookies?.[LEGACY_SESSION_COOKIE] || request.cookies?.[OLD_LEGACY_COOKIE];
  return resolveSessionFromToken(legacyToken);
}

/** Baca sesi khusus Administrator Utama (Role ADMIN) */
export async function getCurrentAdmin(request: {
  cookies?: Record<string, string | undefined>;
}): Promise<PublicUser | null> {
  // Prioritas 1: Cookie terisolasi khusus konsol admin
  const adminToken = request.cookies?.[ADMIN_SESSION_COOKIE] || request.cookies?.[OLD_ADMIN_COOKIE];
  const admin = await resolveSessionFromToken(adminToken);
  if (admin && admin.role === 'ADMIN') return admin;

  // Prioritas 2: Cookie pengguna reguler yang memiliki peran ADMIN
  const userToken = request.cookies?.[USER_SESSION_COOKIE] || request.cookies?.[OLD_USER_COOKIE];
  const user = await resolveSessionFromToken(userToken);
  if (user && user.role === 'ADMIN') return user;

  // Prioritas 3: Cookie legacy yang memiliki peran ADMIN
  const legacyToken = request.cookies?.[LEGACY_SESSION_COOKIE] || request.cookies?.[OLD_LEGACY_COOKIE];
  const legacy = await resolveSessionFromToken(legacyToken);
  if (legacy && legacy.role === 'ADMIN') return legacy;

  return null;
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

    const cookieOpts = {
      httpOnly: true,
      sameSite: 'lax' as const,
      path: '/',
      expires: new Date(Date.now() + SESSION_TTL_MS),
    };

    reply.setCookie(USER_SESSION_COOKIE, session.token, cookieOpts);
    reply.setCookie(LEGACY_SESSION_COOKIE, session.token, cookieOpts);

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

    const cookieOpts = {
      httpOnly: true,
      sameSite: 'lax' as const,
      path: '/',
      expires: new Date(Date.now() + SESSION_TTL_MS),
    };

    // Jika admin login lewat form umum, pasang admin cookie dan user cookie
    if (user.role === 'ADMIN') {
      reply.setCookie(ADMIN_SESSION_COOKIE, session.token, cookieOpts);
    }
    reply.setCookie(USER_SESSION_COOKIE, session.token, cookieOpts);
    reply.setCookie(LEGACY_SESSION_COOKIE, session.token, cookieOpts);

    return { user: toPublicUser(user) };
  });

  server.post('/api/v1/auth/logout', async (request, reply) => {
    const token = request.cookies?.[USER_SESSION_COOKIE] || request.cookies?.[LEGACY_SESSION_COOKIE];
    if (token) {
      await prisma.session.updateMany({
        where: { token, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    reply.clearCookie(USER_SESSION_COOKIE, { path: '/' });
    reply.clearCookie(LEGACY_SESSION_COOKIE, { path: '/' });
    reply.clearCookie(OLD_USER_COOKIE, { path: '/' });
    reply.clearCookie(OLD_LEGACY_COOKIE, { path: '/' });
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

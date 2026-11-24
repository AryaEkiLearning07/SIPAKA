import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { registerAuthRoutes } from './auth';
import { registerInstrumentRoutes } from './routes/instruments';
import { registerAnalysisRoutes } from './routes/analysis';
import { registerMonitoringRoutes } from './routes/monitoring';
import { registerOperationsRoute } from './routes/operations';
import { registerSearchRoutes } from './routes/search';
import { registerBookmarkRoutes } from './routes/bookmarks';
import { registerNoteRoutes } from './routes/notes';
import { registerAiRoutes } from './routes/ai';
import { registerAdminRoutes } from './routes/admin';
import { registerForumRoutes } from './routes/forum';
import { registerProfileRoutes } from './routes/profile';
import { registerRepositoryRoutes } from './routes/repository';
import { registerGlossaryRoutes } from './routes/glossary';

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'error' : 'info',
    },
  });

  await server.register(cors, {
    origin: (origin, cb) => {
      // Izinkan semua origin akses deployment SIPAKA (localhost, IP VPS, domain publik)
      cb(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  await server.register(cookie);

  registerAuthRoutes(server);
  registerInstrumentRoutes(server);
  registerAnalysisRoutes(server);
  registerMonitoringRoutes(server);
  registerOperationsRoute(server);
  registerSearchRoutes(server);
  registerBookmarkRoutes(server);
  registerNoteRoutes(server);
  registerAiRoutes(server);
  registerAdminRoutes(server);
  registerForumRoutes(server);
  registerProfileRoutes(server);
  registerRepositoryRoutes(server);
  registerGlossaryRoutes(server);

  return server;
}

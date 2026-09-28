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

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'error' : 'info',
    },
  });

  await server.register(cors, {
    origin: (origin, cb) => {
      // Izinkan request tanpa origin (seperti curl, mobile, backend-to-backend)
      // atau origin lokal localhost / 127.0.0.1 dan custom CORS_ORIGIN
      if (
        !origin ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin === process.env.CORS_ORIGIN
      ) {
        cb(null, true);
        return;
      }
      cb(null, false);
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

  return server;
}

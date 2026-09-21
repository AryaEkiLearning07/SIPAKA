import { buildServer } from './server';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  const server = await buildServer();
  try {
    const address = await server.listen({ port: PORT, host: HOST });
    console.log(`[LexVera API] Server running at ${address}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();

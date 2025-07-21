import { RedisClient } from 'bun';
import { config, env } from './config.ts';
import { Client } from 'minio';
import { drizzle } from 'drizzle-orm/mysql2';
import { Streamify } from './src/Streamify/Streamify.ts';
import { MatchInfoImporter } from './src/Workers/MatchInfoImporter.ts';
import { appRouter } from './src/trpc/router.ts';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { createContext } from './src/trpc/trpc.ts';
import { ReplayStorage } from 'lurker/src/ReplayStorage.ts';
import { MinioStorage } from 'compressed-storage';

const abort = new AbortController();
process.on('SIGTERM', () => abort.abort('SIGTERM'));
process.on('SIGINT', () => abort.abort('SIGINT'));

const db = drizzle(env('DATABASE_URL'));
const redis = new RedisClient(config.redis);
const replaysS3 = new Client(config.replays.s3.endpoint);
const replayStorage = new ReplayStorage(new MinioStorage(config.replays.s3.bucket, replaysS3));

const streamify = new Streamify(redis, 'storage:bucketevents', 'matches:processing');
abort.signal.addEventListener('abort', () => streamify.dispose());
streamify.start();

new MatchInfoImporter(redis, db, replayStorage);

const server = createHTTPServer({
  router: appRouter,
  createContext: createContext(db),
});

server.listen(config.http.port);

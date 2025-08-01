import { redis, RedisClient } from 'bun';
import { config } from './config.ts';
import { Client } from 'minio';
import { drizzle } from 'drizzle-orm/mysql2';
import { Streamify } from './src/Streamify/Streamify.ts';
import { MatchInfoImporter } from './src/Workers/MatchInfoImporter.ts';
import { appRouter } from './src/trpc/router.ts';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { createContext } from './src/trpc/trpc.ts';
import { MinioStorage } from 'compressed-storage';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { ReplayStorage } from 'replay-storage';
import { GamelensEventsStorage } from 'gamelens-events-storage';
import * as schema from './src/db/schema.ts';
import { PlayerMatchesImporter } from './src/Workers/PlayerMatchesImporter.ts';

import { OpenFrontPublicAPIWithLimiter } from 'lurker/src/OpenFrontPublicAPIWithLimiter.ts';
import { LeakyBucket } from 'lurker/src/LeakyBucket/LeakyBucket.ts';

const abort = new AbortController();
process.on('SIGTERM', () => abort.abort('SIGTERM'));
process.on('SIGINT', () => abort.abort(''));

const db = drizzle(config.db, {
  mode: 'default',
  schema,
});

const openfrontRateLimiter = new LeakyBucket({ bucketKey: 'openfront:global', capacity: 4, refillPerSec: 4 }, redis);

const api = new OpenFrontPublicAPIWithLimiter(config.openfront.api, openfrontRateLimiter);

migrate(db, { migrationsFolder: './drizzle' }).then(() => {
  const redis = new RedisClient(config.redis);
  const replaysS3 = new Client(config.replays.s3.endpoint);
  const replayStorage = new ReplayStorage(new MinioStorage(config.replays.s3.bucket, replaysS3));
  const eventsStorage = new GamelensEventsStorage(
    new MinioStorage(config.gamelens.s3.bucket, new Client(config.gamelens.s3.endpoint)),
  );

  if (!config.readOnly) {
    const streamify = new Streamify(redis, 'storage:bucketevents', 'matches:processing');
    abort.signal.addEventListener('abort', () => streamify.dispose());
    streamify.start();
    new MatchInfoImporter(redis, db, replayStorage);
    new PlayerMatchesImporter(db, api);
  }

  const server = createHTTPServer({
    router: appRouter,
    createContext: createContext(db, eventsStorage),
  });

  server.listen(config.http.port);
});

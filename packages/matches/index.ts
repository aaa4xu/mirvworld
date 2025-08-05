import { RedisClient } from 'bun';
import { config } from './config.ts';
import { Client } from 'minio';
import { appRouter } from './src/trpc/router.ts';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { createContext } from './src/trpc/trpc.ts';
import { MinioStorage } from 'compressed-storage';
import { ReplayStorage } from 'replay-storage';
import { GameLensImporter } from './src/Workers/GameLensImporter.ts';
import { OpenFrontPublicAPIWithLimiter } from '@mirvworld/openfront-api';
import { MongoClient } from 'mongodb';
import { MatchesRepository } from './src/mongodb/Repositories/MatchesRepository.ts';
import { MatchInfoImporter } from './src/Workers/MatchInfoImporter.ts';
import { Streamify } from '@mirvworld/redis-streamify';
import { MatchesService } from './src/Services/MatchesService.ts';
import { LeakyBucket } from '@mirvworld/redis-leaky-bucket';

const abort = new AbortController();
process.on('SIGTERM', () => abort.abort('SIGTERM'));
process.on('SIGINT', () => abort.abort(''));

const redis = new RedisClient(config.redis);

const mongo = await MongoClient.connect(config.mongodb.url);
const mongoDatabase = mongo.db(config.mongodb.database);

const openfrontRateLimiter = new LeakyBucket({ bucketKey: 'openfront:global', capacity: 4, refillPerSec: 4 }, redis);

const api = new OpenFrontPublicAPIWithLimiter(config.openfront.api, openfrontRateLimiter);

const replaysS3 = new Client(config.replays.s3.endpoint);
const replayStorage = new ReplayStorage(new MinioStorage(config.replays.s3.bucket, replaysS3));
const matchesRepository = new MatchesRepository(mongoDatabase);
const matchesService = new MatchesService(matchesRepository, replayStorage, api);

if (!config.readOnly) {
  const streamify = new Streamify(redis, 'matches:storage', 'matches:queue');
  abort.signal.addEventListener('abort', () => streamify.dispose(), { once: true });

  const gamelensImporter = new GameLensImporter('matches:gamelens', redis, matchesService);
  abort.signal.addEventListener('abort', () => gamelensImporter.dispose(), { once: true });

  const importer = new MatchInfoImporter('matches:queue', redis, matchesService);
  abort.signal.addEventListener('abort', () => importer.dispose(), { once: true });
}

const server = createHTTPServer({
  router: appRouter,
  createContext: createContext(api, replayStorage, matchesService),
});

server.listen(config.http.port);

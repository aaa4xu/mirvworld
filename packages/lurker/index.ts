import { LobbiesLurker } from './src/LobbiesLurker.ts';
import { config } from './config.ts';
import { RedisClient } from 'bun';
import { LeakyBucket } from './src/LeakyBucket/LeakyBucket.ts';
import { OpenFrontServerAPIWithLimiter } from './src/OpenFrontServerAPIWithLimiter.ts';
import { OpenFrontPublicAPIWithLimiter } from './src/OpenFrontPublicAPIWithLimiter.ts';
import { DownloadQueue } from './src/DownloadQueue/DownloadQueue.ts';
import { ReplayLurker } from './src/ReplayLurker.ts';
import { ReplayStorage } from './src/ReplayStorage.ts';
import { Client } from 'minio';
import { CompressedStorage, MinioStorage } from 'compressed-storage';

const abortController = new AbortController();
process.on('SIGTERM', () => abortController.abort('SIGTERM'));
process.on('SIGINT', () => abortController.abort('SIGINT'));

const redis = new RedisClient(config.redis);
const s3 = new Client(config.s3.endpoint);
const storage = new MinioStorage(config.s3.bucket, s3);
const replayStorage = new ReplayStorage(storage);

const openfrontRateLimiter = new LeakyBucket({ bucketKey: 'openfront:global', capacity: 4, refillPerSec: 4 }, redis);

const serverClient = new OpenFrontServerAPIWithLimiter(
  config.openfront.server,
  config.openfront.workers,
  openfrontRateLimiter,
);
const apiClient = new OpenFrontPublicAPIWithLimiter(
  config.openfront.api,
  new LeakyBucket({ bucketKey: 'openfront:api', capacity: 4, refillPerSec: 3 }, redis, openfrontRateLimiter),
);
const downloadQueue = new DownloadQueue(
  {
    readyKey: 'lurker:queue',
    firstDelay: 15 * 60 * 1000,
    retryDelay: 3 * 60 * 1000,
    entryKeyPrefix: 'lurker:entry:',
    deadLetterKey: 'lurker:deadletter',
  },
  redis,
);

const lastTickLobbies = new Set<string>();
const lobbiesLurker = new LobbiesLurker(
  serverClient,
  (lobbies) => {
    for (const lobby of lobbies) {
      if (!lastTickLobbies.has(lobby.gameID)) {
        console.log(`[Lurker][${lobby.gameID}] 💡 New game detected`);
      }

      downloadQueue.push(lobby.gameID, Date.now(), lobby).catch((err) => {
        console.error(`[Lurker] Failed to push ${lobby.gameID} to queue:`, err);
      });
    }

    lastTickLobbies.clear();
    lobbies.forEach((l) => lastTickLobbies.add(l.gameID));
  },
  config.lobbyInterval,
);
abortController.signal.addEventListener('abort', () => lobbiesLurker.dispose());

const replaysLurker = new ReplayLurker(apiClient, serverClient, replayStorage, downloadQueue);
abortController.signal.addEventListener('abort', () => replaysLurker.dispose());

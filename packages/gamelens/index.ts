import os from 'node:os';
import cluster from 'node:cluster';
import { RedisClient } from 'bun';
import { config } from './config.ts';
import { Client } from 'minio';
import { GameLensStatsWorker } from './src/GameLensStatsWorker.ts';
import { MinioStorage } from 'compressed-storage';
import { GamelensEventsStorage } from './src/GamelensEventsStorage.ts';
import { ReplayStorage } from 'replay-storage';

if (cluster.isPrimary) {
  const threads = os.availableParallelism();
  console.log(`[Main] Creating ${threads} threads`);
  for (let i = 0; i < threads; i++) {
    cluster.fork();
  }

  let stop = false;
  cluster.on('exit', (_, code, sig) => {
    if (stop) return;
    console.log(`worker died (${sig ?? code}), reforking`);
    cluster.fork();
  });

  process.on('SIGINT', () => {
    stop = true;
    cluster.disconnect();
  });

  process.on('SIGTERM', () => {
    stop = true;
    cluster.disconnect();
  });
} else {
  console.log(`[Worker#${process.pid}] Starting...`);

  const abort = new AbortController();
  process.on('SIGTERM', () => abort.abort('SIGTERM'));
  process.on('SIGINT', () => abort.abort('SIGINT'));

  const redis = new RedisClient(config.redis);

  const replayStorage = new ReplayStorage(
    new MinioStorage(config.replays.s3.bucket, new Client(config.replays.s3.endpoint)),
  );

  const eventsStorage = new GamelensEventsStorage(new MinioStorage(config.s3.bucket, new Client(config.s3.endpoint)));

  new GameLensStatsWorker(config.mapsPath, redis, replayStorage, eventsStorage);
  abort.signal.addEventListener('abort', () => {
    console.log(`[Worker#${process.pid}] Aborting...`);
    process.exit(1);
  });
}

import cluster from 'node:cluster';
import os from 'node:os';
import { RedisClient } from 'bun';
import { config } from './config.ts';
import { Queue } from './src/Queue.ts';
import { Worker } from './src/Worker.ts';
import { GameState } from './src/GameState.ts';
import { ReplayStorage } from './src/ReplayStorage.ts';
import { Client } from 'minio';
import { OpenFrontServerAPIWithRateLimiter } from './src/OpenFrontServerAPIWithRateLimiter.ts';

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

  const s3 = new Client(config.s3.endpoint);
  const storage = new ReplayStorage(s3, config.s3.bucket);

  const redis = new RedisClient(config.redis);
  const server = new OpenFrontServerAPIWithRateLimiter(config.openfront.server, redis);

  const q = new Queue(
    {
      streamKey: 'lurker:queue',
      seenNamespace: 'lurker:seen',
    },
    redis,
  );
  const games = new GameState('lurker:games', redis);
  const worker = new Worker(q, storage, games, server);

  process.once('SIGINT', () => worker.dispose());
  process.once('SIGTERM', () => worker.dispose());

  worker.start().catch((err) => console.error(`[Worker#${process.pid}] Failed to start:`, err));
}

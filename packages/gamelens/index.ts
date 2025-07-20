import { PlaybackEngine } from './src/PlaybackEngine.ts';
import os from 'node:os';
import cluster from 'node:cluster';
import { RedisClient } from 'bun';
import { config } from './config.ts';
import { Client } from 'minio';
import { GameLensStatsWorker } from './src/GameLensStatsWorker.ts';

// const filename = 'ihq5E8kV.json';
//
// const record = await Bun.file(filename).json();
// const playback = new PlaybackEngine('./../openfront/game/resources/maps');
//
// await playback.process(record);
// console.log('Done!');

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
  const s3 = new Client(config.s3.endpoint);
  new GameLensStatsWorker(config.mapsPath, config.s3.bucket, redis, s3);
}

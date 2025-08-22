import os from 'node:os';
import cluster from 'node:cluster';
import { $, RedisClient } from 'bun';
import { config } from './config.ts';
import { Client } from 'minio';
import { GameLensStatsWorker } from './src/GameLensStatsWorker.ts';
import { MinioStorage } from 'compressed-storage';
import { ReplayStorage } from 'replay-storage';
import { Streamify } from '@mirvworld/redis-streamify';
import { GameRecordSchema } from 'openfront/src/Schema.ts';
import type { GameRecord } from 'openfront/game/src/core/Schemas.ts';
import { PlaybackEngine } from './src/PlaybackEngine.ts';

if (cluster.isPrimary) {
  cluster.setupPrimary({
    // [stdin, stdout, stderr, ipc]
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
  });

  const replay = GameRecordSchema.parse(await Bun.file('replay.json').json()) as GameRecord;
  const threads = config.concurrency || os.availableParallelism();
  console.log(`[Main] Creating ${threads} threads`);
  const startedAt = Date.now();
  for (let i = 0; i < threads; i++) {
    cluster.fork();
  }

  let finished = 0;
  cluster.on('exit', (_, code, sig) => {
    if (code !== 0) {
      throw new Error('Worker exited with non-zero code');
    }

    const duration = (Date.now() - startedAt) / 1000;
    console.log(
      `Replay processed in ${duration.toFixed(2)}sec, Turns per second: ${(replay.turns.length / duration).toFixed(3)}`,
    );

    finished++;
    if (finished === threads) {
      console.log(
        'All workers finished',
        'Duration:',
        duration.toFixed(2),
        'sec',
        'Turns per second:',
        (replay.turns.length / duration).toFixed(3),
        'tps',
      );
      process.exit(0);
    }
  });
} else {
  const playback = new PlaybackEngine(config.mapsPath);
  const replay = GameRecordSchema.parse(await Bun.file('replay.json').json());
  const startTime = performance.now();
  const stats = await playback.process(replay as GameRecord);
  console.log(`[${process.pid}] Replay processed in ${performance.now() - startTime}ms`);
  process.exit(0);
}

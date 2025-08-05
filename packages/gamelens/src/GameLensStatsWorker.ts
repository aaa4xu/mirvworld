import { RedisClient } from 'bun';
import { TaskWorker, type TaskMessage } from 'utils';
import { MinioPutEventSchema } from 'utils';
import { GameRecordSchema } from 'openfront/src/Schema.ts';
import { PlaybackEngine } from './PlaybackEngine.ts';
import type { GameRecord } from 'openfront/game/src/core/Schemas.ts';
import { ReplayStorage } from 'replay-storage';
import os from 'node:os';

export class GameLensStatsWorker {
  private readonly worker: TaskWorker;
  private readonly playback: PlaybackEngine;

  public constructor(
    mapsPath: string,
    private readonly version: string,
    private readonly redis: RedisClient,
    private readonly replayStorage: ReplayStorage,
  ) {
    this.worker = new TaskWorker(redis, {
      streamKey: 'gamelens:queue',
      group: `${this.constructor.name}-${version}`,
      deadLetterKey: 'gamelens:deadletter',
      consumer: `${os.hostname()}-${process.pid}`,
      startFromBeginningOfQueue: true,
    });

    this.playback = new PlaybackEngine(mapsPath);
    this.worker.process(this.process);
  }

  private process = async (task: TaskMessage) => {
    console.log(`Processing task ${task.id}`);
    const tasks = MinioPutEventSchema.parse(JSON.parse(task.fields.data ?? '{}'));

    for (const task of tasks) {
      for (const event of task.Event) {
        if (event.eventName !== 's3:ObjectCreated:Put') {
          console.warn(`Unknown event ${event.eventName}`);
          continue;
        }

        if (!event.s3.object.key.startsWith(this.version)) {
          // Replay from a different game version
          continue;
        }

        const genericReplay = await this.replayStorage.read(decodeURIComponent(event.s3.object.key));

        const replay = GameRecordSchema.parse(genericReplay) as GameRecord;
        const stats = await this.playback.process(replay);

        await this.redis.send('XADD', [
          'matches:gamelens',
          '*',
          'data',
          JSON.stringify(stats),
          'id',
          replay.info.gameID,
        ]);
      }
    }
  };
}

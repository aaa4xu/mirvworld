import { RedisClient } from 'bun';
import { TaskWorker, type TaskMessage } from 'matches/src/TaskWorker.ts';
import { MinioPutEventSchema } from 'matches/src/Schema/MinioPutEvent.ts';
import { GameRecordSchema } from 'openfront/src/Schema.ts';
import { PlaybackEngine } from './PlaybackEngine.ts';
import type { GameRecord } from 'openfront/game/src/core/Schemas.ts';
import type { ReplayStorage } from 'lurker/src/ReplayStorage.ts';
import type { GamelensEventsStorage } from './GamelensEventsStorage.ts';

export class GameLensStatsWorker {
  private readonly worker: TaskWorker;
  private readonly playback: PlaybackEngine;

  public constructor(
    mapsPath: string,
    redis: RedisClient,
    private readonly replayStorage: ReplayStorage,
    private readonly eventsStorage: GamelensEventsStorage,
  ) {
    this.worker = new TaskWorker(redis, {
      streamKey: 'matches:processing',
      group: 'gamelens-v4',
      deadLetterKey: 'gamelens:deadletter',
      consumer: `gamelens-v4-${process.pid}`,
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

        const genericReplay = await this.replayStorage.read(decodeURIComponent(event.s3.object.key));

        const replay = GameRecordSchema.parse(genericReplay);
        const stats = await this.playback.process(replay as GameRecord);

        await this.eventsStorage.save(replay.gitCommit, replay.info.gameID, stats);
      }
    }
  };

  private filename(commit: string, id: string) {
    return `${commit.slice(0, 7)}/${id}.json`;
  }
}

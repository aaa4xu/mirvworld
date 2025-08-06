import { type TaskMessage, TaskWorker } from 'utils';
import { RedisClient } from 'bun';
import type { MatchesService } from '../Services/MatchesService.ts';
import os from 'node:os';
import { GameLensStatsSchema } from '@mirvworld/gamelens-stats/src/GameLensStats.ts';

export class GameLensImporter {
  private readonly worker: TaskWorker;

  public constructor(
    streamKey: string,
    redis: RedisClient,
    private readonly matches: MatchesService,
  ) {
    this.worker = new TaskWorker(redis, {
      consumer: `${os.hostname()}-${process.pid}`,
      group: this.constructor.name,
      deadLetterKey: 'matches:players-deadletter',
      streamKey: streamKey,
    });

    this.worker.process(this.process);
  }

  public dispose() {
    this.worker.dispose();
  }

  private process = async (task: TaskMessage) => {
    const taskId = task.id;
    console.log(`[${this.constructor.name}][${taskId}] Processing task`);

    const stats = GameLensStatsSchema.parse(JSON.parse(task.fields.data ?? '{}'));
    await this.matches.setPlayers(task.fields.id as string, stats.players);
    console.log(`[${this.constructor.name}][${taskId}] GameLens stats for ${task.fields.id} imported`);
  };
}

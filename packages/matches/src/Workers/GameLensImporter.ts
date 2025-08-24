import { type TaskMessage, TaskWorker } from 'utils';
import { RedisClient } from 'bun';
import type { MatchesService } from '../Services/MatchesService.ts';
import os from 'node:os';
import { GameLensStatsSchema } from '@mirvworld/gamelens-stats/src/GameLensStats.ts';
import type { ClanRatingRepository } from '../Repositories/ClanRatingRepository.ts';
import type { OpenSkill } from '../OpenSkill.ts';

export class GameLensImporter {
  private readonly worker: TaskWorker;

  public constructor(
    streamKey: string,
    redis: RedisClient,
    private readonly matches: MatchesService,
    private readonly openskill: OpenSkill,
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
    const gameId = task.fields.id as string;
    console.log(`[${this.constructor.name}][${taskId}] Processing task`);

    const stats = GameLensStatsSchema.parse(JSON.parse(task.fields.data ?? '{}'));
    await this.matches.setPlayers(gameId, stats.players);
    console.log(`[${this.constructor.name}][${taskId}] GameLens stats for ${gameId} imported`);

    const deltas = await this.openskill.apply(gameId, stats.players);
    await this.matches.setRatingDelta(gameId, deltas);
    console.log(`[${this.constructor.name}][${taskId}] Clans rating is updated from game ${gameId}`);
  };
}

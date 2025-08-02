import { RedisClient } from 'bun';
import { type TaskMessage, TaskWorker } from 'utils';
import { MySql2Database } from 'drizzle-orm/mysql2/driver';
import { MinioPutEventSchema } from 'utils';
import z from 'zod/v4';
import { GameRecordSchema } from 'openfront/src/Schema.ts';
import { matches, matchPlayers } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import type { ReplayStorage } from 'replay-storage';
import * as schema from '../db/schema.ts';

export class MatchInfoImporter {
  private readonly worker: TaskWorker;

  public constructor(
    redis: RedisClient,
    private readonly db: MySql2Database<typeof schema>,
    private readonly replays: ReplayStorage,
  ) {
    this.worker = new TaskWorker(redis, {
      consumer: `matches-processor-${process.pid}`,
      group: 'static',
      deadLetterKey: 'matches:deadletter',
      streamKey: 'matches:processing',
    });

    this.worker.process(this.process);
  }

  private process = async (task: TaskMessage) => {
    console.log(`Processing task ${task.id}`);
    const tasks = MinioPutEventSchema.parse(JSON.parse(task.fields.data ?? '{}'));

    for (const task of tasks) {
      for (const event of task.Event) {
        if (event.eventName !== 's3:ObjectCreated:Put') {
          throw new Error(`Unknown event ${event.eventName}`);
        }

        const genericReplay = await this.replays.read(decodeURIComponent(event.s3.object.key));

        const replay = GameRecordSchema.parse(genericReplay);
        await this.import(replay);
      }
    }
  };

  private async import(replay: z.infer<typeof GameRecordSchema>) {
    await this.db.transaction(async (tx) => {
      await tx.delete(matches).where(eq(matches.gameId, replay.info.gameID));

      const result = await tx
        .insert(matches)
        .values({
          gameId: replay.info.gameID,
          map: replay.info.config.gameMap,
          mode: replay.info.config.gameMode === 'Free For All' ? 'ffa' : 'team',
          version: replay.gitCommit,
          players: replay.info.players.length,
          maxPlayers: replay.info.config.maxPlayers ?? 0,
          winner: replay.info.winner?.[1],
          startedAt: new Date(replay.info.start),
          finishedAt: new Date(replay.info.end),
        })
        .execute();

      const matchId = result[0].insertId;

      const playersRows = replay.info.players.map((p) => ({
        matchId,
        name: p.username,
        clientId: p.clientID,
      }));

      if (playersRows.length) {
        await tx.insert(matchPlayers).values(playersRows).execute();
      }
    });
  }
}

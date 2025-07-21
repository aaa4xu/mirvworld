import { RedisClient } from 'bun';
import { type TaskMessage, TaskWorker } from '../TaskWorker.ts';
import { MySql2Database } from 'drizzle-orm/mysql2/driver';
import { MinioPutEventSchema } from '../Schema/MinioPutEvent.ts';
import z from 'zod/v4';
import { GameRecordSchema } from 'openfront/src/Schema.ts';
import { matches, matchPlayers } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import type { ReplayStorage } from 'lurker/src/ReplayStorage.ts';

export class MatchInfoImporter {
  private readonly worker: TaskWorker;
  private readonly versions = ['cef2a853dc31b7a29961dbb454681bf28c7ecf9d'];

  public constructor(
    redis: RedisClient,
    private readonly db: MySql2Database,
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

        if (!this.versions.includes(genericReplay.gitCommit)) {
          throw new Error(`Unsupported replay version ${genericReplay.gitCommit.substring(0, 7)}`);
        }

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
          winner: replay.info.winner?.slice(1).join(','),
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

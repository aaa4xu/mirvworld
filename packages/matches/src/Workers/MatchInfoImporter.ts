import { RedisClient } from 'bun';
import { type TaskMessage, TaskWorker } from '../TaskWorker.ts';
import { MySql2Database } from 'drizzle-orm/mysql2/driver';
import { MinioPutEventSchema } from '../Schema/MinioPutEvent.ts';
import type { Readable } from 'node:stream';
import type { Client } from 'minio';
import z from 'zod/v4';
import { GameRecordSchema, GenericReplaySchema } from 'openfront/src/Schema.ts';
import { matches, matchPlayers } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export class MatchInfoImporter {
  private readonly worker: TaskWorker;

  public constructor(
    redis: RedisClient,
    private readonly db: MySql2Database,
    private readonly s3: Client,
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

        const stream = this.s3.getObject(event.s3.bucket.name, decodeURIComponent(event.s3.object.key));
        const genericReplay = await this.readReplay(stream);

        if (genericReplay.gitCommit !== 'cef2a853dc31b7a29961dbb454681bf28c7ecf9d') {
          throw new Error(`Unknown commit ${genericReplay.gitCommit}`);
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

  private async readReplay(stream: Promise<Readable>) {
    const compressed = await this.read(await stream);
    const decompressed = await Bun.zstdDecompress(compressed);
    const json = JSON.parse(decompressed.toString());
    return GenericReplaySchema.parse(json);
  }

  private async read(stream: Readable) {
    const chunks: Buffer[] = [];

    return new Promise<Buffer>((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}

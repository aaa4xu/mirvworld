import { RedisClient } from 'bun';
import type { Client } from 'minio';
import { TaskWorker, type TaskMessage } from 'matches/src/TaskWorker.ts';
import { MinioPutEventSchema } from 'matches/src/Schema/MinioPutEvent.ts';
import { GameRecordSchema } from 'openfront/src/Schema.ts';
import type { Readable } from 'node:stream';
import { GenericReplaySchema } from 'matches/src/Schema/GenericReplay.ts';
import { PlaybackEngine } from './PlaybackEngine.ts';
import type { GameRecord } from 'openfront/game/src/core/Schemas.ts';

export class GameLensStatsWorker {
  private readonly worker: TaskWorker;
  private readonly playback: PlaybackEngine;

  public constructor(
    mapsPath: string,
    private readonly bucket: string,
    redis: RedisClient,
    private readonly s3: Client,
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

        const stream = this.s3.getObject(event.s3.bucket.name, decodeURIComponent(event.s3.object.key));
        const genericReplay = await this.readReplay(stream);

        if (genericReplay.gitCommit !== 'cef2a853dc31b7a29961dbb454681bf28c7ecf9d') {
          console.warn(`Unknown commit ${genericReplay.gitCommit}`);
          continue;
        }

        const replay = GameRecordSchema.parse(genericReplay);
        const stats = await this.playback.process(replay as GameRecord);

        const json = JSON.stringify(stats, (key, value) => (typeof value === 'bigint' ? value.toString() : value));
        const compressed = await Bun.zstdCompress(json, { level: 22 });

        await this.s3.putObject(
          this.bucket,
          this.filename(replay.gitCommit, replay.info.gameID),
          compressed,
          compressed.length,
          {
            'Content-Type': 'application/json',
            'Content-Encoding': 'zstd',
          },
        );
      }
    }
  };

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

  private filename(commit: string, id: string) {
    return `${commit.slice(0, 7)}/${id}.json.zst`;
  }
}

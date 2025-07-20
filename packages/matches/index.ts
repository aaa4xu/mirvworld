import { RedisClient } from 'bun';
import { config, env } from './config.ts';
import { Queue } from './src/Queue.ts';
import { Client } from 'minio';
import type { Readable } from 'node:stream';
import { MockQueue } from './src/MockQueue.ts';
import { GenericReplaySchema } from './src/Schema/GenericReplay.ts';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './src/db/schema.ts';
import { GameRecordSchema } from 'openfront/src/Schema.ts';
import { matches, matchPlayers } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
import { Streamify } from './src/Streamify/Streamify.ts';
import { TaskWorker } from './src/TaskWorker.ts';
import { MatchInfoImporter } from './src/Workers/MatchInfoImporter.ts';

const abort = new AbortController();
process.on('SIGTERM', () => abort.abort('SIGTERM'));
process.on('SIGINT', () => abort.abort('SIGINT'));

const db = drizzle(env('DATABASE_URL'));
const redis = new RedisClient(config.redis);
const s3 = new Client(config.s3.endpoint);

const streamify = new Streamify(redis, 'storage:bucketevents', 'matches:processing');
abort.signal.addEventListener('abort', () => streamify.dispose());
streamify.start();

new MatchInfoImporter(redis, db, s3);

/*


const event = [
  {
    Event: [
      {
        eventVersion: '2.0',
        eventSource: 'minio:s3',
        awsRegion: '',
        eventTime: '2025-07-18T23:29:08.935Z',
        eventName: 's3:ObjectCreated:Put',
        userIdentity: {
          principalId: 'service-lurker',
        },
        requestParameters: {
          principalId: 'service-lurker',
          region: '',
          sourceIPAddress: '172.19.0.4',
        },
        responseElements: {
          'x-amz-id-2': 'dd9025bab4ad464b049177c95eb6ebf374d3b3fd1af9251148b658df7ac2e3e8',
          'x-amz-request-id': '18537C4CB87414BA',
          'x-minio-deployment-id': '25fb8408-abef-4d3e-9c6b-50ed08d17106',
          'x-minio-origin-endpoint': 'http://172.18.0.4:9000',
        },
        s3: {
          s3SchemaVersion: '1.0',
          configurationId: 'Config',
          bucket: {
            name: 'replays',
            ownerIdentity: {
              principalId: 'service-lurker',
            },
            arn: 'arn:aws:s3:::replays',
          },
          object: {
            key: 'cef2a85%2FmjFe1tgv.json.zst',
            size: 82628,
            eTag: '76809f08f1c9d389628cb2eb5a94a61d',
            contentType: 'application/json',
            userMetadata: {
              'content-encoding': 'zstd',
              'content-type': 'application/json',
            },
            sequencer: '18537C4CB8867458',
          },
        },
        source: {
          host: '172.19.0.4',
          port: '',
          userAgent: 'MinIO (linux; x64) minio-js/8.0.5',
        },
      },
    ],
    EventTime: '2025-07-18T23:29:08.935Z',
  },
];


const queue = new MockQueue(event);
const s3 = new Client(config.s3.endpoint);



while (!abort.signal.aborted) {
  const tasks = await queue.next();
  if (!tasks) {
    await Bun.sleep(250);
    continue;
  }

  for (const task of tasks) {
    for (const event of task.Event) {
      if (event.eventName !== 's3:ObjectCreated:Put') {
        console.warn(`Unknown event ${event.eventName}`);
        continue;
      }

      if (event.s3.bucket.name !== config.s3.bucket) {
        console.warn(`Unknown bucket ${event.s3.bucket.name}`);
        continue;
      }

      const stream = s3.getObject(event.s3.bucket.name, decodeURIComponent(event.s3.object.key));
      const genericReplay = await readReplay(stream);

      if (genericReplay.gitCommit !== 'cef2a853dc31b7a29961dbb454681bf28c7ecf9d') {
        console.warn(`Unknown commit ${genericReplay.gitCommit}`);
        continue;
      }

      const replay = GameRecordSchema.parse(genericReplay);

      await db.transaction(async (tx) => {
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

  break;
}

async function readReplay(stream: Promise<Readable>) {
  const compressed = await read(await stream);
  const decompressed = await Bun.zstdDecompress(compressed);
  const json = JSON.parse(decompressed.toString());
  return GenericReplaySchema.parse(json);
}

function read(stream: Readable) {
  const chunks: Buffer[] = [];

  return new Promise<Buffer>((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}
*/

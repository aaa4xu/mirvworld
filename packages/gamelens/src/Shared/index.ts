import cluster from 'node:cluster';
import os from 'node:os';
import { RedisClient, S3Client } from 'bun';
import { type PlaybackEngine } from './PlaybackEngine';
// @ts-ignore файл существует только в целевой папке
import { ReplayPlaybackEngine } from '../ReplayPlaybackEngine';

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < os.availableParallelism(); i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.error(`worker ${worker.process.pid} died`);
  });

  process.once('SIGINT', () => shutdownWorkers('SIGINT'));
  process.once('SIGTERM', () => shutdownWorkers('SIGTERM'));
} else {
  const abortController = new AbortController();
  process.once('SIGINT', () => abortController.abort('SIGINT'));
  process.once('SIGTERM', () => abortController.abort('SIGTERM'));

  worker(abortController.signal);
}

async function worker(signal: AbortSignal) {
  const redis = new RedisClient(env('GAMELENS_REDIS_URL', 'redis://localhost:6379'));
  const s3Client = new S3Client({
    endpoint: env('GAMELENS_SOURCE_ENDPOINT', env('GAMELENS_S3_ENDPOINT', 'http://localhost:9000')),
    accessKeyId: env('GAMELENS_SOURCE_KEY_ID', env('GAMELENS_S3_KEY_ID', 'minioadmin')),
    secretAccessKey: env('GAMELENS_SOURCE_SECRET', env('GAMELENS_S3_SECRET', 'minioadmin')),
  });

  const targetS3Client = new S3Client({
    endpoint: env('GAMELENS_RESULTS_ENDPOINT', env('GAMELENS_S3_ENDPOINT', 'http://localhost:9000')),
    accessKeyId: env('GAMELENS_RESULTS_KEY_ID', env('GAMELENS_S3_KEY_ID', 'minioadmin')),
    secretAccessKey: env('GAMELENS_RESULTS_SECRET', env('GAMELENS_S3_SECRET', 'minioadmin')),
  });

  const resultsBucket = env('GAMELENS_RESULTS_BUCKET', 'gamelens-v2');

  const queueName = env('GAMELENS_REDIS_IN', 'storage:bucketevents');

  const commit = env('GAMELENS_GIT_COMMIT');
  const queueType = env('GAMELENS_QUEUE_TYPE', 'fifo');

  const playback: PlaybackEngine<unknown> = new ReplayPlaybackEngine('./resources/maps', commit);

  while (!signal.aborted) {
    const task = queueType === 'fifo' ? await redis.lpop(queueName) : await redis.rpop(queueName);
    if (!task) {
      await Bun.sleep(250);
      continue;
    }

    try {
      const json = JSON.parse(task);
      for (const { Event: events } of json) {
        for (const event of events) {
          const bucket = event.s3.bucket.name;
          const name = decodeURIComponent(event.s3.object.key);

          try {
            const gameRecord = await s3Client.file(name, { bucket }).json();
            const stats = await playback.process(gameRecord, signal);
            await targetS3Client.write(`${commit}/${stats.id}.json`, JSON.stringify(stats), { bucket: resultsBucket });
          } catch (e) {
            console.error(`Failed process ${bucket}/${name}`, e);
            // await redis.rpush(queueName, task); // @TODO dead letter queue
          }
        }
      }
    } catch (e) {
      console.error('Failed process task from queue', e);
      await redis.rpush(queueName, task);
    }

    await Bun.sleep(250);
  }
}

function env(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;

  if (typeof value === 'undefined') {
    throw new Error(`Missing environment variable ${name}`);
  }

  return value;
}

function shutdownWorkers(signal: NodeJS.Signals) {
  console.log('Shutdown signal received: ', signal);
  return new Promise<void>((resolve, reject) => {
    if (!cluster.isPrimary) {
      return resolve();
    }

    const wIds = Object.keys(cluster.workers ?? {});
    if (wIds.length == 0) {
      return resolve();
    }
    //Filter all the valid workers
    const workers = wIds.map((id) => cluster.workers?.[id]).filter((v) => !!v);
    let workersAlive = 0;
    let funcRun = 0;

    //Count the number of alive workers and keep looping until the number is zero.
    const fn = () => {
      ++funcRun;
      workersAlive = 0;
      workers.forEach((worker) => {
        if (!worker.isDead()) {
          console.log(`${worker?.id} is still alive`);
          ++workersAlive;
          if (funcRun == 1)
            //On the first execution of the function, send the received signal to all the workers
            worker.kill(signal);
        }
      });

      console.log(`Workers alive: ${workersAlive}`);
      if (workersAlive == 0) {
        //Clear the interval when all workers are dead
        clearInterval(interval);
        return resolve();
      }
    };
    const interval = setInterval(fn, 500);
  });
}

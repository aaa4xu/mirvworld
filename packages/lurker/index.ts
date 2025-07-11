import { RedisClient } from 'bun';
import { config } from './config';
import { DownloadQueue } from './src/DownloadQueue.ts';
import { LobbiesLurker } from './src/LobbiesLurker.ts';
import { OpenFrontServerAPI } from './src/OpenFront/OpenFrontServerAPI.ts';
import { S3Client } from 'bun';
import { ReplayLurker } from './src/ReplayLurker.ts';
import { ReplayStorage } from './src/ReplayStorage.ts';

(async () => {
  const s3 = new S3Client({
    accessKeyId: config.s3.keyId,
    secretAccessKey: config.s3.secret,
    bucket: config.s3.bucket,
    endpoint: config.s3.endpoint,
  });

  const redis = new RedisClient(config.redis);
  const queue = new DownloadQueue(redis);
  const api = new OpenFrontServerAPI(config.endpoint);
  const storage = new ReplayStorage(s3);
  const lobbiesLurker = new LobbiesLurker(api, queue, config.lobbyInterval);
  const replayLurker = new ReplayLurker(api, storage, queue);

  async function dispose() {
    console.log(`[Main] Shutting down...`);
    lobbiesLurker.dispose();
    replayLurker.dispose();
    process.exit(0);
  }

  process.on('SIGTERM', dispose);
  process.on('SIGINT', dispose);
})();

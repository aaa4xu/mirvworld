import { config } from './config';
import { DownloadQueue } from './src/DownloadQueue.ts';
import { LobbiesLurker } from './src/LobbiesLurker.ts';
import { OpenFrontServerAPI } from './src/OpenFrontServerAPI.ts';
import { S3Client } from 'bun';
import { ReplayLurker } from './src/ReplayLurker.ts';
import { ReplayStorage } from './src/ReplayStorage.ts';

(async () => {
  const state = await Bun.file(config.state)
    .json()
    .catch(() => []);

  const s3 = new S3Client({
    accessKeyId: config.s3.keyId,
    secretAccessKey: config.s3.secret,
    bucket: config.s3.bucket,
    endpoint: config.s3.endpoint,
  });

  const queue = new DownloadQueue(state);
  const intervalId = setInterval(saveState, 60_000);
  const api = new OpenFrontServerAPI(config.endpoint);
  const storage = new ReplayStorage(s3);
  const lobbiesLurker = new LobbiesLurker(api, queue);
  const replayLurker = new ReplayLurker(api, storage, queue);

  function saveState() {
    return Bun.file(config.state)
      .write(JSON.stringify(queue))
      .then(() => console.log('[Main] Saved state'))
      .catch((err) => console.error(`Failed to save state: ${err.message}`));
  }

  async function dispose() {
    console.log(`[Main] Shutting down...`);
    lobbiesLurker.dispose();
    replayLurker.dispose();
    clearInterval(intervalId);
    await saveState();
    process.exit(0);
  }

  process.on('SIGTERM', dispose);
  process.on('SIGINT', dispose);
})();

import { RedisClient } from 'bun';
import { config } from './config';
import { DownloadQueue } from './src/DownloadQueue.ts';
import { LobbiesLurker } from './src/LobbiesLurker.ts';
import { OpenFrontServerAPI } from './src/OpenFront/OpenFrontServerAPI.ts';
import { ReplayLurker } from './src/ReplayLurker.ts';
import { ReplayStorage } from './src/ReplayStorage.ts';
import { OpenFrontPublicAPI } from './src/OpenFront/OpenFrontPublicAPI.ts';
import * as z from 'zod/v4';
import { HistoryImporter } from './src/HistoryImporter.ts';
import { Client } from 'minio';

(async () => {
  const s3 = new Client(config.s3.endpoint);

  const server = new OpenFrontServerAPI(config.serverEndpoint);
  const api = new OpenFrontPublicAPI(config.apiEndpoint);
  const abortController = new AbortController();

  const redis = new RedisClient(config.redis);
  const queue = new DownloadQueue(redis);
  const storage = new ReplayStorage(s3, config.s3.bucket);
  const lobbiesLurker = new LobbiesLurker(server, (id, startId) => queue.push(id, startId), config.lobbyInterval);
  const replayLurker = new ReplayLurker(server, storage, queue);

  Bun.file(config.importPath)
    .exists()
    .then(async (exists) => {
      if (!exists) return;
      const matches = z.array(z.string()).parse(await Bun.file(config.importPath).json());

      console.log(`[Main] Importing ${matches.length} matches from history`);
      const historyImporter = new HistoryImporter(api, storage);
      await historyImporter.process(matches, abortController.signal);
      console.log(`[Main] Import finished`);
    })
    .catch((err) => console.error(`[Main] Failed to start import: ${config.importPath}: ${err}`));

  async function dispose() {
    console.log(`[Main] Shutting down...`);
    lobbiesLurker.dispose();
    replayLurker.dispose();
    abortController.abort();
  }

  process.on('SIGTERM', dispose);
  process.on('SIGINT', dispose);
})();

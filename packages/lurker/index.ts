import { LobbiesLurker } from './src/LobbiesLurker.ts';
import { config } from './config.ts';
import { OpenFrontServerAPI } from './src/OpenFront/OpenFrontServerAPI.ts';
import { Queue } from './src/Queue.ts';
import { RedisClient } from 'bun';

const abortController = new AbortController();
const server = new OpenFrontServerAPI(config.openfront.server);
const redis = new RedisClient(config.redis);
const q = new Queue(
  {
    streamKey: 'lurker:queue',
    seenNamespace: 'lurker:seen',
  },
  redis,
);
const lobbiesLurker = new LobbiesLurker(
  server,
  (id, startAt, info) => {
    q.push(id, startAt, info)
      .then((added) => {
        if (!added) return;
        console.log(`[Lurker] Detected game ${id}`);
      })
      .catch((e) => console.error(`Failed to push ${id} to queue:`, e));
  },
  config.lobbyInterval,
);

async function dispose() {
  console.log(`[Main] Shutting down...`);
  lobbiesLurker.dispose();
  abortController.abort('SIGTERM');
}

process.on('SIGTERM', dispose);
process.on('SIGINT', dispose);

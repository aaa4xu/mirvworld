import type { GameRecord } from 'openfront/game/src/core/Schemas.ts';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PlaybackEngine } from './src/PlaybackEngine';
import { config } from './config';

const root = './replays/v25';
const replays = (
  await Promise.all(
    (await fs.readdir(root)).map(
      (filename) => fs.readFile(path.join(root, filename), 'utf8').then((t) => JSON.parse(t)) as Promise<GameRecord>,
    ),
  )
).slice(0, 1);

const totalTurns = replays.reduce((acc, r) => acc + r.turns.length, 0);
const totalPlayers = replays.reduce((acc, r) => acc + r.info.players.length, 0);
console.log('Total turns:', totalTurns, 'Players:', totalPlayers);

const playback = new PlaybackEngine(config.mapsPath);
const startTime = performance.now();
for (const replay of replays) {
  await playback.process(replay);
}
console.log(
  `[${process.pid}] Replays processing speed is ${(totalTurns / ((performance.now() - startTime) / 1000)).toFixed(2)} turns/sec`,
);
process.exit(0);

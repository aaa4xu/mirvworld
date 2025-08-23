import type { GameRecord } from 'openfront/game/src/core/Schemas.ts';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = './replays/v25';
const replays = await Promise.all(
  (await fs.readdir(root)).map((filename) => Bun.file(path.join(root, filename)).json() as Promise<GameRecord>),
);

const totalTurns = replays.reduce((acc, r) => acc + r.turns.length, 0);
const totalPlayers = replays.reduce((acc, r) => acc + r.info.players.length, 0);
console.log('Total turns:', totalTurns, 'Players:', totalPlayers);

import type { GameRecord } from 'openfront/game/src/core/Schemas.ts';
import { config } from './config.ts';
import { PlaybackEngine } from './src/PlaybackEngine.ts';
import { GameRecordSchema } from 'openfront/src/Schema.ts';

const playback = new PlaybackEngine(config.mapsPath);
const replay = GameRecordSchema.parse(await Bun.file('replay.json').json());
const stats = await playback.process(replay as GameRecord);
await Bun.file('stats.json').write(
  JSON.stringify(stats, (k: string, v: any) => (typeof v === 'bigint' ? v.toString() : v), 2),
);
console.log('Done!');

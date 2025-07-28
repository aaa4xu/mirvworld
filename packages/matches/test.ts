import { MinioStorage } from 'compressed-storage';
import { config } from './config.ts';
import { Client } from 'minio';
import { GameLensStats } from './src/GameLensStats/GameLensStats.ts';
import { GamelensEventsStorage } from 'gamelens-events-storage';

const eventsStorage = new GamelensEventsStorage(
  new MinioStorage(config.gamelens.s3.bucket, new Client(config.gamelens.s3.endpoint)),
);

const events = await eventsStorage.read('98420cc/0Dyn1blV.json');
const stats = new GameLensStats(events);

console.log(stats.players.size);
await Bun.file('output.json').write(
  JSON.stringify(stats, (k: string, v: any) => (typeof v === 'bigint' ? v.toString() : v), 2),
);
console.log('Done!');

import { PlaybackEngine } from './src/PlaybackEngine.ts';

const filename = 'ihq5E8kV.json';

const record = await Bun.file(filename).json();
const playback = new PlaybackEngine('./../openfront/game/resources/maps');

await playback.process(record);
console.log('Done!');

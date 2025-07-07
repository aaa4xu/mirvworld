import { MatchesRepository } from './src/MatchesRepository.ts';
import { LobbiesLurker } from './src/LobbiesLurker.ts';
import { db } from './src/db';
import { config } from './config.ts';

const matchesRepository = new MatchesRepository(db);

const lobbiesLurker = new LobbiesLurker(config.endpoint, matchesRepository);

process.on('SIGTERM', () => {
  console.debug('SIGTERM signal received.');
  lobbiesLurker.dispose();
});

process.on('SIGINT', () => {
  console.debug('SIGINT signal received.');
  lobbiesLurker.dispose();
});

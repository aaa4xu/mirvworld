import { MatchesRepository } from './src/MatchesRepository.ts';
import { LobbiesLurker } from './src/LobbiesLurker.ts';
import { db } from './src/db';
import { config } from './config.ts';
import { ReplayLurker } from './src/ReplayLurker.ts';
import { publicProcedure, router } from './src/trpc.ts';
import { z } from 'zod';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { ReplayStorage } from './src/ReplayStorage.ts';

const replayStorage = new ReplayStorage(config.replaysPath);
const matchesRepository = new MatchesRepository(db);

const lobbiesLurker = new LobbiesLurker(config.endpoint, matchesRepository);
const replaysLurker = new ReplayLurker(config.endpoint, config.replaysPath, matchesRepository);

const appRouter = router({
  latestMatches: publicProcedure.query(async () => {
    const matches = await matchesRepository.latest();

    const promises = matches.map(async (info) => {
      const replay = await replayStorage.load(info.id).catch(() => null);

      if (!replay) {
        return info;
      } else {
        return {
          ...info,
          map: replay.map,
          mode: replay.mode,
          duration: replay.duration,
        };
      }
    });

    return Promise.all(promises);
  }),
  match: publicProcedure.input(z.string()).query((opts) => matchesRepository.read(opts.input)),
});

const server = createHTTPServer({
  router: appRouter,
});

server.listen(config.http.port);

process.on('SIGTERM', () => {
  console.debug('SIGTERM signal received.');
  lobbiesLurker.dispose();
  replaysLurker.dispose();
  server.close((e) => {
    console.debug('Server closed', e);
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.debug('SIGINT signal received.');
  lobbiesLurker.dispose();
  replaysLurker.dispose();
  server.close((e) => {
    console.debug('Server closed', e);
    process.exit(0);
  });
});

export type AppRouter = typeof appRouter;

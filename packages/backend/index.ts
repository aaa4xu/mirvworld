import { MatchesRepository } from './src/MatchesRepository.ts';
import { LobbiesLurker } from './src/LobbiesLurker.ts';
import { db } from './src/db';
import { config } from './config.ts';
import { ReplayLurker } from './src/ReplayLurker.ts';
import { publicProcedure, router } from './src/trpc.ts';
import { z } from 'zod';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { ReplayStorage } from './src/ReplayStorage.ts';
import { UsersRepository } from './src/UsersRepository.ts';
import * as jose from 'jose';
import { contextFactory } from './src/trpc/context.ts';
import { TokenPayload } from './src/Schema/TokenPayload.ts';
import { TRPCError } from '@trpc/server';

const replayStorage = new ReplayStorage(config.replaysPath);
const matchesRepository = new MatchesRepository(db);
const usersRepository = new UsersRepository(db);

const lobbiesLurker = new LobbiesLurker(config.endpoint, matchesRepository);
const replaysLurker = new ReplayLurker(config.endpoint, replayStorage, matchesRepository);

const jwtSecret = new TextEncoder().encode(config.http.secret);
if (config.http.secret === 'secret') {
  console.warn('WARNING: Using default secret. Please change it with MIRVWORLD_HTTP_SECRET environment variable.');
}

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
  match: publicProcedure.input(z.string()).query(async (opts) => {
    const info = await matchesRepository.read(opts.input);

    if (!info) {
      throw new TRPCError({
        message: 'Match not found',
        code: 'NOT_FOUND',
      });
    }

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
  }),
  discordLogin: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        avatar: z.string(),
      }),
    )
    .output(z.string())
    .mutation(async (opts) => {
      const user = await usersRepository.discordLogin(opts.input.id, opts.input.name, opts.input.avatar);

      const payload = TokenPayload.parse({
        id: user.id,
        name: user.name,
        avatar: user.discordAvatar
          ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`
          : '/empty-avatar.png',
      });

      return new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(jwtSecret);
    }),
  me: publicProcedure.output(z.union([TokenPayload, z.null()])).query((opts) => {
    return opts.ctx.user;
  }),
});

const server = createHTTPServer({
  router: appRouter,
  createContext: contextFactory(jwtSecret, usersRepository),
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

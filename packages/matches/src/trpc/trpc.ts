import { initTRPC } from '@trpc/server';
import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
import superjson from 'superjson';
import type { OpenFrontPublicAPI } from '@mirvworld/openfront-api';
import type { ReplayStorage } from 'replay-storage';
import type { MatchesService } from '../Services/MatchesService.ts';

export const createContext = (api: OpenFrontPublicAPI, storage: ReplayStorage, matches: MatchesService) => {
  return async (opts: CreateHTTPContextOptions) => {
    return {
      api,
      storage,
      matches,
    };
  };
};

export type Context = Awaited<ReturnType<ReturnType<typeof createContext>>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;

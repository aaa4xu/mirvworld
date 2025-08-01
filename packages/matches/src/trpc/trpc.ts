import { initTRPC } from '@trpc/server';
import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
import type { MySql2Database } from 'drizzle-orm/mysql2/driver';
import type { GamelensEventsStorage } from 'gamelens-events-storage';
import superjson from 'superjson';
import * as schema from '../db/schema.ts';
import type { OpenFrontPublicAPI } from 'lurker/src/OpenFront/OpenFrontPublicAPI.ts';
import type { ReplayStorage } from 'replay-storage';

export const createContext = (
  db: MySql2Database<typeof schema>,
  eventsStorage: GamelensEventsStorage,
  api: OpenFrontPublicAPI,
  storage: ReplayStorage,
) => {
  return async (opts: CreateHTTPContextOptions) => {
    return {
      db,
      eventsStorage,
      api,
      storage,
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

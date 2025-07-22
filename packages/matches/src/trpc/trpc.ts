import { initTRPC } from '@trpc/server';
import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
import type { MySql2Database } from 'drizzle-orm/mysql2/driver';
import superjson from 'superjson';
import { GamelensEventsStorage } from 'gamelens/src/GamelensEventsStorage.ts';

export const createContext = (db: MySql2Database, eventsStorage: GamelensEventsStorage) => {
  return async (opts: CreateHTTPContextOptions) => {
    return {
      db,
      eventsStorage,
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

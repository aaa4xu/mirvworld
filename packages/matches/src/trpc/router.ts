import { publicProcedure, router } from './trpc';
import z from 'zod/v4';
import { matches, matchPlayers } from '../db/schema.ts';
import { desc, eq } from 'drizzle-orm';
import { GameLensStats } from '../GameLensStats/GameLensStats.ts';

export const appRouter = router({
  matches: {
    latest: publicProcedure.query(async ({ ctx }) => {
      return ctx.db.select().from(matches).orderBy(desc(matches.startedAt)).limit(20);
    }),

    getByGameId: publicProcedure.input(z.string()).query(async ({ ctx, input: gameId }) => {
      const results = await ctx.db.select().from(matches).where(eq(matches.gameId, gameId));
      const info = results.at(0);
      if (!info) return null;

      const players = await ctx.db.select().from(matchPlayers).where(eq(matchPlayers.matchId, info.id));
      const events = await ctx.eventsStorage
        .read(`${info.version.substring(0, 7)}/${info.gameId}.json`)
        .catch(() => null);

      return {
        ...info,
        players: players.map((p) => ({
          name: p.name,
          clientId: p.clientId,
        })),
        stats: events ? new GameLensStats(events).toJSON() : null,
      };
    }),
  },
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;

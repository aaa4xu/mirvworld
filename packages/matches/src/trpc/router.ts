import { publicProcedure, router } from './trpc';
import z from 'zod/v4';
import { matches, matchPlayers } from '../db/schema.ts';
import { desc, eq, getTableColumns } from 'drizzle-orm';
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

    searchByPlayerName: publicProcedure.input(z.string()).query(async ({ ctx, input: playerName }) => {
      return ctx.db
        .selectDistinct({ ...getTableColumns(matches) })
        .from(matches)
        .innerJoin(matchPlayers, eq(matchPlayers.matchId, matches.id))
        .where(eq(matchPlayers.name, playerName))
        .orderBy(desc(matches.startedAt))
        .limit(20);
    }),

    importById: publicProcedure.input(z.string().length(8)).mutation(async ({ ctx, input: id }) => {
      try {
        const replay = await ctx.api.game(id, AbortSignal.timeout(5000));
        if (!replay) {
          throw new Error('Replay is not found');
        }

        await ctx.storage.save(id, replay);
      } catch (err) {
        console.error(`Failed to download replay:`, err instanceof Error ? err.message : err);
        throw new Error('Failed to download replay');
      }
    }),
  },
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;

import { adminProcedure, publicProcedure, router } from './trpc';
import z from 'zod';

export const appRouter = router({
  matches: {
    latest: publicProcedure.query(async ({ ctx }) => {
      return ctx.matches.latest();
    }),

    getByGameId: publicProcedure.input(z.string()).query(async ({ ctx, input: gameId }) => {
      return ctx.matches.read(gameId);
    }),

    searchByPlayerName: publicProcedure.input(z.string()).query(async ({ ctx, input: playerName }) => {
      return ctx.matches.searchByPlayer(playerName);
    }),

    importById: publicProcedure.input(z.string().length(8)).mutation(async ({ ctx, input: id }) => {
      return ctx.matches.enqueue(id);
    }),
  },
  tournaments: {
    getById: publicProcedure.input(z.string()).query(async ({ ctx, input: id }) => {
      return ctx.tournaments.readBySlug(id);
    }),

    addMatch: adminProcedure
      .input(z.object({ id: z.string(), matchId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return ctx.tournaments.addMatch(input.id, input.matchId);
      }),
  },
  players: {
    getById: publicProcedure.input(z.string().length(8)).query(async ({ ctx, input: id }) => {
      let player = await ctx.players.getByPublicId(id);
      if (!player) {
        player = await ctx.players.updateByPublicId(id);
      }

      return player;
    }),
  },
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;

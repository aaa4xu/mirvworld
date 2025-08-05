import { publicProcedure, router } from './trpc';
import z from 'zod/v4';

export const appRouter = router({
  matches: {
    latest: publicProcedure.query(async ({ ctx }) => {
      return ctx.matches.latest();
    }),

    getByGameId: publicProcedure.input(z.string()).query(async ({ ctx, input: gameId }) => {
      return ctx.matches.read(gameId);
    }),

    searchByPlayerName: publicProcedure.input(z.string()).query(async ({ ctx, input: playerName }) => {
      return []; // @TODO
    }),

    importById: publicProcedure.input(z.string().length(8)).mutation(async ({ ctx, input: id }) => {
      return ctx.matches.enqueue(id);
    }),
  },
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;

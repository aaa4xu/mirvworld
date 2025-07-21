import { publicProcedure, router } from './trpc';
import z from 'zod/v4';
import { matches, matchPlayers } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { CompressedFile } from '../CompressedFile.ts';
import { GamelensEventSchema } from 'gamelens/src/Events.ts';
import { Match } from '../Match.ts';
import { GameLensStats } from '../GameLensStats.ts';

export const appRouter = router({
  userList: publicProcedure.query(async () => {
    return ['test', 'result'];
  }),
  matches: {
    getById: publicProcedure.input(z.number()).query(async ({ ctx, input: id }) => {
      const results = await ctx.db.select().from(matches).where(eq(matches.id, id));
      return results.at(0);
    }),

    getByGameId: publicProcedure.input(z.string()).query(async ({ ctx, input: gameId }) => {
      const results = await ctx.db.select().from(matches).where(eq(matches.gameId, gameId));
      const info = results.at(0);
      if (!info) return null;

      const players = await ctx.db.select().from(matchPlayers).where(eq(matchPlayers.matchId, info.id));
      const file = ctx.s3.getObject('gamelens-v4', `${info.version.slice(0, 7)}/${info.gameId}.json.zst`);
      const json = await CompressedFile.json(file).catch(() => []);
      const events = z.array(GamelensEventSchema).parse(json);

      return new Match(info, players, events.length > 0 ? new GameLensStats(events) : undefined).toJSON();
    }),
  },
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;

import z from 'zod';

export const MatchInfoSchema = z.object({
  gameID: z.string(),
  msUntilStart: z.optional(z.number()),
  numClients: z.optional(z.number()),
  gameConfig: z.optional(
    z.looseObject({
      gameMap: z.string(),
      gameMode: z.string(),
      maxPlayers: z.number(),
    }),
  ),
});

export type MatchInfo = z.infer<typeof MatchInfoSchema>;

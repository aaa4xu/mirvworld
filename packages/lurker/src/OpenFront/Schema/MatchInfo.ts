import { z } from 'zod/v4';

export const MatchInfo = z.object({
  gameID: z.string(),
  msUntilStart: z.optional(z.number()),
  numClients: z.optional(z.number()),
});

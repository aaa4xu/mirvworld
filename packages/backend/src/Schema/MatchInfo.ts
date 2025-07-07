import { z } from 'zod';
import { GameConfigSchema } from 'openfront-client/src/core/Schemas.ts';

export const MatchInfo = z.object({
  gameConfig: GameConfigSchema,
  gameID: z.string(),
  msUntilStart: z.optional(z.number()),
  numClients: z.optional(z.number()),
});

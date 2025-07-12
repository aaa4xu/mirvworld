import { z } from 'zod/v4';

export const PlayerStatsSchema = z.object({
  createdAt: z.string(),
  games: z.array(
    z.object({
      gameId: z.string(),
      clientId: z.string(),
    }),
  ),
});

import { z } from 'zod';

export const PlayerStatsSchema = z.object({
  createdAt: z.string(),
  games: z.array(
    z.object({
      gameId: z.string(),
      clientId: z.string(),
    }),
  ),
});

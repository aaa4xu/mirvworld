import * as z from 'zod';

export const MatchStatsPlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  place: z.number(),
});

export type MatchStatsPlayer = z.infer<typeof MatchStatsPlayerSchema>;

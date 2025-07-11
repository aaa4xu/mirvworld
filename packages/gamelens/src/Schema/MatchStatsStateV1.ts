import * as z from 'zod';
import { MatchStatsPlayerSchema } from './MatchStatsPlayerV1.ts';

export const MatchStatsStateSchema = z.object({
  version: z.literal(1),
  players: z.array(MatchStatsPlayerSchema),
});

export type MatchStatsState = z.infer<typeof MatchStatsStateSchema>;

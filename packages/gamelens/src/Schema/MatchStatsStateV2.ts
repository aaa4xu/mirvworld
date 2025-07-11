import * as z from 'zod';
import { MatchStatsStateSchema as MatchStatsStateSchemaV1 } from './MatchStatsStateV1.ts';
import { MatchStatsTurnDataSchema } from './MatchStatsTurnDataV1.ts';

export const MatchStatsStateSchema = MatchStatsStateSchemaV1.extend({
  version: z.literal(2),
  turns: z.array(MatchStatsTurnDataSchema),
});

export type MatchStatsState = z.infer<typeof MatchStatsStateSchema>;

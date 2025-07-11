import * as z from 'zod';
import { MatchStatsStateSchema as MatchStatsStateV1 } from '../Schema/MatchStatsStateV1.ts';
import { MatchStatsStateSchema as MatchStatsStateV2 } from '../Schema/MatchStatsStateV2.ts';

export const MatchStatsState = z.discriminatedUnion('version', [MatchStatsStateV1, MatchStatsStateV2]);

export type MatchStatsState = z.infer<typeof MatchStatsState>;

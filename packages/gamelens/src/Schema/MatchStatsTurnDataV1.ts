import * as z from 'zod';

export const MatchStatsTurnDataSchema = z.object({
  turn: z.number(),
  territory: z.array(z.number()),
});

export type MatchStatsTurnData = z.infer<typeof MatchStatsTurnDataSchema>;

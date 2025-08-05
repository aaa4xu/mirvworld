import z from 'zod/v4';
import { MatchInfoSchema } from './MatchInfoSchema.ts';

export const LobbiesResponse = z.object({
  lobbies: z.array(MatchInfoSchema),
});

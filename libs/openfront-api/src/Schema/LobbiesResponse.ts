import z from 'zod';
import { MatchInfoSchema } from './MatchInfoSchema.ts';

export const LobbiesResponse = z.object({
  lobbies: z.array(MatchInfoSchema),
});

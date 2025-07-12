import { z } from 'zod/v4';
import { MatchInfo } from './MatchInfo.ts';

export const LobbiesResponse = z.object({
  lobbies: z.array(MatchInfo),
});

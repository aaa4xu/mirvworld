import { z } from 'zod';
import { MatchInfo } from './MatchInfo.ts';

export const LobbiesResponse = z.object({
  lobbies: z.array(MatchInfo),
});

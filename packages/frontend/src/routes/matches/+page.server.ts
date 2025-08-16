import type { PageServerLoad } from './$types';
import { trpc } from '$lib/server/trpc';
import type { MatchBlockInfo } from '$lib/MatchBlockInfo';

export const load: PageServerLoad = async () => {
  return {
    matches: (await trpc.matches.latest.query()).map((match): MatchBlockInfo => {
      return {
        map: match.map,
        mode: match.mode,
        startedAt: match.startedAt,
        maxPlayers: match.maxPlayers,
        players: match.players.length,
        id: match.gameId,
        finishedAt: match.finishedAt,
        winner: match.winner ?? 'unknown',
      };
    }),
  };
};

import type { PageServerLoad } from './$types';
import { trpc } from '$lib/server/trpc';
import type { MatchBlockInfo } from '$lib/MatchBlockInfo';

type TRPCMatches = Awaited<ReturnType<typeof trpc.matches.latest.query>>[0];

const processMatch = (match: TRPCMatches): MatchBlockInfo => ({
  map: match.map,
  mode: match.mode,
  startedAt: match.startedAt,
  maxPlayers: match.maxPlayers,
  players: match.players.length,
  id: match.gameId,
  finishedAt: match.finishedAt,
  winner: match.winner ?? 'unknown',
});

export const load: PageServerLoad = async ({ url }) => {
  const playerSearch = url.searchParams.get('player')?.trim();

  let matches = await (playerSearch
    ? trpc.matches.searchByPlayerName.query(playerSearch)
    : trpc.matches.latest.query());

  return {
    matches: matches.map(processMatch),
    playerSearch,
  };
};

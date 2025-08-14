import type { PageServerLoad } from './$types';
import { trpc } from '$lib/server/trpc';
import type { Actions } from './$types';
import { isRedirect, redirect } from '@sveltejs/kit';
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

export const actions = {
  search: async ({ request }) => {
    const data = await request.formData();
    const player = data.get('player');

    if (!player || typeof player !== 'string') {
      throw redirect(302, '/');
    }

    const results = await trpc.matches.searchByPlayerName.query(player);

    return {
      results: results.map((match): MatchBlockInfo => {
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
  },

  importMatch: async ({ request }) => {
    const data = await request.formData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = data.get('lobby') as any;

    try {
      await trpc.matches.importById.mutate(id);
      throw redirect(303, `/matches/${id}.html`);
    } catch (err) {
      if (isRedirect(err)) {
        throw err;
      }

      console.error(err);
      return {
        importError: err instanceof Error ? err.message : String(err),
      };
    }
  },
} satisfies Actions;

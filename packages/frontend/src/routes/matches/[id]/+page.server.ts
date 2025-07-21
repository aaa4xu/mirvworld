import type { PageServerLoad } from './$types';
import { getListOfLiveGames } from '$lib/server/livegames';
import { trpc } from '$lib/server/trpc';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async (ctx) => {
  const match = await trpc.matches.getByGameId.query(ctx.params.id);
  if (!match) {
    return error(404, {
      message: 'Match not found',
    });
  }

  return {
    match,
  };
};

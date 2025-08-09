import type { PageServerLoad } from './$types';
import { trpc } from '$lib/server/trpc';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async (ctx) => {
  const tournament = await trpc.tournaments.getById.query(ctx.params.id);
  if (!tournament) {
    return error(404, {
      message: 'Tournament not found',
    });
  }

  return {
    tournament,
  };
};

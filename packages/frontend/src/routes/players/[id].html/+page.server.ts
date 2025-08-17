import type { PageServerLoad } from './$types';
import { trpc } from '$lib/server/trpc';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const player = await trpc.players.getById.query(params.id);
  if (!player) {
    throw error(404, 'Player not found');
  }

  return { player };
};

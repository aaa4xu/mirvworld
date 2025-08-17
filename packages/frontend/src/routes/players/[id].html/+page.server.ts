import type { PageServerLoad } from './$types';
import { trpc } from '$lib/server/trpc';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const player = await trpc.players.getById.query(params.id).catch((err) => {
    console.error('Failed to get player info from backend:', err);
    return null;
  });

  if (!player) {
    throw error(404, 'Player not found');
  }

  if (params.id !== player._id.toString()) {
    throw redirect(301, `/players/${player._id}.html`);
  }

  return { player };
};

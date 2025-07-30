import type { PageServerLoad } from './$types';
import { trpc } from '$lib/server/trpc';
import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ request }) => {
  return {
    matches: await trpc.matches.latest.query(),
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
      results: results,
    };
  },
} satisfies Actions;

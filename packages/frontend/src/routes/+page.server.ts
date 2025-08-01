import type { PageServerLoad } from './$types';
import { trpc } from '$lib/server/trpc';
import type { Actions } from './$types';
import { isRedirect, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
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

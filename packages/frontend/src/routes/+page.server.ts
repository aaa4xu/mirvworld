import type { PageServerLoad } from './$types';
import { trpc } from '$lib/server/trpc';
import type { Actions } from './$types';
import { error, isRedirect, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
  return {};
};

export const actions = {
  search: async ({ request }) => {
    const data = await request.formData();
    const player = data.get('player');

    if (!player || typeof player !== 'string') {
      throw error(404, 'Invalid player ID');
    }

    const id = player.trim();
    if (player.length !== 8) {
      throw error(404, 'Invalid player ID');
    }

    return redirect(303, `/players/${id}.html`);
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

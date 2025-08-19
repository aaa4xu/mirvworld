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
    const search = data.get('search');

    if (!search || typeof search !== 'string') {
      throw error(422, 'Invalid search value');
    }

    const id = search.trim();
    if (id.length !== 8) {
      throw error(422, 'Invalid ID');
    }

    const match = await trpc.matches.getByGameId.query(id).catch(() => null);
    if (match) {
      return redirect(303, `/matches/${id}.html`);
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

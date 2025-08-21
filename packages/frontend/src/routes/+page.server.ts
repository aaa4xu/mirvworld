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

    const query = search.trim();

    if (query.length === 8) {
      const [match, player] = await Promise.all([
        await trpc.matches.getByGameId.query(query).catch(() => null),
        await trpc.players.getById.query(query).catch(() => null),
      ]);

      if (match) {
        return redirect(303, `/matches/${query}.html`);
      }

      if (player) {
        return redirect(303, `/players/${query}.html`);
      }
    }

    return redirect(303, `/matches?player=${encodeURIComponent(query)}`);
  },
} satisfies Actions;

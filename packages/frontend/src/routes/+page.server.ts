import type { PageServerLoad } from './$types';
import { getListOfLiveGames } from '$lib/server/livegames';
import { trpc } from '$lib/server/trpc';

export const load: PageServerLoad = async () => {
  return {
    match: await trpc.matches.getById.query(12),
  };
};

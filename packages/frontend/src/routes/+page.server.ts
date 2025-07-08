import type { PageServerLoad } from './$types';
import { trpc } from '$lib/server/trpc';

export const load: PageServerLoad = async () => {
  const matches = await trpc.latestMatches.query();

  return {
    matches,
  };
};

import type { PageServerLoad } from './$types';
import { createTrpc } from '$lib/server/trpc';

export const load: PageServerLoad = async (event) => {
  const trpc = createTrpc(event);
  const matches = await trpc.latestMatches.query();

  return {
    matches,
  };
};

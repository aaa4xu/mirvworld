import type { PageServerLoad } from './$types';
import { trpc } from '$lib/server/trpc';

export const load: PageServerLoad = async () => {
  return {
    matches: await trpc.matches.latest.query(),
  };
};

import type { PageServerLoad } from './$types';
import { trpc } from '$lib/server/trpc';

export const load: PageServerLoad = async (ctx) => {
  const clans = await trpc.leaderboard.clans.query();
  return {
    clans,
  };
};

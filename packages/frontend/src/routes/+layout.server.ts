import type { LayoutServerLoad } from './$types';
import { createTrpc } from '$lib/server/trpc';

export const load: LayoutServerLoad = async (event) => {
  const trpc = createTrpc(event);
  const user = await trpc.me.query();

  return {
    user,
  };
};

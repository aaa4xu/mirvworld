import type { PageServerLoad } from './$types';
import { createTrpc } from '$lib/server/trpc';
import { TRPCClientError } from '@trpc/client';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
  const trpc = createTrpc(event);

  try {
    const match = await trpc.match.query(event.params.id);

    return {
      match,
    };
  } catch (err) {
    if (err instanceof TRPCClientError && err.data.code === 'NOT_FOUND') {
      throw error(404, 'Match not found');
    }

    throw err;
  }
};

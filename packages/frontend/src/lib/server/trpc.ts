import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from 'matches/src/trpc/router';
import superjson from 'superjson';
import { env } from '$env/dynamic/private';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: env.BACKEND_ENDPOINT ?? 'http://localhost:3600',
      transformer: superjson,
    }),
  ],
});

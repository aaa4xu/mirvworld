import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from 'matches/src/trpc/router';
import superjson from 'superjson';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3600',
      transformer: superjson,
    }),
  ],
});

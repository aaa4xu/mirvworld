import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from 'backend';
import { env } from '$env/dynamic/private';

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: env.BACKEND_ENDPOINT ?? 'http://localhost:4000' })],
});

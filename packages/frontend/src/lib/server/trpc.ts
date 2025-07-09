import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from 'backend';
import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';
import { parse, stringify } from 'devalue';

export const transformer = {
  deserialize: (object: any) => parse(object),
  serialize: (object: any) => stringify(object),
};

export function createTrpc(event: RequestEvent) {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: env.BACKEND_ENDPOINT ?? 'http://localhost:4000',
        fetch: event.fetch,
        headers() {
          const token = event.cookies.get('token');
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
        transformer,
      }),
    ],
  });
}

import { withMetrics } from './src/withMetrics.ts';
import { httpRequestsTotal, register, upstreamRequestDuration } from './src/prometheus.ts';
import { LobbiesResponse } from '@mirvworld/openfront-api';
import z from 'zod';
import { config } from './config.ts';
import { HttpError } from './src/HttpError.ts';
import os from 'node:os';

let getPublicLobbiesPromise: Promise<z.infer<typeof LobbiesResponse>> | null = null;

const url = new URL(config.endpoint);
url.pathname = '/api/public_lobbies';

async function getPublicLobbies() {
  const startTime = Date.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(config.authHeader.length > 0 && config.authToken.length > 0
          ? { [config.authHeader]: config.authToken }
          : {}),
        'User-Agent': `MIRVWorldGateway/1.0 (${os.platform()}; Bun ${Bun.version}); +https://github.com/aaa4xu/mirvworld`,
      },
    });

    if (!response.ok) {
      throw new HttpError(response.statusText, response.status);
    }

    const lobbies = await response.json();

    return LobbiesResponse.parse(lobbies);
  } finally {
    upstreamRequestDuration.observe(
      { method: 'GET', route: '/api/public_lobbies', code: 200 },
      (Date.now() - startTime) / 1000,
    );
  }
}

const server = Bun.serve({
  routes: {
    '/api/public_lobbies': withMetrics(httpRequestsTotal)(async () => {
      try {
        if (!getPublicLobbiesPromise) {
          const startTime = Date.now();
          getPublicLobbiesPromise = getPublicLobbies().finally(() => {
            setTimeout(
              () => {
                getPublicLobbiesPromise = null;
              },
              Math.max(0, startTime + config.throttle - Date.now()),
            );
          });
        }

        const lobbies = await getPublicLobbiesPromise;
        return new Response(JSON.stringify(lobbies), {
          headers: {
            'Content-Type': 'text/html', // upstream отдает неверный тип
          },
        });
      } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Failed to get list of public lobbies' }), {
          status: err instanceof HttpError ? err.status : 502,
        });
      }
    }),

    '/metrics': async () =>
      new Response(await register.metrics(), {
        headers: { 'Content-Type': register.contentType },
      }),
  },
  port: config.port,
  idleTimeout: 15,
});

console.log(`Listening on ${server.url}`);

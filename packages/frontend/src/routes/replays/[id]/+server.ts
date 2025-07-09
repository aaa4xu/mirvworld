import type { RequestEvent } from './$types';
import path from 'node:path';
import { dev } from '$app/environment';

export async function GET(event: RequestEvent): Promise<Response> {
  if (!dev) {
    return new Response('Not found', { status: 404 });
  }

  const decoder = new TextDecoder();
  const content = JSON.parse(
    decoder.decode(
      Bun.gunzipSync(await Bun.file(path.join('../../storage/replays', `${event.params.id}.gz`)).arrayBuffer()),
    ),
  );

  return new Response(JSON.stringify(content), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

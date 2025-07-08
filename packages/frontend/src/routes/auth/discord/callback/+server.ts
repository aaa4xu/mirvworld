import type { RequestEvent } from './$types';
import type { OAuth2Tokens } from 'arctic';
import { discord } from '$lib/server/oauth';
import { json } from '@sveltejs/kit';

export async function GET(event: RequestEvent): Promise<Response> {
  const storedState = event.cookies.get('discord_oauth_state') ?? null;
  const code = event.url.searchParams.get('code');
  const state = event.url.searchParams.get('state');

  if (state !== storedState || code === null || state === null) {
    return new Response('Incorrect state. Please restart the process', { status: 400 });
  }

  let tokens: OAuth2Tokens;
  try {
    tokens = await discord.validateAuthorizationCode(code, null);
  } catch (e) {
    return new Response('Failed to validate auth code. Please restart the process', {
      status: 400,
    });
  }

  const accessToken = tokens.accessToken();

  const response = await fetch('https://discord.com/api/users/@me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return json(await response.json());
}

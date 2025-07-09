import type { PageServerLoad } from './$types';
import type { OAuth2Tokens } from 'arctic';
import { discord } from '$lib/server/oauth';
import { DiscordUserInfo } from '$lib/schema/DiscordUserInfo';
import { redirect } from '@sveltejs/kit';
import { createTrpc } from '$lib/server/trpc';

export const load: PageServerLoad = async (event) => {
  const trpc = createTrpc(event);

  const storedState = event.cookies.get('discord_oauth_state') ?? null;
  event.cookies.delete('discord_oauth_state', { path: '/' });
  const code = event.url.searchParams.get('code');
  const state = event.url.searchParams.get('state');

  if (state !== storedState || code === null || state === null) {
    return {
      error: 'Incorrect state',
    };
  }

  let tokens: OAuth2Tokens;
  try {
    tokens = await discord.validateAuthorizationCode(code, null);
  } catch (e) {
    return {
      error: 'Failed to validate auth code',
    };
  }

  const accessToken = tokens.accessToken();

  const response = await fetch('https://discord.com/api/users/@me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const discordUser = DiscordUserInfo.parse(await response.json());

  const token = await trpc.discordLogin.mutate({
    id: discordUser.id,
    name: discordUser.global_name,
    avatar: discordUser.avatar,
  });

  event.cookies.set('token', token, {
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
  });

  throw redirect(302, '/');
};

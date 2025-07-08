import type { PageServerLoad } from './$types';
import type { OAuth2Tokens } from 'arctic';
import { discord } from '$lib/server/oauth';
import { DiscordUserInfo } from '$lib/schema/DiscordUserInfo';

export const load: PageServerLoad = async ({ url, cookies }) => {
  const storedState = cookies.get('discord_oauth_state') ?? null;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

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

  return {
    user: DiscordUserInfo.parse(await response.json()),
  };
};

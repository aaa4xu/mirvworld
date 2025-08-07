import * as arctic from 'arctic';
import { error, redirect } from '@sveltejs/kit';
import { discord } from '$lib/server/oauth/discord';
import z from 'zod';

export async function GET({ params, url }) {
  try {
    const code = z.string().parse(url.searchParams.get('state'));

    const tokens = await discord.validateAuthorizationCode(code, null);
    const accessToken = tokens.accessToken();
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const user = await response.json();

    return new Response(JSON.stringify(user), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    if (e instanceof arctic.OAuth2RequestError) {
      // Invalid authorization code, credentials, or redirect URI
      console.error('Discord auth failed: ', e);
      throw error(403, 'Invalid authorization code or credentials');
    }
    if (e instanceof arctic.ArcticFetchError) {
      // Failed to call `fetch()`
      console.error('Discord auth failed: ', e);
      throw error(403, 'Failed to connect to Discord');
    }
    // Parse error
    console.error('Discord auth failed: ', e);
    throw error(403, 'Failed to parse response from Discord');
  }
}

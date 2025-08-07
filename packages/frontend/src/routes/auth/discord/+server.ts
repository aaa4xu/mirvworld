import * as arctic from 'arctic';
import { redirect } from '@sveltejs/kit';
import { discord } from '$lib/server/oauth/discord';

export async function GET({ params }) {
  const state = arctic.generateState();
  const url = discord.createAuthorizationURL(state, null, ['identify']);
  url.searchParams.set('prompt', 'none');
  throw redirect(302, url);
}

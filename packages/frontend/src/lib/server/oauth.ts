import { Discord } from 'arctic';
import { env } from '$env/dynamic/private';

// TODO: Update redirect URI
export const discord = new Discord(
  env.OAUTH_DISCORD_CLIENT_ID,
  env.OAUTH_DISCORD_CLIENT_SECRET,
  env.OAUTH_DISCORD_REDIRECT_URI,
);

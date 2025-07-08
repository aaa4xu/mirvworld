import { Discord } from 'arctic';
import { OAUTH_DISCORD_CLIENT_ID, OAUTH_DISCORD_CLIENT_SECRET, OAUTH_DISCORD_REDIRECT_URI } from '$env/static/private';

// TODO: Update redirect URI
export const discord = new Discord(OAUTH_DISCORD_CLIENT_ID, OAUTH_DISCORD_CLIENT_SECRET, OAUTH_DISCORD_REDIRECT_URI);

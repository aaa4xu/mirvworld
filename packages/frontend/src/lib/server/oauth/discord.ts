import * as arctic from 'arctic';
import { env } from '$env/dynamic/private';

export const discord = new arctic.Discord(env.OAUTH_DISCORD_ID, env.OAUTH_DISCORD_SECRET, env.OAUTH_DISCORD_CALLBACK);

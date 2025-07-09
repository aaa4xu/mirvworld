export const config = {
  maxGameDuration: 3 * 60 * 60 * 1000, // GameServer.maxGameDuration
  endpoint: env('MIRVWORLD_ENDPOINT', 'https://openfront.io'),
  database: env('MIRVWORLD_DATABASE', '../../storage/db/lurker.db'),
  replaysPath: env('MIRVWORLD_REPLAYS_PATH', '../../storage/replays'),
  migrationsPath: env('MIRVWORLD_MIGRATIONS_PATH', './drizzle'),
  http: {
    port: parseInt(env('MIRVWORLD_HTTP_PORT', '4000'), 10),
    secret: env('MIRVWORLD_HTTP_SECRET', 'secret'),
  },
};

function env(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;

  if (typeof value === 'undefined') {
    throw new Error(`Missing environment variable ${name}`);
  }

  return value;
}

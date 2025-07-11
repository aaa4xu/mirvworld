export const config = {
  http: {
    port: env('GAMELENS_HTTP_PORT', '9100'),
    secret: env('GAMELENS_HTTP_SECRET', 'secret'),
  },
};

function env(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;

  if (typeof value === 'undefined') {
    throw new Error(`Missing environment variable ${name}`);
  }

  return value;
}

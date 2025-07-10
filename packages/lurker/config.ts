export const config = {
  state: env('LURKER_STATE', '../../storage/lurker-state.json'),
  endpoint: env('LURKER_ENDPOINT', 'https://openfront.io'),
  s3: {
    keyId: env('LURKER_S3_KEY_ID', 'minioadmin'),
    secret: env('LURKER_S3_SECRET', 'minioadmin'),
    bucket: env('LURKER_S3_BUCKET', 'replays'),
    endpoint: env('LURKER_S3_ENDPOINT', 'http://localhost:9000'),
  },
};

function env(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;

  if (typeof value === 'undefined') {
    throw new Error(`Missing environment variable ${name}`);
  }

  return value;
}

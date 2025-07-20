import type { ClientOptions } from 'minio';

const s3Url = new URL(env('GAMELENS_S3_ENDPOINT', 'http://localhost:9000'));
const s3UseSSL = s3Url.protocol === 'https:';
const s3Port = s3Url.port ? Number(s3Url.port) : s3UseSSL ? 443 : 80;

export const config = {
  s3: {
    bucket: env('GAMELENS_S3_BUCKET', 'gamelens-v4'),
    endpoint: {
      endPoint: s3Url.hostname,
      port: s3Port,
      useSSL: s3UseSSL,
      accessKey: env('GAMELENS_S3_KEY_ID', 'minioadmin'),
      secretKey: env('GAMELENS_S3_SECRET', 'minioadmin'),
    } satisfies ClientOptions,
  },
  redis: env('GAMELENS_REDIS_URL', 'redis://localhost:6379'),
  mapsPath: env('GAMELENS_MAPS_PATH', './../openfront/game/resources/maps'),
};

export function env(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;

  if (typeof value === 'undefined') {
    throw new Error(`Missing environment variable ${name}`);
  }

  return value;
}

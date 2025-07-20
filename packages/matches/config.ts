import type { ClientOptions } from 'minio';

const s3Url = new URL(env('MATCHES_S3_ENDPOINT', 'http://localhost:9000'));
const s3UseSSL = s3Url.protocol === 'https:';
const s3Port = s3Url.port ? Number(s3Url.port) : s3UseSSL ? 443 : 80;

export const config = {
  s3: {
    bucket: env('MATCHES_S3_BUCKET', 'replays'),
    endpoint: {
      endPoint: s3Url.hostname,
      port: s3Port,
      useSSL: s3UseSSL,
      accessKey: env('MATCHES_S3_KEY_ID', 'minioadmin'),
      secretKey: env('MATCHES_S3_SECRET', 'minioadmin'),
    } satisfies ClientOptions,
  },
  redis: env('MATCHES_REDIS_URL', 'redis://localhost:6379'),
};

export function env(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;

  if (typeof value === 'undefined') {
    throw new Error(`Missing environment variable ${name}`);
  }

  return value;
}

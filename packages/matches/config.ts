import type { ClientOptions } from 'minio';

const s3Url = new URL(env('MATCHES_REPLAYS_S3_URL', 'http://minioadmin:minioadmin@localhost:9000'));
const s3UseSSL = s3Url.protocol === 'https:';
const s3Port = s3Url.port ? Number(s3Url.port) : s3UseSSL ? 443 : 80;

export const config = {
  replays: {
    s3: {
      bucket: env('MATCHES_REPLAYS_S3_BUCKET', 'replays'),
      endpoint: {
        endPoint: s3Url.hostname,
        port: s3Port,
        useSSL: s3UseSSL,
        accessKey: s3Url.username,
        secretKey: s3Url.password,
      } satisfies ClientOptions,
    },
  },
  redis: env('MATCHES_REDIS_URL', 'redis://localhost:6379'),
  http: {
    port: parseInt(env('MATCHES_HTTP_PORT', '3600'), 10),
  },
};

export function env(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;

  if (typeof value === 'undefined') {
    throw new Error(`Missing environment variable ${name}`);
  }

  return value;
}

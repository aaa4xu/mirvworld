import { createMinioClientOptions, env } from 'utils';

export const config = {
  replays: {
    s3: {
      bucket: env('MATCHES_REPLAYS_S3_BUCKET', 'replays'),
      endpoint: createMinioClientOptions(env('MATCHES_REPLAYS_S3_URL', 'http://minioadmin:minioadmin@localhost:9000')),
    },
  },
  redis: env('MATCHES_REDIS_URL', 'redis://localhost:6379'),
  http: {
    port: parseInt(env('MATCHES_HTTP_PORT', '3600'), 10),
  },
};

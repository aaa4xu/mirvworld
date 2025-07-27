import { createMinioClientOptions, env } from 'utils';

export const config = {
  replays: {
    s3: {
      bucket: env('MATCHES_REPLAYS_S3_BUCKET', 'replays'),
      endpoint: createMinioClientOptions(env('MATCHES_REPLAYS_S3_URL', 'http://minioadmin:minioadmin@localhost:9000')),
    },
  },
  gamelens: {
    s3: {
      bucket: env('MATCHES_GAMELENS_S3_BUCKET', 'gamelens'),
      endpoint: createMinioClientOptions(env('MATCHES_GAMELENS_S3_URL', 'http://minioadmin:minioadmin@localhost:9000')),
    },
  },
  redis: env('MATCHES_REDIS_URL', 'redis://localhost:6379'),
  http: {
    port: parseInt(env('MATCHES_HTTP_PORT', '3600'), 10),
  },
  db: env('DATABASE_URL', 'mysql://root:mysecretpassword@localhost:3306/local'),
  readOnly: env('MATCHES_READ_ONLY', '0') === '1',
};

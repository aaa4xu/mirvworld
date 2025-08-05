import { env } from 'utils/src/env';
import { createMinioClientOptions } from 'utils/src/createMinioClientOptions';

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
  openfront: {
    api: env('MATCHES_OPENFRONT_API_ENDPOINT', 'https://api.openfront.io'),
  },
  redis: env('MATCHES_REDIS_URL', 'redis://localhost:6379'),
  mongodb: {
    url: env('MATCHES_MONGODB_URL', 'mongodb://localhost:27017'),
    database: env('MATCHES_MONGODB_DATABASE', 'mirvworld-matches'),
  },
  http: {
    port: parseInt(env('MATCHES_HTTP_PORT', '3600'), 10),
  },
  readOnly: env('MATCHES_READ_ONLY', '0') === '1',
};

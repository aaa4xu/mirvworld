import { createMinioClientOptions, env } from 'utils';

export const config = {
  replays: {
    s3: {
      bucket: env('GAMELENS_REPLAYS_S3_BUCKET', 'replays'),
      endpoint: createMinioClientOptions(env('GAMELENS_REPLAYS_S3_URL', 'http://minioadmin:minioadmin@localhost:9000')),
    },
  },
  s3: {
    bucket: env('GAMELENS_S3_BUCKET', 'gamelens'),
    endpoint: createMinioClientOptions(env('GAMELENS_S3_URL', 'http://minioadmin:minioadmin@localhost:9000')),
  },
  redis: env('GAMELENS_REDIS_URL', 'redis://localhost:6379'),
  mapsPath: env('GAMELENS_MAPS_PATH', './../openfront/game/resources/maps'),
};

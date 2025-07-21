import { createMinioClientOptions, env } from 'utils';

export const config = {
  s3: {
    bucket: env('GAMELENS_S3_BUCKET', 'gamelens-v4'),
    endpoint: createMinioClientOptions(env('GAMELENS_S3_ENDPOINT', 'http://localhost:9000')),
  },
  redis: env('GAMELENS_REDIS_URL', 'redis://localhost:6379'),
  mapsPath: env('GAMELENS_MAPS_PATH', './../openfront/game/resources/maps'),
};

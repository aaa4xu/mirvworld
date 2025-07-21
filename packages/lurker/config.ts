import { createMinioClientOptions, env } from 'utils';

export const config = {
  s3: {
    bucket: env('LURKER_S3_BUCKET', 'replays'),
    endpoint: createMinioClientOptions(env('LURKER_S3_URL', 'http://minioadmin:minioadmin@localhost:9000')),
  },
  redis: env('LURKER_REDIS_URL', 'redis://localhost:6379'),
  lobbyInterval: parseInt(env('LURKER_LOBBY_INTERVAL', '6000'), 10),
  openfront: {
    workers: parseInt(env('LURKER_OPENFRONT_WORKERS', '20'), 10),
    server: env('LURKER_OPENFRONT_SERVER_ENDPOINT', 'https://openfront.io'),
    api: env('LURKER_OPENFRONT_API_ENDPOINT', 'https://api.openfront.io'),
  },
};

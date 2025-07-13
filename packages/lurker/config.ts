import type { ClientOptions } from 'minio';

const s3Url = new URL(env('LURKER_S3_ENDPOINT', 'http://localhost:9000'));
const s3UseSSL = s3Url.protocol === 'https:';
const s3Port = s3Url.port ? Number(s3Url.port) : s3UseSSL ? 443 : 80;

export const config = {
  s3: {
    bucket: env('LURKER_S3_BUCKET', 'replays'),
    endpoint: {
      endPoint: s3Url.hostname,
      port: s3Port,
      useSSL: s3UseSSL,
      accessKey: env('LURKER_S3_KEY_ID', 'minioadmin'),
      secretKey: env('LURKER_S3_SECRET', 'minioadmin'),
    } satisfies ClientOptions,
  },
  redis: env('LURKER_REDIS_URL', 'redis://localhost:6379'),
  lobbyInterval: parseInt(env('LURKER_LOBBY_INTERVAL', '6000'), 10),
  importPath: env('LURKER_IMPORT_PATH', './import.json'),
  openfront: {
    workers: parseInt(env('LURKER_OPENFRONT_WORKERS', '20'), 10),
    server: env('LURKER_OPENFRONT_SERVER_ENDPOINT', 'https://openfront.io'),
    api: env('LURKER_OPENFRONT_API_ENDPOINT', 'https://api.openfront.io'),
  },
};

function env(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;

  if (typeof value === 'undefined') {
    throw new Error(`Missing environment variable ${name}`);
  }

  return value;
}

import type { ClientOptions } from 'minio';

export function createMinioClientOptions(url: string): ClientOptions {
  const s3Url = new URL(url);
  const s3UseSSL = s3Url.protocol === 'https:';
  const s3Port = s3Url.port ? Number(s3Url.port) : s3UseSSL ? 443 : 80;

  return {
    endPoint: s3Url.hostname,
    port: s3Port,
    useSSL: s3UseSSL,
    accessKey: s3Url.username,
    secretKey: s3Url.password,
  };
}

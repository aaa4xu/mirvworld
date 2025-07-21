import { Client } from 'minio';
import { finished } from 'node:stream/promises';
import type { Storage } from './Storage.ts';

export class MinioStorage implements Storage {
  public constructor(
    private readonly bucket: string,
    private readonly client: Client,
  ) {}

  public async write(filename: string, data: Buffer<ArrayBufferLike>, metadata: Record<string, string>) {
    await this.client.putObject(this.bucket, filename, data, data.length, metadata);
  }

  public async read(filename: string) {
    const stream = await this.client.getObject(this.bucket, filename);

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    await finished(stream, { cleanup: true });
    return Buffer.concat(chunks);
  }
}

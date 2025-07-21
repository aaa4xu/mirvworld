import type { Storage } from './Storage.ts';
import path from 'node:path';

export class LocalStorage implements Storage {
  public constructor(private readonly root: string) {}

  public async write(filename: string, data: Buffer<ArrayBufferLike>, metadata: Record<string, string>): Promise<void> {
    await Bun.file(this.filepath(filename)).write(data);
  }

  public async read(filename: string): Promise<Buffer> {
    return Buffer.from(await Bun.file(this.filepath(filename)).arrayBuffer());
  }

  private filepath(filename: string) {
    return path.join(this.root, filename);
  }
}

import type { Storage } from './Storage.ts';

export class CompressedStorage implements Storage {
  public constructor(
    private readonly storage: Storage,
    private readonly compressionLevel = 17,
  ) {}

  public async write(filename: string, data: Buffer<ArrayBufferLike>, metadata: Record<string, string>) {
    const compressed = await Bun.zstdCompress(data, { level: this.compressionLevel });
    await this.storage.write(this.filename(filename), compressed, {
      ...metadata,
      'Content-Encoding': 'zstd',
    });
  }

  public async read(filename: string) {
    const data = await this.storage.read(this.filename(filename));
    return Bun.zstdDecompress(data);
  }

  private filename(filename: string) {
    if (filename.endsWith('.zst')) {
      return filename;
    } else {
      return `${filename}.zst`;
    }
  }
}

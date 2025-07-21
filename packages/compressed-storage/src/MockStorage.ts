import type { Storage } from './Storage.ts';

export class MockStorage implements Storage {
  private readonly storage = new Map<string, { data: Buffer; metadata: Record<string, string> }>();

  public async write(filename: string, data: Buffer, metadata: Record<string, string>): Promise<void> {
    this.storage.set(filename, { data, metadata });
  }

  public async read(filename: string): Promise<Buffer> {
    const file = this.storage.get(filename);
    if (!file) {
      throw new Error(`File not found: ${filename}`);
    }
    return file.data;
  }
}

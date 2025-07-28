import type { Storage } from './Storage.ts';
import { z } from 'zod/v4';

export class JSONStorage<T> {
  public constructor(
    private readonly storage: Storage,
    private readonly schema: z.ZodType<T>,
    private readonly replacer?: (key: string, value: any) => any,
  ) {}

  public write(filename: string, json: T) {
    const buffer = Buffer.from(JSON.stringify(json, this.replacer));
    return this.storage.write(filename, buffer, {
      'Content-Type': 'application/json',
    });
  }

  public async read(filename: string): Promise<T> {
    const data = await this.storage.read(filename);
    const json = JSON.parse(data.toString());
    return this.schema.parse(json);
  }
}

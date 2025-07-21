import type { Storage } from './Storage.ts';
import { z } from 'zod/v4';

export class JSONStorage<T extends z.ZodTypeAny> {
  public constructor(
    private readonly storage: Storage,
    private readonly schema: T,
    private readonly replacer?: (key: string, value: any) => any,
  ) {}

  public write(filename: string, json: z.input<T>) {
    const buffer = Buffer.from(JSON.stringify(json, this.replacer));
    return this.storage.write(filename, buffer, {
      'Content-Type': 'application/json',
    });
  }

  public async read(filename: string): Promise<z.output<T>> {
    const data = await this.storage.read(filename);
    const json = JSON.parse(data.toString());
    return this.schema.parse(json);
  }
}

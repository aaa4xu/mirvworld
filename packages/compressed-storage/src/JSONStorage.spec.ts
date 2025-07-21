import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import { z } from 'zod/v4';
import { JSONStorage } from './JSONStorage';
import { MockStorage } from './MockStorage';

describe('JSONStorage', () => {
  let mockStorage: MockStorage;
  let jsonStorage: JSONStorage<typeof TestSchema>;

  beforeEach(() => {
    mockStorage = new MockStorage();
    jsonStorage = new JSONStorage(mockStorage, TestSchema);
  });

  it('should correctly write and read back data', async () => {
    const filename = 'e2e-test.json';
    const data: TestSchema = { name: 'test-data', value: 123, arr: [1, 1, 2, 2, 3, 3] };

    await jsonStorage.write(filename, data);
    const readData = await jsonStorage.read(filename);

    expect(readData).toEqual(data);
  });

  it('should throw when reading data that does not match schema', async () => {
    const filename = 'invalid.json';
    const invalidData = { name: 'invalid-data', value: 'not-a-number' };
    await mockStorage.write(filename, Buffer.from(JSON.stringify(invalidData)), {});

    expect(jsonStorage.read(filename)).rejects.toThrowError('Invalid input');
  });

  it("should be able to storage bigint in openfront's format", async () => {
    const replacer = (key: string, value: any) => (typeof value === 'bigint' ? value.toString() : value);

    const schema = z.object({
      value: BigIntStringSchema,
    });

    const storageWithReplacer = new JSONStorage(mockStorage, schema, replacer);

    const filename = 'replacer-test.json';
    const data: z.infer<typeof schema> = { value: 100n };

    await storageWithReplacer.write(filename, data);
    const readData = await storageWithReplacer.read(filename);
    expect(readData).toEqual(data);
  });
});

const BigIntStringSchema = z.preprocess((val) => {
  if (typeof val === 'string' && /^\d+$/.test(val)) return BigInt(val);
  if (typeof val === 'bigint') return val;
  return val;
}, z.bigint());

const TestSchema = z.object({
  name: z.string(),
  value: z.number(),
  arr: z.array(z.number()),
});

type TestSchema = z.infer<typeof TestSchema>;

import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import { CompressedStorage } from './CompressedStorage';
import { MockStorage } from './MockStorage.ts';

describe('CompressedStorage', () => {
  let mockStorage = new MockStorage();
  let compressedStorage: CompressedStorage;

  const writeSpy = spyOn(mockStorage, 'write');

  beforeEach(() => {
    compressedStorage = new CompressedStorage(mockStorage);
    writeSpy.mockClear();
  });

  it('should compress data on write', async () => {
    const filename = 'test.txt';
    const data = Buffer.from(Array.from({ length: 1000 }, () => 'a').join(''));

    await compressedStorage.write(filename, data, {});

    expect(writeSpy).toHaveBeenCalledTimes(1);
    expect(writeSpy.mock.calls[0]?.[0]).toContain(filename);
    expect(writeSpy.mock.calls[0]?.[1]?.length).toBeLessThan(data.length);
  });

  it('should write and read back the same data', async () => {
    const filename = 'e2e-test.txt';
    const data = Buffer.from(Array.from({ length: 1000 }, () => 'a').join(''));

    await compressedStorage.write(filename, data, {});
    const readData = await compressedStorage.read(filename);

    expect(readData).toEqual(data);
  });
});

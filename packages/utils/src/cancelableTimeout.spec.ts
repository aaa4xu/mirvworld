import { describe, it, expect } from 'bun:test';
import { cancelableTimeout } from './cancelableTimeout.ts';

describe('cancelableTimeout', () => {
  it('should wait for specified delay before resolving', async () => {
    const time = Date.now();
    await cancelableTimeout(10, new AbortController().signal);
    expect(Date.now() - time).toBeGreaterThanOrEqual(10);
  });

  it('should throw Aborted error when AbortSignal is triggered', async () => {
    const controller = new AbortController();
    const timeout = cancelableTimeout(10, controller.signal);
    controller.abort();
    expect(timeout).rejects.toThrowError('Aborted');
  });
});

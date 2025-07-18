import { GameId } from './GameId.ts';
import { describe, expect, it } from 'bun:test';

describe('GameId', () => {
  it('should convert to string using toString method', () => {
    const id = new GameId('cMaLXZbG', 20);
    expect(id.toString()).toBe('cMaLXZbG');
  });

  it('should derive worker id from game id', () => {
    const id = new GameId('cMaLXZbG', 20);
    expect(id.workerId).toBe('w0');
  });

  it('should serialize to string', () => {
    const id = new GameId('cMaLXZbG', 20);
    expect(JSON.stringify({ id })).toBe('{"id":"cMaLXZbG"}');
  });
});

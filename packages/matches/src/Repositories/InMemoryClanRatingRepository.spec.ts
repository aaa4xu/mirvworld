import { beforeEach, describe, expect, it } from 'bun:test';
import type { ClanRatingRepository } from './ClanRatingRepository.ts';
import { InMemoryClanRatingRepository } from './InMemoryClanRatingRepository.ts';

describe('InMemoryClanRatingRepository', () => {
  let repo: ClanRatingRepository;

  beforeEach(() => {
    repo = new InMemoryClanRatingRepository();
  });

  it('is idempotent per gameId', async () => {
    await repo.applyDeltas('g2', [{ tag: 'ABC', mu: 1, sigma: 0, games: 1 }]);
    const r1 = await repo.getRating('ABC');

    // Re-applying with the same gameId should have no effect
    await repo.applyDeltas('g2', [{ tag: 'ABC', mu: 100, sigma: 100, games: 10 }]);
    const r2 = await repo.getRating('ABC');

    expect(r2).toEqual(r1);
  });

  it('getTop returns items sorted by descending score', async () => {
    await repo.applyDeltas('g3', [
      { tag: 'AAA', mu: 3, sigma: 0, games: 1 }, // higher mu -> likely higher score
      { tag: 'BBB', mu: 1, sigma: 0, games: 1 },
    ]);

    const top = await repo.getTop(2);
    expect(top.length).toBe(2);
    // AAA should be above BBB
    expect(top[0]!.tag).toBe('AAA');
    expect(top[1]!.tag).toBe('BBB');
    expect(top[0]!.score).toBeGreaterThan(top[1]!.score);
  });

  it('normalizes tags (case/whitespace) consistently', async () => {
    await repo.applyDeltas('g4', [{ tag: '  aBc  ', mu: 1.5, sigma: -0.2, games: 1 }]);
    const rUpper = await repo.getRating('ABC');
    const rLower = await repo.getRating('abc');
    expect(rUpper).not.toBeNull();
    expect(rLower).not.toBeNull();
    expect(rUpper).toEqual(rLower);
  });

  it('floors sigma at >= 0.001', async () => {
    // Push sigma far below zero: it must be clamped at 0.001
    await repo.applyDeltas('g5', [{ tag: 'CLAMP', mu: 0, sigma: -999, games: 1 }]);
    const r = await repo.getRating('CLAMP');
    expect(r).not.toBeNull();
    expect(r!.sigma).toBeCloseTo(0.001, 6);
  });

  it('increments games counter by games', async () => {
    await repo.applyDeltas('g6', [{ tag: 'GAMES', mu: 0, sigma: 0, games: 1 }]);
    const r1 = await repo.getRating('GAMES');
    expect(r1!.games).toBe(1);

    // New gameId should count again
    await repo.applyDeltas('g7', [{ tag: 'GAMES', mu: 0, sigma: 0, games: 2 }]);
    const r2 = await repo.getRating('GAMES');
    expect(r2!.games).toBe(3);
  });

  it('empty delta list still marks game as processed (no-op thereafter)', async () => {
    await repo.applyDeltas('g8', []); // processed marked
    // A subsequent non-empty apply with the same id should be ignored
    await repo.applyDeltas('g8', [{ tag: 'ZED', mu: 10, sigma: 0, games: 1 }]);
    const clan = await repo.getRating('ZED');
    expect(clan!.games).toBe(0);
  });

  it('multiple clans show up in leaderboard with correct limit', async () => {
    await repo.applyDeltas('g9', [
      { tag: 'X', mu: 2, sigma: 0, games: 1 },
      { tag: 'Y', mu: 1, sigma: 0, games: 1 },
      { tag: 'Z', mu: 0.5, sigma: 0, games: 1 },
    ]);
    const top2 = await repo.getTop(2);
    expect(top2.length).toBe(2);
    expect(new Set(top2.map((x) => x.tag))).toEqual(new Set(['X', 'Y']));
  });
});

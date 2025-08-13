import { beforeEach, describe, expect, it } from 'bun:test';
import type { ClanRatingRepository } from './ClanRatingRepository.ts';
import { InMemoryClanRatingRepository } from './InMemoryClanRatingRepository.ts';

describe('InMemoryClanRatingRepository', () => {
  let repo: ClanRatingRepository;

  beforeEach(() => {
    repo = new InMemoryClanRatingRepository();
  });

  it('is idempotent per gameId', async () => {
    await repo.applyDeltas('g2', [{ tag: 'ABC', dMu: 1, dSigma: 0, dGames: 1 }]);
    const r1 = await repo.getRating('ABC');

    // Re-applying with the same gameId should have no effect
    await repo.applyDeltas('g2', [{ tag: 'ABC', dMu: 100, dSigma: 100, dGames: 10 }]);
    const r2 = await repo.getRating('ABC');

    expect(r2).toEqual(r1);
  });

  it('getTop returns items sorted by descending score', async () => {
    await repo.applyDeltas('g3', [
      { tag: 'AAA', dMu: 3, dSigma: 0, dGames: 1 }, // higher mu -> likely higher score
      { tag: 'BBB', dMu: 1, dSigma: 0, dGames: 1 },
    ]);

    const top = await repo.getTop(2);
    expect(top.length).toBe(2);
    // AAA should be above BBB
    expect(top[0]!.tag).toBe('AAA');
    expect(top[1]!.tag).toBe('BBB');
    expect(top[0]!.score).toBeGreaterThan(top[1]!.score);
  });

  it('normalizes tags (case/whitespace) consistently', async () => {
    await repo.applyDeltas('g4', [{ tag: '  aBc  ', dMu: 1.5, dSigma: -0.2, dGames: 1 }]);
    const rUpper = await repo.getRating('ABC');
    const rLower = await repo.getRating('abc');
    expect(rUpper).not.toBeNull();
    expect(rLower).not.toBeNull();
    expect(rUpper).toEqual(rLower);
  });

  it('floors sigma at >= 0.001', async () => {
    // Push sigma far below zero: it must be clamped at 0.001
    await repo.applyDeltas('g5', [{ tag: 'CLAMP', dMu: 0, dSigma: -999, dGames: 1 }]);
    const r = await repo.getRating('CLAMP');
    expect(r).not.toBeNull();
    expect(r!.sigma).toBeCloseTo(0.001, 6);
  });

  it('increments games counter by dGames', async () => {
    await repo.applyDeltas('g6', [{ tag: 'GAMES', dMu: 0, dSigma: 0, dGames: 1 }]);
    const r1 = await repo.getRating('GAMES');
    expect(r1!.games).toBe(1);

    // New gameId should count again
    await repo.applyDeltas('g7', [{ tag: 'GAMES', dMu: 0, dSigma: 0, dGames: 2 }]);
    const r2 = await repo.getRating('GAMES');
    expect(r2!.games).toBe(3);
  });

  it('empty delta list still marks game as processed (no-op thereafter)', async () => {
    await repo.applyDeltas('g8', []); // processed marked
    // A subsequent non-empty apply with the same id should be ignored
    await repo.applyDeltas('g8', [{ tag: 'ZED', dMu: 10, dSigma: 0, dGames: 1 }]);
    const clan = await repo.getRating('ZED');
    expect(clan!.games).toBe(0);
  });

  it('multiple clans show up in leaderboard with correct limit', async () => {
    await repo.applyDeltas('g9', [
      { tag: 'X', dMu: 2, dSigma: 0, dGames: 1 },
      { tag: 'Y', dMu: 1, dSigma: 0, dGames: 1 },
      { tag: 'Z', dMu: 0.5, dSigma: 0, dGames: 1 },
    ]);
    const top2 = await repo.getTop(2);
    expect(top2.length).toBe(2);
    expect(new Set(top2.map((x) => x.tag))).toEqual(new Set(['X', 'Y']));
  });
});

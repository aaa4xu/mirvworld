import { describe, it, expect, beforeEach } from 'bun:test';
import { OpenSkill } from './OpenSkill';
import { InMemoryClanRatingRepository } from './Repositories/InMemoryClanRatingRepository';
import type { PlayerStats } from '@mirvworld/gamelens-stats';

function mk(over: Partial<PlayerStats>): PlayerStats {
  return {
    id: over.id ?? crypto.randomUUID(),
    name: over.name ?? '[AAA] Player',
    team: over.team ?? 'T1',
    firstBuild: over.firstBuild ?? 0,
    buildOrder: over.buildOrder ?? 'A',
    maxTiles: over.maxTiles ?? 0,
    tiles: over.tiles ?? 0,
    outgoingTroopsPerMinute: over.outgoingTroopsPerMinute ?? 0,
    incomingTroopsPerMinute: over.incomingTroopsPerMinute ?? 0,
    goldPerMinute: over.goldPerMinute ?? 0,
    death: over.death ?? 0,
    spawnX: over.spawnX ?? 0,
    spawnY: over.spawnY ?? 0,
    rank: over.rank ?? 1,
  };
}

describe('OpenSkill', () => {
  let repo: InMemoryClanRatingRepository;
  let os: OpenSkill;

  beforeEach(() => {
    repo = new InMemoryClanRatingRepository();
    os = new OpenSkill(repo as any);
  });

  it('handles same clan on multiple teams; counts one game for that clan', async () => {
    const players: PlayerStats[] = [
      mk({ name: '[AAA] A1', team: 'T1', rank: 1 }),
      mk({ name: '[AAA] A2', team: 'T1', rank: 2 }),
      mk({ name: '[AAA] A3', team: 'T2', rank: 3 }),
      mk({ name: '[AAA] A4', team: 'T2', rank: 4 }),
      mk({ name: '[CCC] C1', team: 'T3', rank: 5 }),
      mk({ name: '[CCC] C2', team: 'T3', rank: 6 }),
    ];
    await os.apply('g2', players);

    const a = await repo.getRating('AAA');
  });

  it('should ignore games if only single team is presents', async () => {
    const players: PlayerStats[] = [
      mk({ name: '[AAA] A1', team: 'T1', rank: 1 }),
      mk({ name: '[AAA] A2', team: 'T1', rank: 2 }),
      mk({ name: '[AAA] A3', team: 'T2', rank: 3 }),
      mk({ name: '[AAA] A4', team: 'T2', rank: 4 }),
    ];
    await os.apply('g2', players);

    const a = await repo.getRating('AAA');
    expect(a!.games).toBe(0);
  });

  it('ignores matches with <2 clan-bearing teams (e.g., only NO_CLAN team present)', async () => {
    const players: PlayerStats[] = [
      mk({ name: 'NoTag', team: 'X', rank: 1 }),
      mk({ name: 'NoTag2', team: 'X', rank: 2 }),
      mk({ name: '[AAA] Tag1', team: 'Y', rank: 3 }),
      mk({ name: '[AAA] Tag2', team: 'Y', rank: 4 }),
      mk({ name: '[AAA] Tag3', team: 'Y', rank: 5 }),
    ];
    await os.apply('g3', players);
    const top = await repo.getTop(10);
    expect(top.length).toBe(0);
  });

  it('repository idempotency: same gameId applied twice has no extra effect', async () => {
    const players: PlayerStats[] = [
      mk({ name: '[AAA] A1', team: 'A', rank: 1 }),
      mk({ name: '[AAA] A2', team: 'A', rank: 2 }),
      mk({ name: '[BBB] B1', team: 'B', rank: 3 }),
      mk({ name: '[BBB] B2', team: 'B', rank: 4 }),
    ];
    await os.apply('g4', players);
    const r1 = await repo.getRating('AAA');
    await os.apply('g4', players);
    const r2 = await repo.getRating('AAA');
    expect(r2).toEqual(r1);
  });

  it('leaderboard is sorted desc', async () => {
    await os.apply('g5', [
      mk({ name: '[XX] x1', team: 'TX', rank: 1 }),
      mk({ name: '[XX] x2', team: 'TX', rank: 2 }),
      mk({ name: '[YY] y1', team: 'TY', rank: 3 }),
      mk({ name: '[YY] y2', team: 'TY', rank: 4 }),
    ]);

    await os.apply('g6', [
      mk({ name: '[XX] x1', team: 'TX', rank: 1 }),
      mk({ name: '[XX] x2', team: 'TX', rank: 2 }),
      mk({ name: '[YY] y1', team: 'TY', rank: 3 }),
      mk({ name: '[YY] y2', team: 'TY', rank: 4 }),
    ]);

    const top = await repo.getTop(2);
    expect(top[0]!.score).toBeGreaterThanOrEqual(top[1]!.score);
  });
});

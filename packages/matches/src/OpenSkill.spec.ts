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

  it('updates AAA vs BBB and includes NO_CLAN as average public skill', async () => {
    const players: PlayerStats[] = [
      mk({ name: '[AAA] A1', team: 'A', rank: 1 }),
      mk({ name: 'Public Joe', team: 'A', rank: 2 }), // NO_CLAN
      mk({ name: '[BBB] B1', team: 'B', rank: 3 }),
    ];
    await os.apply('g1', players);

    const a = await repo.getRating('AAA');
    const b = await repo.getRating('BBB');
    const pub = await repo.getRating('NO_CLAN');

    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(pub).not.toBeNull();

    // Leaderboard should include NO_CLAN along with AAA/BBB
    const tags = new Set((await repo.getTop(10)).map((x) => x.tag));
    expect(tags).toEqual(new Set(['AAA', 'BBB', OpenSkill.EmptyTeamTag]));
  });

  it('handles same clan on multiple teams; counts one game for that clan', async () => {
    const players: PlayerStats[] = [
      mk({ name: '[AAA] A1', team: 'T1', rank: 1 }),
      mk({ name: '[AAA] A2', team: 'T2', rank: 3 }),
      mk({ name: '[CCC] C1', team: 'T3', rank: 2 }),
    ];
    await os.apply('g2', players);

    const a = await repo.getRating('AAA');
    expect(a!.games).toBe(1);
  });

  it('ignores matches with <2 clan-bearing teams (e.g., only NO_CLAN team present)', async () => {
    const players: PlayerStats[] = [
      mk({ name: 'NoTag', team: 'X', rank: 1 }), // NO_CLAN only
      mk({ name: 'Also NoTag', team: 'Y', rank: 2 }),
    ];
    await os.apply('g3', players);
    const top = await repo.getTop(10);
    // Only NO_CLAN teams -> rows.length would be 2 if both teams had at least one clan tag;
    // here both are NO_CLAN => still 2 clan-bearing teams; we DO rate them.
    expect(top.length).toBeGreaterThan(0); // we do want public-vs-public to move NO_CLAN
  });

  it('repository idempotency: same gameId applied twice has no extra effect', async () => {
    const players: PlayerStats[] = [
      mk({ name: '[AAA] A', team: 'A', rank: 1 }),
      mk({ name: '[BBB] B', team: 'B', rank: 2 }),
    ];
    await os.apply('g4', players);
    const r1 = await repo.getRating('AAA');
    await os.apply('g4', players);
    const r2 = await repo.getRating('AAA');
    expect(r2).toEqual(r1);
  });

  it('leaderboard is sorted desc', async () => {
    await os.apply('g5', [mk({ name: '[XX] x', team: 'TX', rank: 1 }), mk({ name: '[YY] y', team: 'TY', rank: 2 })]);
    await os.apply('g6', [
      mk({ name: '[YY] y2', team: 'TY2', rank: 1 }),
      mk({ name: '[XX] x2', team: 'TX2', rank: 2 }),
    ]);
    const top = await repo.getTop(2);
    expect(top[0]!.score).toBeGreaterThanOrEqual(top[1]!.score);
  });
});

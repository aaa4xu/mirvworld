// @ts-ignore - lua script
import applyRatingScript from '../Redis/ApplyRating/ApplyRating.lua' with { type: 'text' };
import { RedisClient } from 'bun';
import { type ClanRating, ClanRatingSchema } from '../Schema/ClanRating.ts';
import { RedisLuaScript } from '@mirvworld/redis-script';
import { ApplyRatingResultSchema } from '../Redis/ApplyRating/Schema.ts';
import type { ClanDelta, ClanRatingRepository, ClanRatingScore, DefaultParams } from './ClanRatingRepository.ts';

export class RedisClanRatingRepository implements ClanRatingRepository {
  private readonly k: number;
  private readonly mu0: number;
  private readonly sigma0: number;

  public constructor(
    private readonly redis: RedisClient,
    params: Partial<DefaultParams> = {},
    private readonly leaderboardKey = 'matches:rating:clans:leaderboard',
    private readonly ratingKeyPrefix = 'matches:rating:clans:rating',
    private readonly processedKeyPrefix = 'matches:rating:clans:processed',
  ) {
    this.k = params.k ?? 3;
    this.mu0 = params.mu ?? 25;
    this.sigma0 = params.sigma ?? this.mu0 / this.k;
  }

  /**
   * Retrieves the clan rating for a given tag
   */
  public async getRating(tag: string): Promise<ClanRating> {
    const key = this.ratingKey(tag);
    const raw = await this.redis.hgetall(key);
    if (!raw || Object.keys(raw).length === 0) return { mu: this.mu0, sigma: this.sigma0, games: 0 };
    const parsed = ClanRatingSchema.safeParse(raw);
    if (!parsed.success) return { mu: this.mu0, sigma: this.sigma0, games: 0 };
    return parsed.data;
  }

  /**
   * Retrieves the top elements from the leaderboard, sorted by score in descending order
   */
  public async getTop(limit = 50, offset = 0): Promise<Array<ClanRatingScore>> {
    const res = await this.redis.send('ZREVRANGE', [
      this.leaderboardKey,
      offset.toString(),
      (offset + limit - 1).toString(),
      'WITHSCORES',
    ]);
    const arr = Array.isArray(res) ? res : [];

    return arr.map((r) => ({ tag: r[0], score: parseFloat(r[1]) }));
  }

  public async applyDeltas(gameId: string, deltas: ClanDelta[]): Promise<void> {
    deltas = deltas.map((d) => ({ ...d, tag: this.normalizeClanTag(d.tag) }));

    if (deltas.length === 0) return;

    const keys = [this.processedKey(gameId), this.leaderboardKey, ...deltas.map((d) => this.ratingKey(d.tag))];

    const args = [
      gameId,
      String(deltas.length),
      String(this.k),
      String(this.mu0),
      String(this.sigma0),
      ...deltas.flatMap((d) => [d.tag, String(d.dMu), String(d.dSigma), String(d.dGames)]),
    ];

    const script = new RedisLuaScript({
      redis: this.redis,
      source: applyRatingScript,
      keys: keys.length,
      args: args.length,
      schema: ApplyRatingResultSchema,
    });

    await script.execute(keys, args);
  }

  private ratingKey(tag: string) {
    return `${this.ratingKeyPrefix}:${this.normalizeClanTag(tag)}`;
  }

  private processedKey(gameId: string) {
    return `${this.processedKeyPrefix}:${gameId}`;
  }

  private normalizeClanTag(raw: string): string {
    return raw.trim().toUpperCase();
  }
}
